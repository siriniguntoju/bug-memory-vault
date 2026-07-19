import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Lightweight token highlighter — no external deps.
// Handles a handful of common languages well enough for a diary.
type Token = { text: string; cls: string };

const KEYWORDS: Record<string, string[]> = {
  js: ["const","let","var","function","return","if","else","for","while","await","async","import","from","export","default","new","try","catch","finally","throw","class","extends","typeof","instanceof","of","in","this"],
  ts: ["const","let","var","function","return","if","else","for","while","await","async","import","from","export","default","new","try","catch","finally","throw","class","extends","typeof","instanceof","of","in","this","interface","type","enum","as","implements","public","private","protected","readonly"],
  py: ["def","return","if","elif","else","for","while","import","from","as","class","try","except","finally","raise","with","lambda","yield","pass","None","True","False","and","or","not","in","is"],
  sql: ["SELECT","FROM","WHERE","INSERT","UPDATE","DELETE","VALUES","INTO","SET","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP","BY","ORDER","LIMIT","OFFSET","AND","OR","NOT","NULL","AS","BEGIN","COMMIT","ROLLBACK","FOR","UPDATE","SKIP","LOCKED"],
  docker: ["FROM","RUN","CMD","LABEL","ENV","EXPOSE","COPY","ADD","ENTRYPOINT","VOLUME","USER","WORKDIR","ARG","ONBUILD","STOPSIGNAL","HEALTHCHECK","SHELL"],
  bash: ["if","then","else","fi","for","in","do","done","while","case","esac","function","return","export","local"],
};

function normLang(lang: string): keyof typeof KEYWORDS | "plain" {
  const l = lang.toLowerCase().trim();
  if (["js","jsx","javascript","node"].includes(l)) return "js";
  if (["ts","tsx","typescript"].includes(l)) return "ts";
  if (["py","python"].includes(l)) return "py";
  if (["sql","postgres","postgresql","mysql"].includes(l)) return "sql";
  if (["docker","dockerfile"].includes(l)) return "docker";
  if (["bash","sh","shell","zsh"].includes(l)) return "bash";
  return "plain";
}

function tokenize(source: string, lang: string): Token[] {
  const kind = normLang(lang);
  const keywords = kind === "plain" ? [] : KEYWORDS[kind];
  const isSqlLike = kind === "sql" || kind === "docker";
  const tokens: Token[] = [];

  // Regex covers comments, strings, numbers, identifiers, punctuation.
  const re = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|[A-Za-z_$][A-Za-z0-9_$]*|\s+|.)/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const t = m[0];
    if (/^\/\//.test(t) || /^#/.test(t) || /^\/\*/.test(t)) {
      tokens.push({ text: t, cls: "text-muted-foreground italic" });
    } else if (/^["'`]/.test(t)) {
      tokens.push({ text: t, cls: "text-terminal-yellow" });
    } else if (/^\d/.test(t)) {
      tokens.push({ text: t, cls: "text-terminal-magenta" });
    } else if (/^[A-Za-z_$]/.test(t)) {
      const cmp = isSqlLike ? t.toUpperCase() : t;
      if (keywords.includes(cmp)) {
        tokens.push({ text: t, cls: "text-terminal-cyan font-semibold" });
      } else {
        tokens.push({ text: t, cls: "" });
      }
    } else {
      tokens.push({ text: t, cls: /[{}()[\];,.:]/.test(t) ? "text-muted-foreground" : "" });
    }
  }
  return tokens;
}

export function CodeBlock({
  code,
  language = "plain",
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  return (
    <div className={cn("group relative overflow-hidden rounded-md border bg-background/60", className)}>
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terminal-red/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-terminal-yellow/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-terminal-green/70" />
        </div>
        <span className="text-muted-foreground">{language || "plain"}</span>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {tokens.map((t, i) => (
            <span key={i} className={t.cls}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
