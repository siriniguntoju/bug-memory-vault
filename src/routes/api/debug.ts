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

export const Route = createFileRoute("/api/debug")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { code, errorMessage, language } = (await request.json()) as {
          code?: string;
          errorMessage?: string;
          language?: string;
        };

        if (!code && !errorMessage) {
          return new Response("Provide code or an error message.", { status: 400 });
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
