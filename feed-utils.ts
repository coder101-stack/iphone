import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Removes repeated ids, keeping the first occurrence. */
export function dedupeById<T extends { id: string | number }>(list: T[]): T[] {
  const seen = new Set<string | number>();
  return list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

/** Saves have no backend table yet, so they persist on this device only (and say so). */
export const SAVED_KEY = "arem:saved-posts";

export function readSaved(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function useDeviceSaved(id: string): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(readSaved().includes(id)); }, [id]);
  const toggle = () => {
    const next = !saved;
    setSaved(next);
    try {
      const list = new Set(readSaved());
      if (next) list.add(id); else list.delete(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify([...list]));
    } catch { /* storage unavailable — state stays in memory */ }
    toast(next ? "Saved on this device" : "Removed from saved");
  };
  return [saved, toggle];
}

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
