import { supabase } from "@/integrations/supabase/client";
import { getUser, openAuth } from "@/lib/auth";
import { loadFeed } from "@/lib/posts";

/** Report, block and own-post deletion for signed-in members. */
export async function reportContent(target_type: "post" | "user" | "comment", target_id: string, reason: string) {
  const user = getUser();
  if (!user) { openAuth(); return { error: "Sign in to report." }; }
  const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type, target_id, reason: reason.trim().slice(0, 300) || "Inappropriate" });
  return error ? { error: "Couldn't send report." } : { ok: true as const };
}

export async function blockUser(blocked_id: string) {
  const user = getUser();
  if (!user) { openAuth(); return { error: "Sign in to block." }; }
  if (blocked_id === user.id) return { error: "You can't block yourself." };
  const { error } = await supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id });
  if (error) return { error: "Couldn't block." };
  await loadFeed();
  return { ok: true as const };
}

export async function deletePost(id: string, mediaPath: string) {
  const user = getUser();
  if (!user) return { error: "Sign in first." };
  const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Couldn't delete post." };
  await supabase.storage.from("posts").remove([mediaPath]);
  await loadFeed();
  return { ok: true as const };
}
