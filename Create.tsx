import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Camera, Check, Crosshair, Film, Footprints, Layers, Shirt, Star, X } from "lucide-react";
import { IMAGE_ACCEPT, VIDEO_ACCEPT, validateMedia } from "@/lib/media-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SneakerDetail } from "@/components/SneakerDetail";
import { trends, type Trend } from "@/lib/trends-data";
import { publishPost } from "@/lib/posts";
import { openAuth, useAuth } from "@/lib/auth";
import { AppScore } from "@/components/AppScore";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { toast } from "sonner";
import feed2 from "@/assets/feed-2.jpg";
import feed3 from "@/assets/feed-3.jpg";
import feed4 from "@/assets/feed-4.jpg";

const OPTIONS = [
  { id: "PHOTO", icon: Camera, hint: "Share a shot" },
  { id: "VIDEO", icon: Film, hint: "Motion, on loop" },
  { id: "ON FEET", icon: Footprints, hint: "How they wear" },
  { id: "FIT", icon: Shirt, hint: "The full look" },
  { id: "SNEAKER REVIEW", icon: Star, hint: "Your honest take" },
  { id: "COLLECTION", icon: Layers, hint: "Show the rotation" },
  { id: "CALL IT", icon: Crosshair, hint: "Predict what's next" },
] as const;
type Kind = (typeof OPTIONS)[number]["id"];

const STYLE_TAGS = ["Streetwear", "Retro", "Minimal", "Basketball", "Skate", "Vintage", "Luxury", "Experimental", "Y2K"];
const SAMPLES = [feed2, feed3, feed4];
const STEPS = ["MEDIA", "SNEAKER", "CAPTION", "TAGS", "PREVIEW"] as const;
const STEP_NAMES = ["Media", "Sneaker", "Caption", "Tags", "Preview"] as const;

type Media = { url: string; video: boolean; file?: File };

