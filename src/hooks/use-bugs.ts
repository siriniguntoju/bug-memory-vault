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

const EMPTY: BugEntry[] = [];
let cachedSnapshot: BugEntry[] | undefined;
let cachedRaw: string | undefined;

function getSnapshot(): BugEntry[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem("bug-diary:bugs:v1");
  if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = bugStore.list();
  return cachedSnapshot;
}

function getServerSnapshot(): BugEntry[] {
  return EMPTY;
}

export function useBugs(): BugEntry[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const bugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return hydrated ? bugs : EMPTY;
}

export function useBug(id: string | undefined): BugEntry | undefined {
  const bugs = useBugs();
  return id ? bugs.find((b) => b.id === id) : undefined;
}
