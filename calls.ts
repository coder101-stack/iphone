import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUser, openAuth, subscribeAuth } from "@/lib/auth";
import { trends } from "@/lib/trends-data";

export type CallRecord = {
  model: string;
  brand: string;
  colorway: string;
  image: string;
  calledScore: number;
  date: string;
  reason: string;
};

/** Calls are saved to the signed-in member's account. */
const EMPTY: CallRecord[] = [];
let calls: CallRecord[] = [];
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const imageFor = (model: string) => trends.find((t) => t.model === model)?.image ?? "";

async function load() {
  const user = getUser();
  if ((user?.id ?? null) === loadedFor) return;
  loadedFor = user?.id ?? null;
  if (!user) { calls = []; emit(); return; }
  const { data } = await supabase.from("calls").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  calls = (data ?? []).map((c) => ({ model: c.model, brand: c.brand, colorway: c.colorway, image: imageFor(c.model), calledScore: c.called_score, date: c.created_at, reason: c.reason }));
  emit();
}
if (typeof window !== "undefined") subscribeAuth(() => void load());

export async function addCall(record: CallRecord) {
  const user = getUser();
  if (!user) { openAuth(); return false; }
  const { error } = await supabase.from("calls").insert({ user_id: user.id, model: record.model, brand: record.brand, colorway: record.colorway, called_score: record.calledScore, reason: record.reason.slice(0, 600) });
  if (error) { toast(error.code === "23505" ? "You already called this one" : "Couldn't save your call"); return false; }
  calls = [record, ...calls.filter((c) => c.model !== record.model)];
  emit();
  return true;
}

export function useCalls() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => calls, () => EMPTY);
}

export function getCallResult(call: CallRecord) {
  const current = trends.find((t) => t.model === call.model)?.score ?? call.calledScore;
  const delta = current - call.calledScore;
  const label = delta > 0 ? "RISING" : delta < 0 ? "FALLING" : "HOLDING";
  return { current, delta, label };
}
