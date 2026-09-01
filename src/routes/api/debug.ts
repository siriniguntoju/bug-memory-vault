import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const analysisSchema = z.object({
  summary: z.string(),
  rootCause: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  issues: z.array(
    z.object({
      line: z.number().nullable(),
      title: z.string(),
      explanation: z.string(),
    }),
  ),
  fixExplanation: z.string(),
  fixedCode: z.string(),
  suggestedTitle: z.string(),
  suggestedTags: z.array(z.string()),
  technologies: z.array(z.string()),
});

export type DebugAnalysis = z.infer<typeof analysisSchema>;

// Per-client usage quota to prevent anonymous abuse of the paid AI model.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const usage = new Map<string, { count: number; resetAt: number }>();

function checkQuota(clientId: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  // Opportunistic cleanup so the map cannot grow without bound.
  if (usage.size > 5000) {
    for (const [k, v] of usage) if (v.resetAt <= now) usage.delete(k);
  }
  const entry = usage.get(clientId);
  if (!entry || entry.resetAt <= now) {
    usage.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ??
    (forwarded ? forwarded.split(",")[0]!.trim() : null) ??
    "unknown"
  );
}

export const Route = createFileRoute("/api/debug")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const MAX_CODE = 8000;
        const MAX_ERROR = 4000;
        const MAX_LANG = 20;
        const MAX_BODY = 32_000;

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BODY) {
          return new Response("Request too large.", { status: 413 });
        }

        const raw = await request.text();
        if (raw.length > MAX_BODY) {
          return new Response("Request too large.", { status: 413 });
        }

        let parsed: { code?: string; errorMessage?: string; language?: string };
        try {
          parsed = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON.", { status: 400 });
        }

        const code = typeof parsed.code === "string" ? parsed.code : "";
        const errorMessage = typeof parsed.errorMessage === "string" ? parsed.errorMessage : "";
        const language = typeof parsed.language === "string" ? parsed.language.slice(0, MAX_LANG) : "";

        if (!code && !errorMessage) {
          return new Response("Provide code or an error message.", { status: 400 });
        }
        if (code.length > MAX_CODE) {
          return new Response(`Code exceeds ${MAX_CODE} character limit.`, { status: 413 });
        }
        if (errorMessage.length > MAX_ERROR) {
          return new Response(`Error message exceeds ${MAX_ERROR} character limit.`, { status: 413 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
        const model = gateway("openai/gpt-5.5");

        const prompt = `You are DebugBuddy, a senior developer assistant. Analyze the following ${language || "code"} snippet and/or error message. Identify bugs, root cause, and a fix.

Return concise, developer-friendly output. Reference 1-indexed line numbers from the code (use null when a line does not apply). Keep fixedCode as complete, drop-in replacement code in the same language when possible.

--- LANGUAGE ---
${language || "unknown"}

--- CODE ---
${code || "(no code provided)"}

--- ERROR / LOGS ---
${errorMessage || "(no error provided)"}`;

        try {
          const { output } = await generateText({
            model,
            output: Output.object({ schema: analysisSchema }),
            prompt,
          });
          return Response.json(output);
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return new Response("The model returned malformed output. Try again.", { status: 502 });
          }
          const message = error instanceof Error ? error.message : "Unknown error";
          const status = /rate|429/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
          return new Response(message, { status });
        }
      },
    },
  },
});
