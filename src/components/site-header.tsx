import { Link } from "@tanstack/react-router";
import { Bug, BarChart3, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Bug className="h-5 w-5 text-primary" />
          <span>
            <span className="text-primary">~/</span>bug-diary
          </span>
          <span className="ml-1 h-4 w-1.5 animate-pulse bg-primary" aria-hidden />
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
              bugs
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/debug" activeProps={{ className: "text-primary" }}>
              <Sparkles className="mr-1 h-4 w-4" /> debug
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/stats" activeProps={{ className: "text-primary" }}>
              <BarChart3 className="mr-1 h-4 w-4" /> stats
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/bugs/new">
              <Plus className="mr-1 h-4 w-4" /> new
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
