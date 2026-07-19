import { useEffect, useState, useSyncExternalStore } from "react";
import { bugStore, type BugEntry } from "@/lib/bug-store";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("bug-diary:change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("bug-diary:change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useBugs(): BugEntry[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const bugs = useSyncExternalStore(
    subscribe,
    () => bugStore.list(),
    () => [],
  );
  return hydrated ? bugs : [];
}

export function useBug(id: string | undefined): BugEntry | undefined {
  const bugs = useBugs();
  return id ? bugs.find((b) => b.id === id) : undefined;
}
