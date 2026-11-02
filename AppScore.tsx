import { useEffect } from "react";
import { getTierMeta, resolveScore, type TierMeta } from "@/lib/app-score";
import { cn } from "@/lib/utils";

export { classifyScore, formatScore, resolveScore, SCORE_TIERS, type ScoreTier } from "@/lib/app-score";

type AppScoreProps = {
  /** Real score from the backend. null/undefined = pending, never rendered as 0. */
  score: number | null | undefined;
  variant: "profile" | "feed";
  /** Surface the score sits on. Feed defaults to "dark" (video), profile to "light". */
  tone?: "light" | "dark";
  loading?: boolean;
  className?: string;
};

// Exotic digits: spec gold→white on dark surfaces; a deeper gold on white so digits stay legible.
const EXOTIC_GRADIENT = { dark: "linear-gradient(135deg, #FFD700, #FFFFFF)", light: "linear-gradient(135deg, #854D0E, #A16207 50%, #854D0E)" };

function digitStyle(meta: TierMeta, tone: "light" | "dark"): React.CSSProperties {
  if (meta.id === "exotic") {
    return { backgroundImage: EXOTIC_GRADIENT[tone], WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" };
  }
  return { color: tone === "dark" ? meta.color : meta.ink };
}

/**
 * Reusable AREM App Score. Always shows the number AND the tier name (never colour alone).
 * Glow is a box-shadow on a layer behind the digits, so digits stay crisp; nothing flashes or pulses.
 */
export function AppScore({ score, variant, tone, loading = false, className }: AppScoreProps) {
  const surface = tone ?? (variant === "feed" ? "dark" : "light");
  const state = resolveScore(score);

  useEffect(() => {
    if (state.kind === "ok" && state.clamped) console.warn(`[AppScore] score ${String(score)} is outside 0–100; display clamped to ${state.display}.`);
  }, [score, state.kind, state.kind === "ok" && state.clamped]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <span role="status" aria-busy="true" aria-label="Loading App Score" className={cn("inline-flex items-center gap-2", className)}>
        <span className={cn("animate-pulse rounded-md motion-reduce:animate-none", surface === "dark" ? "bg-white/20" : "bg-black/[0.07]", variant === "profile" ? "h-12 w-20" : "h-5 w-16 rounded-full")} />
        {variant === "profile" && <span className={cn("h-3 w-14 animate-pulse rounded motion-reduce:animate-none", surface === "dark" ? "bg-white/20" : "bg-black/[0.07]")} />}
      </span>
    );
  }

  const meta = state.kind === "ok" ? getTierMeta(state.tier) : null;
  const digits = state.kind === "ok" ? state.display : "—";
  const tierText = meta ? meta.label : state.kind === "invalid" ? "Score unavailable" : "Score pending";
  const ariaLabel = meta ? `App Score: ${digits}, ${meta.label} tier` : `App Score: ${tierText}`;
  const muted = surface === "dark" ? "rgba(255,255,255,0.72)" : "#6B6B6B";

  if (variant === "feed") {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        data-tier={meta?.id ?? "unknown"}
        className={cn(
          "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-display leading-none",
          surface === "dark" ? "bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-sm" : "bg-[#F2F2F2] text-[#0A0A0A]",
          className,
        )}
      >
        <span aria-hidden="true" className="text-[14px] font-bold tabular-nums" style={meta ? digitStyle(meta, surface) : { color: muted }}>{digits}</span>
        <span aria-hidden="true" className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: meta ? (surface === "dark" ? meta.color : meta.ink) : muted }}>{tierText}</span>
      </span>
    );
  }

  return (
    <span role="img" aria-label={ariaLabel} data-tier={meta?.id ?? "unknown"} className={cn("inline-flex flex-col items-start font-display", className)}>
      <span aria-hidden="true" className="relative isolate inline-flex items-center justify-center">
        {meta?.glow && (
          <span
            data-testid="app-score-halo"
            className="absolute inset-x-1 inset-y-2 -z-10 rounded-full transition-opacity duration-300 motion-reduce:transition-none"
            style={{ boxShadow: meta.glow, background: meta.id === "exotic" ? "radial-gradient(circle, rgba(234,179,8,0.14), rgba(167,139,250,0.10) 60%, transparent 75%)" : "transparent" }}
          />
        )}
        <span className="relative z-10 text-[48px] font-bold leading-[1.05] tracking-tight tabular-nums" style={meta ? digitStyle(meta, surface) : { color: muted }}>{digits}</span>
      </span>
      <span aria-hidden="true" className="mt-1 text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta ? (surface === "dark" ? meta.color : meta.ink) : muted }}>{tierText}</span>
    </span>
  );
}
