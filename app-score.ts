/**
 * Shared AREM App Score tier system — the ONLY place tier boundaries live.
 *
 * Display rule (documented, never rounds up into a higher tier):
 *   1. Take the original, unrounded score.
 *   2. Truncate to one decimal: Math.floor(score * 10) / 10.
 *   3. Classify the truncated value. Lower bounds are inclusive, upper bounds exclusive,
 *      except Exotic which includes 100.
 *   e.g. 89.96 → 89.9 → Blazing (never shown as "90" / Exotic).
 *
 * This module only classifies and formats scores. It never calculates, writes or resets a
 * score — the real value comes from `profiles.arem_score` (not member-writable).
 */
export type ScoreTier = "emerging" | "rising" | "cool" | "hot" | "blazing" | "exotic" | "unknown";
export type RankedTier = Exclude<ScoreTier, "unknown">;

export function classifyScore(score: number | null | undefined): ScoreTier {
  if (score == null || !isFinite(score)) return "unknown";
  const s = Math.floor(score * 10) / 10; // truncate to 1 decimal, never round up
  if (s >= 90) return "exotic";
  if (s >= 85) return "blazing";
  if (s >= 80) return "hot";
  if (s >= 70) return "cool";
  if (s >= 50) return "rising";
  if (s >= 0) return "emerging";
  return "unknown";
}

export type TierMeta = {
  id: RankedTier;
  label: string;
  /** Inclusive lower bound. */
  min: number;
  /** Spec colour — used for glows and for text on dark/video surfaces. */
  color: string;
  /** Darker shade of the same hue with ≥4.5:1 contrast on white (Option A surfaces). */
  ink: string;
  /** Spec glow (box-shadow), rendered on a layer BEHIND the digits. */
  glow: string | null;
};

export const SCORE_TIERS: readonly TierMeta[] = [
  { id: "emerging", label: "Emerging", min: 0, color: "#9CA3AF", ink: "#4B5563", glow: null },
  { id: "rising", label: "Rising", min: 50, color: "#67E8F9", ink: "#0E7490", glow: "0 0 12px rgba(103,232,249,0.5)" },
  { id: "cool", label: "Cool", min: 70, color: "#818CF8", ink: "#4F46E5", glow: "0 0 12px rgba(129,140,248,0.5)" },
  { id: "hot", label: "Hot", min: 80, color: "#FB923C", ink: "#C2410C", glow: "0 0 12px rgba(251,146,60,0.5)" },
  { id: "blazing", label: "Blazing", min: 85, color: "#F97316", ink: "#9A3412", glow: "0 0 14px rgba(249,115,22,0.6)" },
  { id: "exotic", label: "Exotic", min: 90, color: "#FFD700", ink: "#854D0E", glow: "0 0 20px rgba(167,139,250,0.4), 0 0 40px rgba(234,179,8,0.3)" },
] as const;

export function getTierMeta(tier: ScoreTier): TierMeta | null {
  return SCORE_TIERS.find((t) => t.id === tier) ?? null;
}

/** Next tier above the given score, or null at Exotic / for unknown scores. */
export function getNextTier(score: number | null | undefined): TierMeta | null {
  const tier = classifyScore(score);
  if (tier === "unknown") return null;
  const index = SCORE_TIERS.findIndex((t) => t.id === tier);
  return SCORE_TIERS[index + 1] ?? null;
}

export type ScoreState =
  | { kind: "pending" }
  | { kind: "invalid" }
  | { kind: "ok"; value: number; display: string; tier: RankedTier; clamped: boolean };

/** Truncates (never rounds up) to one decimal and drops a trailing ".0". */
export function formatScore(score: number): string {
  const t = Math.floor(score * 10) / 10;
  return Number.isInteger(t) ? String(t) : t.toFixed(1);
}

/**
 * Normalises any incoming score value for display.
 * - null/undefined → pending (never shown as 0)
 * - NaN / non-numeric / non-finite → invalid
 * - < 0 or > 100 → clamped into range (flagged so callers can warn)
 */
export function resolveScore(raw: unknown): ScoreState {
  if (raw == null) return { kind: "pending" };
  const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return { kind: "invalid" };
  const value = Math.min(100, Math.max(0, n));
  const tier = classifyScore(value) as RankedTier;
  return { kind: "ok", value, display: formatScore(value), tier, clamped: value !== n };
}

/** Uppercase tier label for compact text contexts (e.g. "BLAZING"), "UNRANKED" when unknown. */
export function getTierLabel(score: number | null | undefined): string {
  return getTierMeta(classifyScore(score))?.label.toUpperCase() ?? "UNRANKED";
}
