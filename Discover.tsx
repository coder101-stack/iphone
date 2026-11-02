import { useState } from "react";
import { Bookmark, Flame, Play, Search, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import feed1 from "@/assets/feed-1.jpg";
import feed2 from "@/assets/feed-2.jpg";
import feed3 from "@/assets/feed-3.jpg";
import feed4 from "@/assets/feed-4.jpg";
import skate from "@/assets/discover-skate.jpg";
import vintage from "@/assets/discover-vintage.jpg";
import creator from "@/assets/discover-creator.jpg";
import collection from "@/assets/discover-collection.jpg";
import video from "@/assets/feed-video-1.mp4.asset.json";
import { AppScore } from "@/components/AppScore";
import { EmptyState } from "@/components/AppStates";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useDebounced, useDeviceSaved } from "@/lib/feed-utils";
import { shareLink } from "@/lib/social";
import { ScoreDetails } from "@/components/ScoreDetails";

const categories = ["For You", "Sneakers", "Fits", "Retro", "Basketball", "Skate", "Vintage", "Independent"] as const;
type Category = (typeof categories)[number];

type DiscoveryPost = {
  id: number;
  title: string;
  user: string;
  image: string;
  category: Exclude<Category, "For You">;
  type: "Sneaker" | "Fit" | "On-feet" | "Video" | "Creator" | "Collection";
  caption: string;
  score: number | null;
  tags: string[];
  size?: "wide" | "tall";
  video?: string;
};

// Curated editorial examples shipped with the app (no discovery backend yet); labelled in the UI.
const posts: DiscoveryPost[] = [
  { id: 1, title: "After hours", user: "rainyday.runs", image: feed1, category: "Sneakers", type: "On-feet", caption: "Grey suede after midnight. Wet streets don't scare these.", score: 74, tags: ["#runner", "#onfeet"], size: "wide" },
  { id: 2, title: "The daily uniform", user: "marco.fits", image: feed2, category: "Fits", type: "Fit", caption: "All black everything, let the whites talk.", score: 88, tags: ["#fits", "#streetwear"], size: "tall" },
  { id: 3, title: "Built to skate", user: "curbside.club", image: skate, category: "Skate", type: "On-feet", caption: "The best pairs look even better worn in.", score: 82, tags: ["#skate", "#onfeet"] },
  { id: 4, title: "Archive 1985", user: "archive.soles", image: vintage, category: "Vintage", type: "Sneaker", caption: "A little wear tells the whole story.", score: 95, tags: ["#vintage", "#basketball"], size: "wide" },
  { id: 5, title: "The rotation", user: "studio.sole", image: collection, category: "Retro", type: "Collection", caption: "Six pairs. Six different moods. One rotation.", score: 79, tags: ["#collection", "#retro"] },
  { id: 6, title: "Meet naya.runs", user: "naya.runs", image: creator, category: "Independent", type: "Creator", caption: "Finding my own lane, one pair at a time.", score: null, tags: ["#creator", "#independent"], size: "tall" },
  { id: 7, title: "City in motion", user: "kickvault.nyc", image: feed4, video: video.url, category: "Basketball", type: "Video", caption: "A closer look at the details. Nothing beats seeing them move.", score: 92, tags: ["#basketball", "#video"] },
  { id: 8, title: "Light smoke", user: "sail.and.suede", image: feed3, category: "Sneakers", type: "On-feet", caption: "Commute rotation. Simple works.", score: 61, tags: ["#onfeet", "#rotation"], size: "wide" },
  { id: 9, title: "Volt after dark", user: "studio.sole", image: feed4, category: "Basketball", type: "Sneaker", caption: "Volt on black. Shot in a single light.", score: 79, tags: ["#basketball", "#studio"] },
  { id: 10, title: "Concrete routine", user: "curbside.club", image: skate, category: "Independent", type: "Fit", caption: "No dress code. Just the pairs that feel like you.", score: 83, tags: ["#independent", "#skate"] },
];