export function Create({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [step, setStep] = useState(0);
  const [media, setMedia] = useState<Media | null>(null);
  const [sneaker, setSneaker] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [posted, setPosted] = useState(false);
  const [callSneaker, setCallSneaker] = useState<Trend | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const { user, profile } = useAuth();

  const post = async () => {
    if (!media) return;
    if (!user) { openAuth(); return; }
    setPosting(true); setPostError("");
    try {
      let file = media.file;
      if (!file) {
        const res = await fetch(media.url);
        if (!res.ok) throw new Error("sample");
        const blob = await res.blob();
        file = new File([blob], "sample.jpg", { type: blob.type || "image/jpeg" });
      }
      const r = await publishPost({ file, kind: kind ?? "PHOTO", sneaker, caption, tags });
      if ("error" in r) setPostError(r.error ?? "Couldn't post. Try again.");
      else { setPosted(true); toast.success("Posted to your profile"); }
    } catch {
      setPostError("Couldn't post. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };
  const dialogRef = useDialogFocus<HTMLDivElement>();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !callSneaker) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose, callSneaker]);

  useEffect(() => () => { if (media?.url.startsWith("blob:")) URL.revokeObjectURL(media.url); }, [media]);

  const back = () => {
    if (posted) return onClose();
    if (!kind) return onClose();
    if (step === 0) { setKind(null); return; }
    setStep(step - 1);
  };

  const canNext = [!!media, !!sneaker.trim(), true, true, true][step];
  const title = !kind ? "CREATE" : kind === "CALL IT" ? "CALL IT" : posted ? "POSTED" : STEPS[step];

  const [fileError, setFileError] = useState("");
  const pickFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const result = await validateMedia(file, kind === "VIDEO" ? "video" : kind === "PHOTO" ? "image" : "any");
    if ("error" in result) { setFileError(result.error); return; }
    setFileError("");
    setMedia({ ...result, file });
  };

  const body = () => {
    if (!kind) {
      return (
        <div className="grid grid-cols-2 gap-3 p-4">
          {OPTIONS.map(({ id, icon: Icon, hint }) => (
            <button key={id} type="button" onClick={() => setKind(id)} className={`flex min-h-11 flex-col items-start gap-6 rounded-lg border border-border bg-background p-5 text-left shadow-card transition-colors hover:bg-secondary ${id === "CALL IT" ? "col-span-2" : ""}`}>
              <Icon className="h-6 w-6" strokeWidth={1.6} />
              <span>
                <span className="block text-[15px] font-semibold">{id}</span>
                <span className="mt-1 block text-caption">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (kind === "CALL IT") {
      return (
        <div className="divide-y divide-border">
          <p className="px-4 py-4 text-sm text-muted-foreground">Pick the sneaker you think will rise next.</p>
          {trends.map((t) => (
            <button key={t.model} type="button" onClick={() => setCallSneaker(t)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-secondary">
              <img src={t.image} alt="" className="h-16 w-16 rounded-sm object-cover" />
              <span className="flex-1">
                <span className="block text-[11px] font-bold text-muted-foreground">{t.brand}</span>
                <span className="block font-semibold">{t.model}</span>
              </span>
              <span className="text-right">
                <span className="block text-2xl font-semibold tabular-nums">{t.score}</span>
                <span className="block text-[11px] font-semibold text-muted-foreground">TREND SCORE</span>
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (posted) {
      return (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white"><Check className="h-8 w-8" aria-hidden="true" /></span>
          <h2 className="mt-6 text-heading">Your {kind.toLowerCase()} is live</h2>
          <p className="mt-2 text-body text-muted-foreground">Saved to your profile and the Home feed.</p>
          <Button type="button" onClick={onClose} className="mt-8 h-11 w-full max-w-xs rounded-sm font-semibold">Done</Button>
        </div>
      );
    }

    if (step === 0) {
      const accept = kind === "VIDEO" ? VIDEO_ACCEPT : kind === "PHOTO" ? IMAGE_ACCEPT : `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
      return (
        <div className="p-4">
          <label className="relative flex aspect-[4/5] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary focus-within:ring-2 focus-within:ring-foreground">
            {media ? (
              media.video ? <video src={media.url} className="h-full w-full object-cover" autoPlay muted loop playsInline /> : <img src={media.url} alt="Selected media" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-3 text-sm text-muted-foreground"><Camera className="h-8 w-8" strokeWidth={1.4} />Tap to choose from your library</span>
            )}
            <input type="file" accept={accept} aria-label="Choose media" className="sr-only" onChange={(e) => pickFile(e.currentTarget)} />
          </label>
          {fileError && <p role="alert" className="mt-3 text-sm text-destructive">{fileError}</p>}
          {kind === "PHOTO" && (
            <>
              <p className="mt-5 text-caption font-semibold">Or use a sample photo</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {SAMPLES.map((src, i) => (
                  <button key={src} type="button" aria-label={`Sample ${i + 1}`} onClick={() => { setFileError(""); setMedia({ url: src, video: false }); }} aria-pressed={media?.url === src} className={`aspect-square overflow-hidden rounded-sm ${media?.url === src ? "ring-2 ring-foreground ring-offset-2" : ""}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="p-4">
          <Input value={sneaker} onChange={(e) => setSneaker(e.target.value)} placeholder="Search or type a sneaker" aria-label="Sneaker" className="h-11 rounded-sm" />
          <div className="mt-4 divide-y divide-border">
            {trends.filter((t) => `${t.brand} ${t.model}`.toLowerCase().includes(sneaker.toLowerCase()) || sneaker === `${t.brand} ${t.model}`).map((t) => {
              const name = `${t.brand} ${t.model}`;
              return (
                <button key={t.model} type="button" onClick={() => setSneaker(name)} aria-pressed={sneaker === name} className="flex min-h-11 w-full items-center gap-3 py-3 text-left">
                  <img src={t.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  <span className="flex-1 text-[15px] font-medium">{name}</span>
                  {sneaker === name && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="p-4">
          <Textarea autoFocus value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder={kind === "SNEAKER REVIEW" ? "Comfort, build, how they wear…" : "Say something about it…"} aria-label="Caption" className="min-h-40 rounded-sm text-base" />
          <p className="mt-2 text-right text-xs text-muted-foreground tabular-nums">{caption.length}/300</p>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="flex flex-wrap gap-2 p-4">
          {STYLE_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button key={tag} type="button" aria-pressed={on} onClick={() => setTags(on ? tags.filter((t) => t !== tag) : [...tags, tag])} className={`min-h-11 rounded-full border px-4 text-[13px] font-semibold transition-colors ${on ? "border-foreground bg-foreground text-background" : "border-border text-foreground"}`}>
                #{tag.toLowerCase()}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary shadow-card">
          {media?.video ? <video src={media.url} className="h-full w-full object-cover" autoPlay muted loop playsInline /> : <img src={media?.url} alt="Post preview" className="h-full w-full object-cover" />}
          <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-white">
            <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">@{profile?.username ?? "you"} <AppScore score={profile?.arem_score ?? null} variant="feed" tone="dark" loading={!!user && !profile} /> <span className="text-[11px] text-white/80">{kind}</span></p>
            <p className="text-[13px] font-semibold uppercase">{sneaker}</p>
            {caption && <p className="text-[15px]">{caption}</p>}
            {tags.length > 0 && <p className="text-[13px] text-white/85">{tags.map((t) => `#${t.toLowerCase()}`).join(" ")}</p>}
          </div>
        </div>
      </div>
    );
  };

  const inFlow = kind && kind !== "CALL IT" && !posted;

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="create-title" className="safe-top outline-none fixed inset-0 z-[55] animate-in fade-in slide-in-from-bottom-6 duration-200 flex flex-col bg-background font-display text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-2">
          <Button type="button" variant="ghost" size="icon" aria-label={kind ? "Back" : "Close"} onClick={back}>{kind ? <ArrowLeft /> : <X />}</Button>
          <h1 id="create-title" className="text-heading">{title === "CREATE" ? "Create" : title === "CALL IT" ? "Call It" : title === "POSTED" ? "Posted" : "New post"}</h1>
          <span className="w-11" aria-hidden="true" />
        </div>
        {inFlow && (
          <div className="shrink-0 px-4 pt-3">
            <p className="text-caption" aria-live="polite">Step {step + 1} of {STEPS.length} · <span className="font-semibold text-foreground">{STEP_NAMES[step]}</span></p>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {STEPS.map((s, i) => <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`} />)}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{body()}</div>
        {inFlow && (
          <div className="safe-bottom shrink-0 border-t border-border p-4">
            {postError && <p role="alert" className="mb-2 text-sm text-destructive">{postError}</p>}
            {step === STEPS.length - 1 && !user && <p className="mb-2 text-caption">Sign in to save this post to your account.</p>}
            <Button type="button" disabled={!canNext || posting} onClick={() => (step === STEPS.length - 1 ? void post() : setStep(step + 1))} className="h-11 w-full rounded-sm font-semibold">
              {step === STEPS.length - 1 ? (posting ? "Posting…" : user ? "Post" : "Sign in to post") : step === 2 && !caption ? "Skip" : step === 3 && tags.length === 0 ? "Skip" : "Next"}
            </Button>
          </div>
        )}
      </div>
      {callSneaker && <SneakerDetail sneaker={callSneaker} onClose={() => setCallSneaker(null)} />}
    </div>,
    document.body,
  );
}
