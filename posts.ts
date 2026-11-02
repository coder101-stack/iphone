import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUser, openAuth, refreshProfile, subscribeAuth } from "@/lib/auth";

/** Member posts saved to their account; media lives in the private "posts" bucket, served via signed URLs. */
export type MemberPost = {
  id: string; userId: string; username: string; score: number | null;
  kind: string; url: string; video: boolean; sneaker: string; caption: string; tags: string[]; date: string; mediaPath: string;
};

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/quicktime": "mov" };
const DAY = 60 * 60 * 24 * 7;

export async function signedUrl(path: string) {
  const { data } = await supabase.storage.from("posts").createSignedUrl(path, DAY);
  return data?.signedUrl ?? "";
}

async function toPosts(rows: { id: string; user_id: string; kind: string; media_path: string; is_video: boolean; sneaker: string; caption: string; tags: string[]; created_at: string; profiles: { username: string; arem_score: number | null } | null }[]) {
  if (rows.length === 0) return [];
  const { data } = await supabase.storage.from("posts").createSignedUrls(rows.map((r) => r.media_path), DAY);
  return rows.map((r, i) => ({
    id: r.id, userId: r.user_id, username: r.profiles?.username ?? "member", score: r.profiles?.arem_score ?? null,
    kind: r.kind, url: data?.[i]?.signedUrl ?? "", video: r.is_video, sneaker: r.sneaker, caption: r.caption, tags: r.tags, date: r.created_at, mediaPath: r.media_path,
  }));
}

const SELECT = "id,user_id,kind,media_path,is_video,sneaker,caption,tags,created_at,profiles(username,arem_score)";
let feed: MemberPost[] = [];
const EMPTY: MemberPost[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Feed request status, so screens can show loading / error states instead of a false "empty". */
export type FeedStatus = "loading" | "ready" | "error";
let status: FeedStatus = "loading";
const statusListeners = new Set<() => void>();
const setStatus = (next: FeedStatus) => { status = next; statusListeners.forEach((l) => l()); };

export async function loadFeed() {
  setStatus("loading");
  try {
    const { data, error } = await supabase.from("posts").select(SELECT).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    let blocked = new Set<string>();
    const me = getUser();
    if (me) { const b = await supabase.from("blocks").select("blocked_id").eq("blocker_id", me.id); blocked = new Set((b.data ?? []).map((x) => x.blocked_id)); }
    feed = await toPosts(((data ?? []) as { user_id: string }[]).filter((r) => !blocked.has(r.user_id)) as never);
    emit();
    setStatus("ready");
  } catch {
    // Keep whatever was already loaded; surface the failure so the UI can offer a retry.
    setStatus("error");
  }
}
if (typeof window !== "undefined") { void loadFeed(); let last: string | undefined; subscribeAuth(() => { const id = getUser()?.id; if (id !== last) { last = id; void loadFeed(); } }); }

export function useFeedStatus(): FeedStatus {
  return useSyncExternalStore((l) => { statusListeners.add(l); return () => statusListeners.delete(l); }, () => status, () => "loading" as FeedStatus);
}

export function useMemberPosts() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => feed, () => EMPTY);
}
export function useMyPosts() {
  const all = useMemberPosts();
  const id = getUser()?.id;
  return id ? all.filter((p) => p.userId === id) : EMPTY;
}

export async function publishPost(input: { file: File; kind: string; sneaker: string; caption: string; tags: string[] }) {
  const user = getUser();
  if (!user) { openAuth(); return { error: "Sign in to post." }; }
  const path = `${user.id}/${crypto.randomUUID()}.${EXT[input.file.type] ?? "bin"}`;
  const up = await supabase.storage.from("posts").upload(path, input.file, { contentType: input.file.type });
  if (up.error) return { error: "Upload failed. Check your connection and try again." };
  const { error } = await supabase.from("posts").insert({
    user_id: user.id, kind: input.kind, media_path: path, is_video: input.file.type.startsWith("video/"),
    sneaker: input.sneaker.trim().slice(0, 120), caption: input.caption.trim().slice(0, 300), tags: input.tags.slice(0, 9),
  });
  if (error) { await supabase.storage.from("posts").remove([path]); return { error: "Couldn't save your post." }; }
  await loadFeed();
  return { ok: true as const };
}

export async function uploadAvatar(file: File) {
  const user = getUser();
  if (!user) return { error: "Sign in first." };
  const path = `${user.id}/avatar-${Date.now()}.${EXT[file.type] ?? "jpg"}`;
  const up = await supabase.storage.from("posts").upload(path, file, { contentType: file.type });
  if (up.error) return { error: "Upload failed." };
  return { path };
}

export async function updateProfile(patch: { username: string; display_name: string; bio: string; avatar_path?: string }) {
  const user = getUser();
  if (!user) return { error: "Sign in first." };
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: error.code === "23505" ? "That username is taken." : error.code === "23514" ? "Username: 3–24 lowercase letters, numbers, dots or underscores." : "Couldn't save your profile." };
  await refreshProfile();
  await loadFeed();
  return { ok: true as const };
}
