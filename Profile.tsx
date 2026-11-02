import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Flame, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import portrait from "@/assets/profile-dante.jpg";
import silverRunner from "@/assets/profile-silver-runner.jpg";
import feed1 from "@/assets/feed-1.jpg";
import feed2 from "@/assets/feed-2.jpg";
import feed3 from "@/assets/feed-3.jpg";
import feed4 from "@/assets/feed-4.jpg";
import vintage from "@/assets/discover-vintage.jpg";
import skate from "@/assets/discover-skate.jpg";
import collection from "@/assets/discover-collection.jpg";
import { getAremRank } from "@/lib/arem-score";
import { AppScore } from "@/components/AppScore";
import { FocusDialog, EmptyState, ErrorState, Skeleton } from "@/components/AppStates";
import { ScoreDetails } from "@/components/ScoreDetails";
import { getCallResult, useCalls } from "@/lib/calls";
import { openAuth, signOut, useAuth } from "@/lib/auth";
import { loadFeed, useFeedStatus, useMyPosts } from "@/lib/posts";
import { EditProfile } from "@/components/EditProfile";
import { deletePost } from "@/lib/moderation";
import { deleteMyAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type ProfileTab = "POSTS" | "ON FEET" | "ROTATION" | "CALLS";
type Entry = {
  id: string;
  image: string;
  title: string;
  caption: string;
  kind: "On feet" | "Sneaker" | "Fit" | "Collection";
  tags: ProfileTab[];
  call?: { date: string; status: string };
};

const tabs: ProfileTab[] = ["POSTS", "ON FEET", "ROTATION", "CALLS"];
const entries: Entry[] = [
  { id: "1", image: silverRunner, title: "Silver season", caption: "Called the silver runner comeback before it was everywhere.", kind: "Sneaker", tags: ["POSTS", "ROTATION", "CALLS"], call: { date: "CALLED · JAN 2025", status: "ON THE RISE" } },
  { id: "2", image: feed2, title: "The uniform", caption: "Wide cargos. Clean whites. Nothing else needed.", kind: "Fit", tags: ["POSTS", "ON FEET"] },
  { id: "3", image: feed1, title: "After dark", caption: "Rainy streets and the pair I keep coming back to.", kind: "On feet", tags: ["POSTS", "ON FEET", "ROTATION"] },
  { id: "4", image: vintage, title: "Old soul", caption: "The vintage basketball revival was always coming.", kind: "Sneaker", tags: ["POSTS", "ROTATION", "CALLS"], call: { date: "CALLED · OCT 2024", status: "HIT" } },
  { id: "5", image: skate, title: "Worn right", caption: "Better with every scuff. These stay in the rotation.", kind: "On feet", tags: ["POSTS", "ON FEET", "ROTATION"] },
  { id: "6", image: feed4, title: "Volt signal", caption: "Bright details against all black. Watch this space.", kind: "Sneaker", tags: ["POSTS", "CALLS"], call: { date: "CALLED · MAR 2025", status: "WATCHING" } },
  { id: "7", image: feed3, title: "Everyday pair", caption: "The easy choice for a long day in the city.", kind: "On feet", tags: ["POSTS", "ON FEET", "ROTATION"] },
  { id: "8", image: collection, title: "In rotation", caption: "A few favorites, never just one lane.", kind: "Collection", tags: ["POSTS", "ROTATION"] },
];

export function Profile({ onCreate }: { onCreate?: () => void } = {}) {
  const [tab, setTab] = useState<ProfileTab>("POSTS");
  const [following, setFollowing] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [rockedIds, setRockedIds] = useState<string[]>([]);
  const [showScore, setShowScore] = useState(false);
  const myCalls = useCalls();
  const { user, profile } = useAuth();
  const feedStatus = useFeedStatus();
  const handle = profile?.username ?? "dante";
  const myPosts = useMyPosts();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeAccount = async () => {
    try { await deleteMyAccount(); await signOut(); toast.success("Your account was deleted."); }
    catch { toast.error("Couldn't delete your account. Try again."); }
  };
  // Signed in: the member's real score (null = pending, never 0). Guest: the labelled demo profile.
  const profileScore = user ? (profile?.arem_score ?? null) : 87;
  const scoreLoading = !!user && !profile;

  const visible = entries.filter((entry) => entry.tags.includes(tab));
  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((previous) => [...previous, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="mx-auto max-w-2xl font-display">
      <section className="px-4 pb-6 pt-7 sm:px-6">
        <div className="mb-5 flex items-center justify-between rounded-lg bg-secondary px-4 py-1 text-[13px]">
          <span className="text-muted-foreground">{user ? `Signed in as @${handle}` : "Demo profile — sign in to save your activity"}</span>
          <Button type="button" variant="ghost" onClick={() => (user ? signOut() : openAuth())} className="h-11 rounded-full px-4 text-[13px] font-semibold">{user ? "Sign out" : "Sign in"}</Button>
        </div>
        <div className="flex items-center gap-5">
          <img src={user ? profile?.avatar_url ?? portrait : portrait} alt={`Portrait of ${handle}`} width={1024} height={1024} className="h-20 w-20 shrink-0 rounded-full border border-border object-cover sm:h-24 sm:w-24" />
          <div className="min-w-0 flex-1">
            <p className="mb-3 truncate text-heading">@{handle}</p>
            <div className="flex justify-between gap-2 text-center">
              <div><strong className="block text-[17px] font-semibold leading-none">{user ? myPosts.length : 28}</strong><span className="mt-1 block text-[13px] text-muted-foreground">Posts</span></div>
              {/* No follower graph exists yet: members see "—" instead of invented numbers; demo keeps sample counts. */}
              <div><strong className="block text-[17px] font-semibold leading-none" aria-label={user ? "Followers not available yet" : undefined}>{user ? "—" : "12.4K"}</strong><span className="mt-1 block text-[13px] text-muted-foreground">Followers</span></div>
              <div><strong className="block text-[17px] font-semibold leading-none" aria-label={user ? "Following not available yet" : undefined}>{user ? "—" : "842"}</strong><span className="mt-1 block text-[13px] text-muted-foreground">Following</span></div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <h1 className="text-heading">{user ? profile?.display_name ?? handle : "Dante Quevedo"}</h1>
          <p className="mt-1 max-w-md text-[15px] leading-[1.4] text-foreground/80">{user ? profile?.bio ?? "New to AREM." : "Collecting stories, not just sneakers. Old pairs, new perspectives. Always on foot."}</p>
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">Retro <span className="mx-1 text-muted-foreground">•</span> Streetwear <span className="mx-1 text-muted-foreground">•</span> Experimental</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setShowScore(true)} disabled={scoreLoading} aria-label={scoreLoading ? "AREM Score loading" : `View AREM Score details: ${profileScore ?? "pending"}, ${getAremRank(profileScore)}`} className="mt-6 flex h-auto w-full items-center justify-start gap-5 rounded-lg border border-border bg-background px-4 py-4 text-left shadow-card hover:bg-secondary">
          <AppScore variant="profile" score={profileScore} loading={scoreLoading} />
          <span className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">AREM Score</span>
            <span className="text-caption">{profileScore === null && !scoreLoading ? "Builds as you contribute" : "View breakdown"}</span>
          </span>
          <ArrowUpRight aria-hidden="true" className="ml-auto text-muted-foreground" />
        </Button>
        {user ? (
          <Button type="button" variant="outline" onClick={() => setEditing(true)} className="mt-5 h-11 w-full rounded-sm text-[15px] font-semibold shadow-none">Edit profile</Button>
        ) : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant={following ? "outline" : "default"} aria-pressed={following} onClick={() => setFollowing((value) => !value)} className="h-11 rounded-sm text-[15px] font-semibold shadow-none">
            {following ? <><Check aria-hidden="true" /> Following</> : "Follow"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setMessaging(true)} className="h-11 rounded-sm text-[15px] font-semibold shadow-none"><MessageCircle aria-hidden="true" /> Message</Button>
        </div>
        )}
      </section>

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 grid grid-cols-4 border-y border-border bg-background" role="tablist" aria-label="Profile content">
        {tabs.map((item) => (
          <Button key={item} type="button" variant="ghost" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`relative h-12 min-w-0 rounded-none px-1 text-[11px] font-semibold tracking-[0.06em] sm:text-xs ${tab === item ? "text-foreground" : "text-muted-foreground"}`}>
            {item}
            {tab === item && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 bg-foreground" />}
          </Button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${tab} content`}>
        {tab === "CALLS" ? (
          <div className="divide-y divide-border">
            {myCalls.map((c) => {
              const r = getCallResult(c);
              return (
                <div key={c.model} className="flex items-center gap-4 px-4 py-3">
                  <img src={c.image} alt={`${c.brand} ${c.model}`} loading="lazy" className="h-24 w-24 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted-foreground">CALLED · {new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}</p>
                    <p className="mt-1 text-base font-semibold uppercase">{c.brand} {c.model}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">Called at {c.calledScore} · Now {r.current}</p>
                    <p className="mt-1 text-[11px] font-bold">{r.label} {r.delta > 0 ? `↑${r.delta}` : r.delta < 0 ? `↓${-r.delta}` : "±0"}</p>
                    {c.reason && <p className="mt-1 line-clamp-2 text-xs text-foreground/70">"{c.reason}"</p>}
                  </div>
                </div>
              );
            })}
            {user && myCalls.length === 0 && <EmptyState title="No calls yet" message="Open a sneaker in Trends and tap Call It before it rises." />}
            {!user && visible.map((entry) => (
              <Button key={entry.id} type="button" variant="ghost" onClick={() => setSelected(entry)} aria-label={`Open call: ${entry.title}`} className="flex h-auto w-full items-center justify-start gap-4 rounded-none px-4 py-3 text-left hover:bg-secondary/40">
                <img src={entry.image} alt="" loading="lazy" width={768} height={1024} className="h-24 w-24 shrink-0 object-cover" />
                <span className="min-w-0 flex-1 whitespace-normal">
                  <span className="mb-2 block text-[11px] font-bold text-muted-foreground">{entry.call?.date}</span>
                  <span className="block text-base font-semibold">{entry.title}</span>
                  <span className="mt-2 block text-[11px] font-bold text-foreground/70">{entry.call?.status}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="self-start text-muted-foreground" />
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 bg-background" aria-label={`${tab} posts`}>
            {user && myPosts.filter((p) => tab === "POSTS" || (tab === "ON FEET" && p.kind === "ON FEET") || (tab === "ROTATION" && p.kind === "COLLECTION")).map((p) => (
              <div key={p.id} className="relative aspect-[3/4] overflow-hidden">
                {p.video ? <video src={p.url} muted playsInline loop autoPlay className="absolute inset-0 h-full w-full object-cover" /> : <img src={p.url} alt={p.sneaker} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-2 right-12 truncate text-[11px] font-semibold text-white sm:text-xs">{p.sneaker}</span>
                <Button type="button" variant="ghost" size="icon" aria-label={`Delete post ${p.sneaker}`} onClick={async () => { if (!window.confirm("Delete this post?")) return; try { const r = await deletePost(p.id, p.mediaPath); if (r.error) toast.error(r.error); else toast.success("Post deleted"); } catch { toast.error("Couldn't delete the post. Try again."); } }} className="absolute right-1 top-1 h-11 w-11 rounded-full bg-black/45 text-white hover:bg-black/65 hover:text-white"><Trash2 /></Button>
              </div>
            ))}
            {user && myPosts.length === 0 && feedStatus === "loading" && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-none" />)}
            {user && myPosts.length === 0 && feedStatus === "error" && <div className="col-span-3"><ErrorState message="We couldn't load your posts." onRetry={() => void loadFeed()} /></div>}
            {user && myPosts.length === 0 && feedStatus === "ready" && <div className="col-span-3"><EmptyState title={tab === "POSTS" ? "No posts yet" : `Nothing in ${tab.toLowerCase()} yet`} message="Share your first pair with the AREM community." {...(onCreate ? { action: "Create a post", onAction: onCreate } : {})} /></div>}
            {!user && visible.map((entry) => (
              <Button key={entry.id} type="button" variant="ghost" onClick={() => setSelected(entry)} aria-label={`Open ${entry.title}`} className="group relative aspect-[3/4] h-auto w-full overflow-hidden rounded-none p-0 hover:bg-transparent">
                <img src={entry.image} alt={entry.title} loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-2 right-1 truncate text-left text-[11px] font-semibold text-white sm:text-xs">{entry.title}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <FocusDialog label={selected.title} onClose={() => setSelected(null)} className="safe-top fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center bg-background">
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
              <Button type="button" variant="ghost" size="icon" aria-label="Close post" onClick={() => setSelected(null)}><ArrowLeft /></Button>
              <span className="text-[15px] font-semibold">@{handle}</span>
              <span className="w-11" aria-hidden="true" />
            </div>
            <div className="min-h-0 flex-1 bg-secondary"><img src={selected.image} alt={selected.title} width={768} height={1024} className="h-full w-full object-contain" /></div>
            <div className="shrink-0 px-4 py-4">
              <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase text-muted-foreground">{selected.kind}{selected.call ? ` · ${selected.call.status}` : ""}</span><Button type="button" variant="ghost" size="icon" aria-label={rockedIds.includes(selected.id) ? "Remove Rock It" : "Rock It"} aria-pressed={rockedIds.includes(selected.id)} onClick={() => setRockedIds((ids) => ids.includes(selected.id) ? ids.filter((id) => id !== selected.id) : [...ids, selected.id])}><Flame className={rockedIds.includes(selected.id) ? "fill-current" : ""} /></Button></div>
              <h2 className="mt-1 text-heading">{selected.title}</h2>
              <p className="mt-1 text-body text-foreground/75">{selected.caption}</p>
            </div>
          </div>
        </FocusDialog>
      )}

      {messaging && (
        <FocusDialog label="Message Dante" onClose={() => setMessaging(false)} className="safe-top fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center bg-background">
          <div className="flex h-full w-full max-w-lg flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4"><span className="font-semibold">Message @dante</span><Button type="button" variant="ghost" size="icon" onClick={() => setMessaging(false)} aria-label="Close messages"><X /></Button></div>
            <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-4" aria-live="polite">
              {messages.length === 0 && <p className="mb-auto pt-10 text-center text-sm text-muted-foreground">Preview conversation with @dante</p>}
              {messages.map((message, index) => <p key={index} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-md bg-secondary px-4 py-3 text-sm">{message}</p>)}
            </div>
            <form onSubmit={submitMessage} className="flex items-end gap-2 border-t border-border p-3">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" aria-label="Write a message" rows={2} className="min-h-12 flex-1 resize-none rounded-sm bg-secondary" />
              <Button type="submit" size="icon" aria-label="Send preview message" disabled={!draft.trim()} className="h-12 w-12 shrink-0 rounded-sm"><Send /></Button>
            </form>
          </div>
        </FocusDialog>
      )}
      {user && (
        <div className="px-4 pt-8">
          {confirmDelete ? (
            <div className="rounded-lg border border-destructive p-4 text-[15px]">
              <p className="font-semibold">Delete your account forever?</p>
              <p className="mt-1 text-muted-foreground">Your profile, posts, comments, Rock Its and Calls will be removed. This can't be undone.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button type="button" variant="destructive" className="h-11 rounded-sm font-bold" onClick={removeAccount}>Delete forever</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="h-11 w-full rounded-sm text-[15px] font-semibold text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>Delete account</Button>
          )}
        </div>
      )}
      <a href="/privacy" className="block py-8 text-center text-[13px] text-muted-foreground underline">Privacy Policy</a>
      {editing && <EditProfile onClose={() => setEditing(false)} />}
      {showScore && <ScoreDetails username={handle} score={profileScore} onClose={() => setShowScore(false)} />}
    </div>
  );
}
