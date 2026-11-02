import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bookmark, Crosshair, Flame, Send } from "lucide-react";
import { shareLink, useRocked } from "@/lib/social";
import { toast } from "sonner";
import { useDeviceSaved } from "@/lib/feed-utils";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import type { Sneaker } from "@/lib/trends-data";
import { addCall, useCalls } from "@/lib/calls";
import { analyzeCallFn } from "@/lib/call-analysis.functions";
import feed1 from "@/assets/feed-1.jpg";
import feed2 from "@/assets/feed-2.jpg";
import feed3 from "@/assets/feed-3.jpg";
import feed4 from "@/assets/feed-4.jpg";

export type { Sneaker };

const communityPosts = [
  { user: "rainyday.runs", image: feed2, caption: "Wet pavement test passed." },
  { user: "marco.fits", image: feed3, caption: "Built the whole fit around these." },
  { user: "sail.and.suede", image: feed4, caption: "Daily rotation, no notes." },
  { user: "kickvault.nyc", image: feed1, caption: "First look under studio light." },
];

function formatRocks(count: number) {
  return `${(count / 1000).toFixed(1)}K`;
}

export function SneakerDetail({ sneaker, onClose }: { sneaker: Sneaker; onClose: () => void }) {
  const [rocked, toggleRock] = useRocked(`sneaker:${sneaker.model}`);
  const [saved, toggleSaved] = useDeviceSaved(`sneaker:${sneaker.model}`);
  const [savingCall, setSavingCall] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [analysis, setAnalysis] = useState<{ text?: string; error?: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyze = useServerFn(analyzeCallFn);
  const savedCall = useCalls().find((c) => c.model === sneaker.model);
  const call = savedCall ? { score: savedCall.calledScore, date: new Date(savedCall.date) } : null;

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await analyze({ data: { brand: sneaker.brand, model: sneaker.model, colorway: sneaker.colorway, score: sneaker.score, movement: sneaker.movement, status: sneaker.status, rocks: sneaker.rocks, communityPosts: communityPosts.length, reason } });
      setAnalysis(res.ok ? { text: res.text } : { error: res.message });
    } catch {
      setAnalysis({ error: "The analysis couldn't be completed. Please try again later." });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirming) setConfirming(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [confirming, onClose]);

  const name = `${sneaker.brand} ${sneaker.model}`;
  const share = () => {
    void shareLink(name, `${window.location.origin}/?sneaker=${encodeURIComponent(sneaker.model)}`);
  };
  const confirmCall = async () => {
    setSavingCall(true);
    try {
      const ok = await addCall({ model: sneaker.model, brand: sneaker.brand, colorway: sneaker.colorway, image: sneaker.image, calledScore: sneaker.score, date: new Date().toISOString(), reason: reason.trim() });
      if (!ok) return;
      setConfirming(false);
      toast.success("Call saved to your profile");
    } catch {
      toast.error("Couldn't save your call. Try again.");
    } finally {
      setSavingCall(false);
    }
  };

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={name} className="safe-top outline-none fixed inset-0 z-[60] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-bottom-4 duration-200 bg-background font-display text-foreground">
      <div className="mx-auto max-w-2xl pb-16">
        <div className="relative aspect-square bg-secondary">
          <img src={sneaker.image} alt={`${name} sneaker`} width={1024} height={1024} className="h-full w-full object-cover" />
          <Button type="button" variant="ghost" size="icon" aria-label="Back" onClick={onClose} className="absolute left-3 top-3 h-11 w-11 rounded-full bg-white/90 text-[#0A0A0A] shadow-card">
            <ArrowLeft />
          </Button>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase text-[#0A0A0A] shadow-card">
            {sneaker.status}
          </span>
        </div>

        <div className="px-4 pt-6 sm:px-6">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">{sneaker.brand}</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight sm:text-4xl">{sneaker.model}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sneaker.colorway}</p>

          <div className="mt-6 flex items-end justify-between border-y border-border py-5">
            <div>
              <p className="text-[11px] font-bold uppercase text-muted-foreground">TREND SCORE</p>
              <div className="mt-2 flex items-baseline gap-2">
                <strong className="text-5xl font-semibold leading-none tabular-nums">{sneaker.score}</strong>
                <span className="text-sm font-bold tabular-nums">↑{sneaker.movement}</span>
              </div>
            </div>
            <p className="text-xs font-bold uppercase">{sneaker.status}</p>
          </div>

          <div className="grid grid-cols-3 border-b border-border">
            <Button type="button" variant="ghost" aria-pressed={rocked} onClick={toggleRock} className="h-14 flex-col gap-1 rounded-none text-[11px] font-bold uppercase hover:bg-transparent">
              <Flame className={rocked ? "fill-current" : ""} />
              {formatRocks(sneaker.rocks + (rocked ? 1 : 0))}
            </Button>
            <Button type="button" variant="ghost" aria-pressed={saved} onClick={toggleSaved} className="h-14 flex-col gap-1 rounded-none text-[11px] font-bold uppercase hover:bg-transparent">
              <Bookmark className={saved ? "fill-current" : ""} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={share} className="h-14 flex-col gap-1 rounded-none text-[11px] font-bold uppercase hover:bg-transparent">
              <Send />
              Share
            </Button>
          </div>

          <div className="mt-6">
            {call ? (
              <div className="rounded-lg border border-border bg-secondary px-5 py-5 text-center shadow-card">
                <p className="text-[11px] font-bold uppercase text-muted-foreground">YOUR CALL</p>
                <p className="mt-2 text-heading">Called at {call.score}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {call.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ) : (
              <Button type="button" onClick={() => setConfirming(true)} className="h-12 w-full gap-2 rounded-sm text-[15px] font-semibold">
                <Crosshair /> Call It
              </Button>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Call It is a public prediction that this pair will rise before it happens. Your calls are saved to your profile's CALLS tab.
            </p>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="community-posts">
          <div className="mb-3 flex items-center gap-3 px-4 sm:px-6">
            <h2 id="community-posts" className="shrink-0 text-[13px] font-semibold uppercase">From the community · examples</h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-1 px-1">
            {communityPosts.map((post) => (
              <figure key={post.user} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                <img src={post.image} alt={`Post by @${post.user} featuring ${name}`} loading="lazy" className="h-full w-full object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                  <p className="text-xs font-bold">@{post.user}</p>
                  <p className="line-clamp-2 text-[11px] text-white/85">{post.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setConfirming(false)}>
          <div role="alertdialog" style={{ maxHeight: "100dvh" }} aria-modal="true" aria-labelledby="call-title" onClick={(e) => e.stopPropagation()} className="safe-bottom w-full max-w-md overflow-y-auto rounded-t-xl bg-background px-6 pb-6 pt-8 text-center shadow-card sm:rounded-xl">
            <h2 id="call-title" className="text-[22px] font-semibold">Call it?</h2>
            <p className="mt-2 text-heading">{name}</p>
            <p className="mt-6 text-[11px] font-bold uppercase text-muted-foreground">CURRENT TREND SCORE</p>
            <p className="mt-1 text-5xl font-semibold tabular-nums">{sneaker.score}</p>
            <p className="mt-6 text-sm">You're predicting that this sneaker will rise.</p>
            <label htmlFor="call-reason" className="mt-6 block text-left text-[11px] font-bold uppercase text-muted-foreground">WHY ARE YOU CALLING IT?</label>
            <Textarea id="call-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={600} placeholder="What are you seeing that others aren't?" className="mt-2 min-h-20 rounded-sm text-[15px]" />
            <Button type="button" variant="outline" disabled={analyzing || reason.trim().length < 3} onClick={runAnalysis} className="mt-3 h-11 w-full rounded-sm text-[13px] font-semibold">
              {analyzing ? "Analyzing signals…" : "Analyze my call"}
            </Button>
            {analysis && (
              <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-border p-4 text-left text-xs leading-relaxed" aria-live="polite">
                {analysis.error ? <p className="text-muted-foreground">{analysis.error}</p> : <p className="whitespace-pre-line">{analysis.text}</p>}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Your prediction will be saved with today's date.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="h-11 rounded-sm font-semibold">Cancel</Button>
              <Button type="button" disabled={savingCall} onClick={() => void confirmCall()} className="h-11 rounded-sm font-semibold">{savingCall ? "Saving…" : "Call It"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
