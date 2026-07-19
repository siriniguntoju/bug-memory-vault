import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BugForm } from "@/components/bug-form";

export const Route = createFileRoute("/bugs/new")({
  head: () => ({
    meta: [
      { title: "Log a new bug — Bug Diary" },
      { name: "description", content: "Document a new debugging experience in your Bug Diary." },
    ],
  }),
  component: NewBug,
});

function NewBug() {
  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> back
      </Link>
      <div>
        <div className="text-xs text-terminal-green">$ git commit -m "new bug"</div>
        <h1 className="mt-1 text-2xl font-bold">Log a bug</h1>
        <p className="text-sm text-muted-foreground">Capture what happened, why, and how you fixed it.</p>
      </div>
      <BugForm />
    </div>
  );
}
