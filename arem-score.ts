import { getTierLabel } from "@/lib/app-score";

/**
 * Legacy helper kept for compatibility. Delegates to the shared 6-tier App Score system
 * (`src/lib/app-score.ts`) so every label in AREM uses the same classification.
 * A missing score belongs to an unranked new member.
 */
export function getAremRank(score: number | null): string {
  return getTierLabel(score);
}