export function Discover() {
  const [category, setCategory] = useState<Category>("For You");
  const [query, setQuery] = useState("");
  const term = useDebounced(query.trim().toLowerCase(), 200);
  const [selected, setSelected] = useState<DiscoveryPost | null>(null);

  const matching = posts.filter((post) =>
    (category === "For You" || post.category === category || post.tags.includes(`#${category.toLowerCase()}`)) &&
    (!term || `${post.title} ${post.user} ${post.caption} ${post.type} ${post.category} ${post.tags.join(" ")}`.toLowerCase().includes(term)),
  );
  const filtered = category !== "For You" || query.trim() !== "";

  return (
    <div className="mx-auto max-w-2xl font-display">
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 border-b border-border bg-background pt-3">
        <div className="px-4 pb-3">
          <label className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search AREM</span>
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search AREM"
              className="h-11 rounded-sm border-border bg-secondary pl-10 pr-4 text-[15px] shadow-none focus-visible:ring-foreground"
            />
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Discover categories">
          {categories.map((item) => (
            <Button
              key={item}
              type="button"
              variant={category === item ? "default" : "outline"}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className="h-11 shrink-0 rounded-full px-4 text-[13px] font-semibold shadow-none"
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <p className="px-4 pb-2 pt-3 text-caption">Featured examples · curated by AREM</p>

      {matching.length ? (
        <div className="grid grid-cols-3 auto-rows-[minmax(96px,28vw)] gap-1 px-1 pb-5 sm:auto-rows-[130px] md:auto-rows-[180px]" aria-label="Discover posts">
          {matching.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelected(post)}
              aria-label={`Open ${post.type.toLowerCase()} post: ${post.title} by ${post.user}`}
              className={`group relative h-full min-w-0 w-full overflow-hidden rounded-sm bg-secondary p-0 text-left ${post.size === "wide" ? "col-span-2 row-span-3" : post.size === "tall" ? "row-span-3" : "row-span-2"}`}
            >
              <img src={post.image} alt="" width={768} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              {post.video && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"><Play className="h-3.5 w-3.5 fill-current" /></span>}
              <span className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col gap-0.5 p-2.5 text-white sm:p-4">
                <span className="text-[11px] font-semibold uppercase text-white/85">{post.type}</span>
                <span className="block w-full truncate text-[13px] font-semibold leading-tight sm:text-[15px]">{post.title}</span>
                <span className="block w-full truncate text-[11px] font-medium text-white/85 sm:text-[13px]">@{post.user}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No posts found"
          message={query.trim() ? `Nothing matches “${query.trim()}”${category !== "For You" ? ` in ${category}` : ""}.` : `Nothing in ${category} yet.`}
          action={filtered ? "Clear filters" : undefined}
          onAction={() => { setQuery(""); setCategory("For You"); }}
        />
      )}

      {selected && <DiscoverDetail key={selected.id} post={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DiscoverDetail({ post, onClose }: { post: DiscoveryPost; onClose: () => void }) {
  const [rocked, setRocked] = useState(false);
  const [saved, toggleSaved] = useDeviceSaved(`discover-${post.id}`);
  const [showScore, setShowScore] = useState(false);
  const ref = useDialogFocus<HTMLDivElement>(() => { if (!showScore) onClose(); });
  const share = () => void shareLink(`${post.title} by @${post.user}`, `${window.location.origin}/?discover=${post.id}`);

  return (
    <>
      <div ref={ref} tabIndex={-1} className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center justify-center bg-black/40 safe-top outline-none" role="dialog" aria-modal="true" aria-label={`${post.title} post`}>
        <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-background">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-2 pl-4">
            <span className="min-w-0 truncate text-caption font-semibold uppercase">{post.type} · @{post.user}</span>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close post" className="shrink-0"><X className="h-5 w-5" /></Button>
          </div>
          <div className="relative min-h-0 flex-1 bg-secondary">
            {post.video ? (
              <video src={post.video} poster={post.image} controls autoPlay muted playsInline loop className="h-full w-full object-contain" />
            ) : (
              <img src={post.image} alt={post.title} width={768} height={1024} className="h-full w-full object-contain" />
            )}
          </div>
          <div className="shrink-0 space-y-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[15px] font-semibold">@{post.user}</span>
                <button type="button" onClick={() => setShowScore(true)} aria-label={`View App Score details for @${post.user}`} className="flex min-h-11 items-center">
                  <AppScore score={post.score} variant="feed" tone="light" />
                </button>
              </div>
              <div className="flex shrink-0 items-center">
                <Button type="button" variant="ghost" size="icon" aria-label={rocked ? "Remove Rock It" : "Rock It"} aria-pressed={rocked} onClick={() => setRocked(!rocked)}><Flame className={rocked ? "fill-current" : ""} /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label={saved ? "Remove save" : "Save post"} aria-pressed={saved} onClick={toggleSaved}><Bookmark className={saved ? "fill-current" : ""} /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Share post" onClick={share}><Send /></Button>
              </div>
            </div>
            <p className="text-heading">{post.title}</p>
            <p className="text-body text-foreground/80">{post.caption}</p>
            <p className="text-caption">{post.tags.join("  ")}</p>
          </div>
        </div>
      </div>
      {showScore && <ScoreDetails username={post.user} score={post.score} onClose={() => setShowScore(false)} />}
    </>
  );
}
