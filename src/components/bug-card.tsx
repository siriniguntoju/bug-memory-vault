import { Link } from "@tanstack/react-router";
import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bugStore, DIFFICULTY_META, type BugEntry } from "@/lib/bug-store";
import { cn } from "@/lib/utils";

export function BugCard({ bug }: { bug: BugEntry }) {
  const diff = DIFFICULTY_META[bug.difficulty];
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border bg-card p-5 transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/bugs/$id"
          params={{ id: bug.id }}
          className="flex-1 text-base font-semibold leading-tight text-foreground hover:text-primary"
        >
          <span className="text-terminal-green">$</span> {bug.title}
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            bugStore.toggleFavorite(bug.id);
          }}
          aria-label="Toggle favorite"
        >
          <Star
            className={cn("h-4 w-4", bug.favorite ? "fill-terminal-yellow text-terminal-yellow" : "text-muted-foreground")}
          />
        </Button>
      </div>

      {bug.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{bug.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {bug.technologies.slice(0, 4).map((t) => (
          <Badge key={t} variant="outline" className="border-terminal-cyan/40 text-terminal-cyan">
            {t}
          </Badge>
        ))}
        {bug.tags.slice(0, 3).map((t) => (
          <Badge key={t} variant="secondary" className="text-muted-foreground">
            #{t}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span className={cn("font-semibold uppercase tracking-wider", diff.color)}>
          [{diff.label}]
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(bug.resolvedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
