import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, AlertTriangle, Wand2, BookmarkPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeBlock } from "@/components/code-block";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { bugStore } from "@/lib/bug-store";
import type { DebugAnalysis } from "./api/debug";

export const Route = createFileRoute("/debug")({
  head: () => ({
    meta: [
      { title: "DebugBuddy — AI debugging assistant" },
      {
        name: "description",
        content:
          "Paste code or errors and let DebugBuddy find bugs, explain root causes, and suggest fixes.",
      },
    ],
  }),
  component: DebugBuddyPage,
});

const LANGUAGES = ["ts", "tsx", "js", "jsx", "py", "sql", "docker", "bash", "json", "yaml", "plain"];

const SEVERITY_COLOR: Record<string, string> = {
  low: "text-terminal-green",
  medium: "text-terminal-cyan",
  high: "text-terminal-yellow",
  critical: "text-terminal-red",
};

function DebugBuddyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("ts");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DebugAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  const highlightedLines = useMemo(() => {
    const set = new Set<number>();
    analysis?.issues.forEach((i) => i.line && set.add(i.line));
    return set;
  }, [analysis]);

  const analyze = async () => {
    if (!code.trim() && !errorMessage.trim()) {
      toast.error("Paste some code or an error first");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, errorMessage, language }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) toast.error("Rate limited. Please try again shortly.");
        else if (res.status === 402) toast.error("AI credits exhausted. Add credits to continue.");
        else toast.error(text || "Analysis failed");
        return;
      }
      const data = (await res.json()) as DebugAnalysis;
      setAnalysis(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyFix = async () => {
    if (!analysis?.fixedCode) return;
    await navigator.clipboard.writeText(analysis.fixedCode);
    setCopied(true);
    toast.success("Fixed code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const saveToDiary = () => {
    if (!analysis) return;
    const bug = bugStore.create({
      title: analysis.suggestedTitle || "Untitled bug",
      description: analysis.summary,
      errorMessage,
      technologies: analysis.technologies,
      rootCause: analysis.rootCause,
      solution: analysis.fixExplanation,
      steps: analysis.issues
        .map((i, idx) => `${idx + 1}. ${i.title}${i.line ? ` (line ${i.line})` : ""} — ${i.explanation}`)
        .join("\n"),
      codeSnippet: analysis.fixedCode || code,
      codeLanguage: language,
      tags: analysis.suggestedTags,
      difficulty: "medium",
      resolvedAt: new Date().toISOString(),
      favorite: false,
    });
    toast.success("Saved to Bug Diary");
    navigate({ to: "/bugs/$id", params: { id: bug.id } });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-terminal-green">$ debugbuddy --analyze</div>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          DebugBuddy
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a code snippet, an error message, or both. DebugBuddy will find bugs, explain them, and suggest a fix.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-card/40 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-terminal-green">// code.input</div>
            <div className="w-32">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            placeholder="// paste code here"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-3 rounded-lg border bg-card/40 p-4">
          <div className="text-xs uppercase tracking-wider text-terminal-red">// error.log</div>
          <Textarea
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            rows={16}
            placeholder="TypeError: cannot read properties of undefined..."
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={analyze} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {loading ? "analyzing…" : "$ analyze"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setCode("");
            setErrorMessage("");
            setAnalysis(null);
          }}
        >
          clear
        </Button>
        <div className="ml-auto">
          <Label htmlFor="none" className="sr-only">status</Label>
          {analysis && (
            <span className={cn("text-xs", SEVERITY_COLOR[analysis.severity])}>
              severity: {analysis.severity}
            </span>
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-5">
          <section className="rounded-lg border bg-card/40 p-5">
            <div className="text-xs uppercase tracking-wider text-terminal-cyan">// summary</div>
            <p className="mt-2 text-sm">{analysis.summary}</p>
          </section>

          <section className="rounded-lg border bg-card/40 p-5">
            <div className="text-xs uppercase tracking-wider text-terminal-yellow">// root cause</div>
            <p className="mt-2 text-sm">{analysis.rootCause}</p>
          </section>

          {analysis.issues.length > 0 && (
            <section className="rounded-lg border bg-card/40 p-5">
              <div className="text-xs uppercase tracking-wider text-terminal-red">// issues detected</div>
              <ul className="mt-3 space-y-3">
                {analysis.issues.map((issue, i) => (
                  <li key={i} className="flex gap-3 rounded-md border border-border/50 bg-background/40 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-terminal-yellow" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{issue.title}</span>
                        {issue.line !== null && (
                          <span className="rounded bg-terminal-red/15 px-1.5 py-0.5 font-mono text-[11px] text-terminal-red">
                            line {issue.line}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{issue.explanation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {code.trim() && highlightedLines.size > 0 && (
            <section className="rounded-lg border bg-card/40 p-5">
              <div className="text-xs uppercase tracking-wider text-terminal-magenta">// highlighted source</div>
              <div className="mt-3">
                <HighlightedSource code={code} lines={highlightedLines} />
              </div>
            </section>
          )}

          {analysis.fixedCode && (
            <section className="rounded-lg border bg-card/40 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-terminal-green">// suggested fix</div>
                <Button size="sm" variant="ghost" onClick={copyFix}>
                  {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  copy
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{analysis.fixExplanation}</p>
              <div className="mt-3">
                <CodeBlock code={analysis.fixedCode} language={language} />
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveToDiary}>
              <BookmarkPlus className="mr-2 h-4 w-4" /> save to Bug Diary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightedSource({ code, lines }: { code: string; lines: Set<number> }) {
  const rows = code.split("\n");
  return (
    <div className="overflow-hidden rounded-md border bg-background/60 font-mono text-[13px]">
      <div className="max-h-[420px] overflow-auto">
        {rows.map((row, i) => {
          const n = i + 1;
          const hit = lines.has(n);
          return (
            <div
              key={i}
              className={cn(
                "flex gap-3 px-3 py-0.5 leading-relaxed",
                hit && "bg-terminal-red/10 border-l-2 border-terminal-red",
              )}
            >
              <span className={cn("w-8 shrink-0 select-none text-right text-muted-foreground", hit && "text-terminal-red")}>
                {n}
              </span>
              <span className="whitespace-pre-wrap break-words">{row || " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
