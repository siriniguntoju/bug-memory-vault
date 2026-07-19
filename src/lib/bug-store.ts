export type Difficulty = "easy" | "medium" | "hard" | "nightmare";

export interface BugEntry {
  id: string;
  title: string;
  description: string;
  errorMessage: string;
  technologies: string[];
  rootCause: string;
  solution: string;
  steps: string;
  codeSnippet: string;
  codeLanguage: string;
  tags: string[];
  difficulty: Difficulty;
  resolvedAt: string; // ISO date
  favorite: boolean;
  createdAt: string;
}

const KEY = "bug-diary:bugs:v1";

function read(): BugEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedInitial();
    return JSON.parse(raw) as BugEntry[];
  } catch {
    return [];
  }
}

function write(bugs: BugEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(bugs));
  window.dispatchEvent(new CustomEvent("bug-diary:change"));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seedInitial(): BugEntry[] {
  const now = new Date().toISOString();
  const seed: BugEntry[] = [
    {
      id: uid(),
      title: "React infinite re-render on useEffect",
      description:
        "Component kept re-rendering, hitting max update depth after adding an effect that fetched user data.",
      errorMessage:
        "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.",
      technologies: ["React", "TypeScript"],
      rootCause:
        "Passed an object literal as a dependency to useEffect — new reference on every render triggered the effect again.",
      solution:
        "Memoized the dependency with useMemo and moved primitives into the dep array instead of the object.",
      steps:
        "1. Reproduced with React DevTools profiler\n2. Located the offending useEffect\n3. Logged deps to confirm reference identity change\n4. Refactored to primitive deps",
      codeSnippet: `// Before\nuseEffect(() => {\n  fetchUser(opts);\n}, [opts]);\n\n// After\nconst { id, includeRoles } = opts;\nuseEffect(() => {\n  fetchUser({ id, includeRoles });\n}, [id, includeRoles]);`,
      codeLanguage: "tsx",
      tags: ["hooks", "performance"],
      difficulty: "medium",
      resolvedAt: now,
      favorite: true,
      createdAt: now,
    },
    {
      id: uid(),
      title: "Docker container exits immediately",
      description: "Container built fine but exited with code 0 on `docker run`.",
      errorMessage: "container exited with code 0",
      technologies: ["Docker"],
      rootCause:
        "CMD was a shell script that finished — no long-running process to keep the container alive.",
      solution: "Changed CMD to run the server binary in the foreground (no daemon flag).",
      steps: "docker logs <id>\nInspect ENTRYPOINT/CMD\nRun with -it for interactive debugging",
      codeSnippet: `# Before\nCMD ["./start.sh"]\n\n# After\nCMD ["node", "dist/server.js"]`,
      codeLanguage: "docker",
      tags: ["containers", "deployment"],
      difficulty: "easy",
      resolvedAt: now,
      favorite: false,
      createdAt: now,
    },
    {
      id: uid(),
      title: "PostgreSQL deadlock on concurrent updates",
      description: "Two workers updating overlapping rows caused deadlocks under load.",
      errorMessage: 'ERROR: deadlock detected\nDETAIL: Process 123 waits for ShareLock on transaction 456',
      technologies: ["PostgreSQL", "Node.js"],
      rootCause: "Workers acquired row locks in inconsistent order across transactions.",
      solution:
        "Ordered updates by primary key inside each transaction and added a short retry with exponential backoff.",
      steps:
        "Enabled log_lock_waits\nCaptured pg_stat_activity during deadlock\nIdentified conflicting update order",
      codeSnippet: `BEGIN;\nSELECT id FROM jobs WHERE status = 'pending'\n  ORDER BY id\n  FOR UPDATE SKIP LOCKED\n  LIMIT 10;\nCOMMIT;`,
      codeLanguage: "sql",
      tags: ["database", "concurrency"],
      difficulty: "hard",
      resolvedAt: now,
      favorite: true,
      createdAt: now,
    },
  ];
  write(seed);
  return seed;
}

export const bugStore = {
  list(): BugEntry[] {
    return read();
  },
  get(id: string): BugEntry | undefined {
    return read().find((b) => b.id === id);
  },
  create(input: Omit<BugEntry, "id" | "createdAt" | "favorite"> & { favorite?: boolean }): BugEntry {
    const bug: BugEntry = {
      ...input,
      favorite: input.favorite ?? false,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    write([bug, ...read()]);
    return bug;
  },
  update(id: string, patch: Partial<BugEntry>): BugEntry | undefined {
    const bugs = read();
    const idx = bugs.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    bugs[idx] = { ...bugs[idx], ...patch, id };
    write(bugs);
    return bugs[idx];
  },
  delete(id: string) {
    write(read().filter((b) => b.id !== id));
  },
  toggleFavorite(id: string) {
    const b = this.get(id);
    if (b) this.update(id, { favorite: !b.favorite });
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "easy", color: "text-terminal-green" },
  medium: { label: "medium", color: "text-terminal-cyan" },
  hard: { label: "hard", color: "text-terminal-yellow" },
  nightmare: { label: "nightmare", color: "text-terminal-red" },
};
