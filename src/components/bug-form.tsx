import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bugStore, type BugEntry, type Difficulty } from "@/lib/bug-store";
import { toast } from "sonner";

function parseList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function BugForm({ initial }: { initial?: BugEntry }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errorMessage, setErrorMessage] = useState(initial?.errorMessage ?? "");
  const [technologies, setTechnologies] = useState((initial?.technologies ?? []).join(", "));
  const [rootCause, setRootCause] = useState(initial?.rootCause ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [steps, setSteps] = useState(initial?.steps ?? "");
  const [codeSnippet, setCodeSnippet] = useState(initial?.codeSnippet ?? "");
  const [codeLanguage, setCodeLanguage] = useState(initial?.codeLanguage ?? "ts");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "medium");
  const [resolvedAt, setResolvedAt] = useState(
    (initial?.resolvedAt ?? new Date().toISOString()).slice(0, 10),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      description,
      errorMessage,
      technologies: parseList(technologies),
      rootCause,
      solution,
      steps,
      codeSnippet,
      codeLanguage,
      tags: parseList(tags),
      difficulty,
      resolvedAt: new Date(resolvedAt).toISOString(),
    };
    if (initial) {
      bugStore.update(initial.id, payload);
      toast.success("Bug updated");
      navigate({ to: "/bugs/$id", params: { id: initial.id } });
    } else {
      const bug = bugStore.create({ ...payload, favorite: false });
      toast.success("Bug logged");
      navigate({ to: "/bugs/$id", params: { id: bug.id } });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section label="// identity">
        <Field label="title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of the bug" required maxLength={200} />
        </Field>
        <Field label="description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
        </Field>
      </Section>

      <Section label="// diagnostics">
        <Field label="error message / logs">
          <Textarea value={errorMessage} onChange={(e) => setErrorMessage(e.target.value)} rows={4} className="font-mono text-sm" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="technologies (comma separated)">
            <Input value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, PostgreSQL, Docker" />
          </Field>
          <Field label="tags (comma separated)">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hooks, performance" />
          </Field>
        </div>
      </Section>

      <Section label="// analysis">
        <Field label="root cause">
          <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={3} />
        </Field>
        <Field label="solution / fix applied">
          <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} />
        </Field>
        <Field label="debugging steps">
          <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} placeholder="1. Reproduced with…" />
        </Field>
      </Section>

      <Section label="// code">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <Field label="snippet">
            <Textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} rows={8} className="font-mono text-sm" />
          </Field>
          <Field label="language">
            <Select value={codeLanguage} onValueChange={setCodeLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ts","tsx","js","jsx","py","sql","docker","bash","json","yaml","plain"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section label="// metadata">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="difficulty">
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">easy</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="hard">hard</SelectItem>
                <SelectItem value="nightmare">nightmare</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="date resolved">
            <Input type="date" value={resolvedAt} onChange={(e) => setResolvedAt(e.target.value)} />
          </Field>
        </div>
      </Section>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{initial ? "$ save" : "$ commit bug"}</Button>
        <Button type="button" variant="ghost" onClick={() => navigate({ to: "/" })}>cancel</Button>
      </div>
    </form>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border bg-card/40 p-5">
      <div className="text-xs uppercase tracking-wider text-terminal-green">{label}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
