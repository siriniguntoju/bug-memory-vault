import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BugForm } from "@/components/bug-form";
import { useBug } from "@/hooks/use-bugs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bugs/$id/edit")({
  component: EditBug,
});

function EditBug() {
  const { id } = Route.useParams();
  const bug = useBug(id);

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

  return (
    <div className="space-y-6">
      <Link
        to="/bugs/$id"
        params={{ id: bug.id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> back
      </Link>
      <div>
        <div className="text-xs text-terminal-green">$ vim bug-{bug.id.slice(0, 6)}.md</div>
        <h1 className="mt-1 text-2xl font-bold">Edit bug</h1>
      </div>
      <BugForm initial={bug} />
    </div>
  );
}
