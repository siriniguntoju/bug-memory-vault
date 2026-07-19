import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Star, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CodeBlock } from "@/components/code-block";
import { useBug } from "@/hooks/use-bugs";
import { bugStore, DIFFICULTY_META } from "@/lib/bug-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/bugs/$id")({
  component: BugDetail,
});

function BugDetail() {
  const { id } = Route.useParams();
  const bug = useBug(id);
  const navigate = useNavigate();

  if (!bug) {
    return (
      <div className="rounded-lg border p-10 text-center">
        <div className="text-xs text-terminal-yellow">// not found</div>
        <h1 className="mt-2 text-xl font-semibold">This bug isn't in your diary</h1>
        <Button asChild className="mt-4">
          <Link to="/">back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const diff = DIFFICULTY_META[bug.difficulty];

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> back
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs text-terminal-green">$ cat bug-{bug.id.slice(0, 6)}.md</div>
          <h1 className="text-2xl font-bold leading-tight">{bug.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={cn("font-semibold uppercase tracking-wider", diff.color)}>[{diff.label}]</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> resolved {new Date(bug.resolvedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              bugStore.toggleFavorite(bug.id);
            }}
          >
            <Star className={cn("mr-1 h-4 w-4", bug.favorite && "fill-terminal-yellow text-terminal-yellow")} />
            {bug.favorite ? "favorited" : "favorite"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/bugs/$id/edit" params={{ id: bug.id }}>
              <Pencil className="mr-1 h-4 w-4" /> edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this bug?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the entry from your diary. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    bugStore.delete(bug.id);
                    toast.success("Bug deleted");
                    navigate({ to: "/" });
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {bug.technologies.map((t) => (
          <Badge key={t} variant="outline" className="border-terminal-cyan/50 text-terminal-cyan">
            {t}
          </Badge>
        ))}
        {bug.tags.map((t) => (
          <Badge key={t} variant="secondary">
            #{t}
          </Badge>
        ))}
      </div>

      {bug.description && <Section title="// description"><Prose text={bug.description} /></Section>}

      {bug.errorMessage && (
        <Section title="// error output">
          <pre className="max-h-64 overflow-auto rounded-md border bg-background/60 p-4 text-sm text-terminal-red">
            {bug.errorMessage}
          </pre>
        </Section>
      )}

      {bug.rootCause && <Section title="// root cause"><Prose text={bug.rootCause} /></Section>}
      {bug.solution && <Section title="// solution"><Prose text={bug.solution} /></Section>}
      {bug.steps && <Section title="// debugging steps"><Prose text={bug.steps} /></Section>}

      {bug.codeSnippet && (
        <Section title="// code">
          <CodeBlock code={bug.codeSnippet} language={bug.codeLanguage} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-card/40 p-5">
      <h2 className="text-xs uppercase tracking-wider text-terminal-green">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{text}</p>;
}
