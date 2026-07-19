import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BugCard } from "@/components/bug-card";
import { useBugs } from "@/hooks/use-bugs";
import type { Difficulty } from "@/lib/bug-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const DIFFICULTIES: (Difficulty | "all")[] = ["all", "easy", "medium", "hard", "nightmare"];

function Dashboard() {
  const bugs = useBugs();
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const { allTech, allTags } = useMemo(() => {
    const techSet = new Set<string>();
    const tagSet = new Set<string>();
    bugs.forEach((b) => {
      b.technologies.forEach((t) => techSet.add(t));
      b.tags.forEach((t) => tagSet.add(t));
    });
    return {
      allTech: [...techSet].sort(),
      allTags: [...tagSet].sort(),
    };
  }, [bugs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bugs.filter((b) => {
      if (favoritesOnly && !b.favorite) return false;
      if (difficulty !== "all" && b.difficulty !== difficulty) return false;
      if (tech && !b.technologies.includes(tech)) return false;
      if (tag && !b.tags.includes(tag)) return false;
      if (!q) return true;
      const hay = [
        b.title,
        b.description,
        b.errorMessage,
        b.rootCause,
        b.solution,
        b.steps,
        b.codeSnippet,
        b.technologies.join(" "),
        b.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bugs, query, tech, tag, difficulty, favoritesOnly]);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-muted-foreground">
          <span className="text-primary">bug-diary</span>@dev:~$ <span className="animate-pulse">▊</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Your <span className="text-primary">debugging</span> memory bank
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {bugs.length} {bugs.length === 1 ? "bug" : "bugs"} indexed · never solve the same issue twice.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border bg-card/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="grep bugs by title, error, tech, tag…"
              className="pl-9 font-mono"
              maxLength={200}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={favoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              <Star className={cn("mr-1 h-4 w-4", favoritesOnly && "fill-current")} />
              favorites
            </Button>
            <Button asChild size="sm">
              <Link to="/bugs/new">
                <Plus className="mr-1 h-4 w-4" /> new bug
              </Link>
            </Button>
          </div>
        </div>

        <FilterRow label="difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
              {d}
            </Chip>
          ))}
        </FilterRow>

        {allTech.length > 0 && (
          <FilterRow label="tech">
            <Chip active={tech === null} onClick={() => setTech(null)}>all</Chip>
            {allTech.map((t) => (
              <Chip key={t} active={tech === t} onClick={() => setTech(t === tech ? null : t)}>
                {t}
              </Chip>
            ))}
          </FilterRow>
        )}

        {allTags.length > 0 && (
          <FilterRow label="tags">
            <Chip active={tag === null} onClick={() => setTag(null)}>all</Chip>
            {allTags.map((t) => (
              <Chip key={t} active={tag === t} onClick={() => setTag(t === tag ? null : t)}>
                #{t}
              </Chip>
            ))}
          </FilterRow>
        )}
      </section>

      {filtered.length === 0 ? (
        <EmptyState hasBugs={bugs.length > 0} />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BugCard key={b.id} bug={b} />
          ))}
        </section>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-16 text-xs uppercase text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs transition",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasBugs }: { hasBugs: boolean }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <Badge variant="outline" className="border-terminal-yellow/60 text-terminal-yellow">
        {hasBugs ? "no matches" : "empty diary"}
      </Badge>
      <p className="mt-3 text-sm text-muted-foreground">
        {hasBugs
          ? "No bugs match your filters — try clearing them."
          : "Start logging bugs to build your personal debugging knowledge base."}
      </p>
      <Button asChild className="mt-4">
        <Link to="/bugs/new">
          <Plus className="mr-1 h-4 w-4" /> log your first bug
        </Link>
      </Button>
    </div>
  );
}
