import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type MyProfile = { id: string; username: string; display_name: string | null; bio: string | null; arem_score: number | null; avatar_path: string | null; avatar_url: string | null };
type State = { ready: boolean; user: User | null; profile: MyProfile | null; authOpen: boolean };

let state: State = { ready: false, user: null, profile: null, authOpen: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };
const SERVER: State = { ready: false, user: null, profile: null, authOpen: false };

async function loadProfile(user: User | null) {
  if (!user) return set({ user: null, profile: null, ready: true });
  set({ user, ready: true });
  const { data } = await supabase.from("profiles").select("id,username,display_name,bio,arem_score,avatar_path").eq("id", user.id).maybeSingle();
  let avatar_url: string | null = null;
  if (data?.avatar_path) avatar_url = (await supabase.storage.from("posts").createSignedUrl(data.avatar_path, 60 * 60 * 24 * 7)).data?.signedUrl ?? null;
  set({ profile: data ? { ...data, avatar_url } : null });
}
export const refreshProfile = () => loadProfile(state.user);

let started = false;
export function startAuth() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    void loadProfile(session?.user ?? null);
    if (event === "SIGNED_IN") set({ authOpen: false });
  });
  void supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));
}

export function useAuth() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => SERVER);
}
export const getUser = () => state.user;
export const openAuth = () => set({ authOpen: true });
export const closeAuth = () => set({ authOpen: false });
export const signOut = () => supabase.auth.signOut();
export const subscribeAuth = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
