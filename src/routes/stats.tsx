import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bug, Star, Zap, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBugs } from "@/hooks/use-bugs";
import { DIFFICULTY_META } from "@/lib/bug-store";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Debugging stats — Bug Diary" },
      { name: "description", content: "Insights into your debugging history: technologies, difficulty, and trends." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const bugs = useBugs();

  const { techCounts, diffCounts, monthly, favorites } = useMemo(() => {
    const tc: Record<string, number> = {};
    const dc: Record<string, number> = {};
    const mc: Record<string, number> = {};
    let favs = 0;
    bugs.forEach((b) => {
      if (b.favorite) favs++;
      b.technologies.forEach((t) => (tc[t] = (tc[t] || 0) + 1));
      dc[b.difficulty] = (dc[b.difficulty] || 0) + 1;
      const d = new Date(b.resolvedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      mc[key] = (mc[key] || 0) + 1;
    });
    return {
      techCounts: Object.entries(tc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      diffCounts: (Object.keys(DIFFICULTY_META) as (keyof typeof DIFFICULTY_META)[]).map((k) => ({
        name: k,
        value: dc[k] || 0,
      })),
      monthly: Object.entries(mc)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([name, value]) => ({ name, value })),
      favorites: favs,
    };
  }, [bugs]);

  const diffColors: Record<string, string> = {
    easy: "var(--terminal-green)",
    medium: "var(--terminal-cyan)",
    hard: "var(--terminal-yellow)",
    nightmare: "var(--terminal-red)",
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-terminal-green">$ analyze --diary</div>
        <h1 className="mt-1 text-2xl font-bold">Debugging stats</h1>
        <p className="text-sm text-muted-foreground">Trends and patterns from your fixes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Bug} label="bugs fixed" value={bugs.length} accent="text-primary" />
        <Stat icon={Star} label="favorites" value={favorites} accent="text-terminal-yellow" />
        <Stat icon={Zap} label="technologies" value={techCounts.length} accent="text-terminal-cyan" />
        <Stat
          icon={TrendingUp}
          label="this month"
          value={
            bugs.filter((b) => {
              const d = new Date(b.resolvedAt);
              const now = new Date();
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            }).length
          }
          accent="text-terminal-magenta"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="// top technologies">
          {techCounts.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={techCounts.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="// difficulty distribution">
          {bugs.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={diffCounts.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={2}
                >
                  {diffCounts.map((d) => (
                    <Cell key={d.name} fill={diffColors[d.name]} stroke="var(--background)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="// activity (last 6 months)" className="lg:col-span-2">
          {monthly.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--terminal-cyan)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-4 w-4 ${accent}`} />
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-card/40 p-5 ${className ?? ""}`}>
      <h2 className="mb-4 text-xs uppercase tracking-wider text-terminal-green">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      No data yet — log a bug to see stats.
    </div>
  );
}
