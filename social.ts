import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUser, openAuth, subscribeAuth } from "@/lib/auth";

/** Social state saved to the member's account. Guests are asked to sign in. */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

let rocks: string[] = [];
const EMPTY: string[] = [];
let rocksFor: string | null = null;

async function loadRocks() {
  const user = getUser();
  if ((user?.id ?? null) === rocksFor) return;
  rocksFor = user?.id ?? null;
  if (!user) { rocks = []; emit(); return; }
  const { data } = await supabase.from("rock_its").select("target");
  rocks = (data ?? []).map((r) => r.target);
  emit();
}
if (typeof window !== "undefined") subscribeAuth(() => void loadRocks());

/** Rock It ids: "post:<id>" or "sneaker:<model>". One per member per item. */
export function useRocked(id: string) {
  const list = useSyncExternalStore(subscribe, () => rocks, () => EMPTY);
  const rocked = list.includes(id);
  const toggle = async () => {
    const user = getUser();
    if (!user) { openAuth(); return; }
    const was = rocks.includes(id);
    rocks = was ? rocks.filter((x) => x !== id) : [...rocks, id];
    emit();
    const { error } = was
      ? await supabase.from("rock_its").delete().eq("user_id", user.id).eq("target", id)
      : await supabase.from("rock_its").upsert({ user_id: user.id, target: id });
    if (error) {
      rocks = was ? [...rocks, id] : rocks.filter((x) => x !== id);
      emit();
      toast("Couldn't save your Rock It");
    }
  };
  return [rocked, toggle] as const;
}

export type Comment = { id: string; user: string; text: string; date: string };
export const COMMENT_MAX = 300;
const commentCache = new Map<string, Comment[]>();

export function useComments(postId: string) {
  const [list, setList] = useState<Comment[]>(() => commentCache.get(postId) ?? []);
  useEffect(() => {
    let live = true;
    supabase.from("comments").select("id,body,created_at,profiles(username)").eq("post_id", postId).order("created_at")
      .then(({ data }) => {
        if (!live || !data) return;
        const mapped = data.map((c) => ({ id: c.id, text: c.body, date: c.created_at, user: (c.profiles as { username: string } | null)?.username ?? "member" }));
        commentCache.set(postId, mapped);
        setList(mapped);
      });
    return () => { live = false; };
  }, [postId]);
  const add = async (text: string) => {
    const clean = text.trim().slice(0, COMMENT_MAX);
    if (!clean) return false;
    const user = getUser();
    if (!user) { openAuth(); return false; }
    const { data, error } = await supabase.from("comments").insert({ user_id: user.id, post_id: postId, body: clean }).select("id,created_at,profiles(username)").single();
    if (error || !data) { toast("Couldn't post your comment"); return false; }
    const c: Comment = { id: data.id, text: clean, date: data.created_at, user: (data.profiles as { username: string } | null)?.username ?? "you" };
    const next = [...(commentCache.get(postId) ?? []), c];
    commentCache.set(postId, next);
    setList(next);
    return true;
  };
  return [list, add] as const;
}

/** Native share sheet when available, otherwise copy the link. */
export async function shareLink(title: string, url: string) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try { await navigator.share({ title, text: `${title} on AREM`, url }); return; }
    catch (e) { if ((e as Error).name === "AbortError") return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied");
  } catch {
    toast("Couldn't copy link", { description: url });
  }
}

export function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("en-US");
}
