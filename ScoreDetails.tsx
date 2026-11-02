import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppScore } from "@/components/AppScore";
import { getNextTier, getTierMeta, classifyScore, formatScore } from "@/lib/app-score";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

type ScoreDetailsProps = {
  username: string;
  score: number | null;
  onClose: () => void;
};

const metricLabels = ["Discovery", "Style", "Community", "Culture", "Trend"] as const;
const metricOffsets = [7, -6, -11, -2, 9];

const movements = [
  { label: "Early Discovery", value: "+1.2" },
  { label: "Community Contribution", value: "+0.6" },
  { label: "Style", value: "+0.4" },
  { label: "Prediction Performance", value: "−0.2" },
];

const historyOffsets = [-13, -12, -11, -9, -10, -8, -8, -6, -7, -5, -4, -4, -2, -3, -1, 0];

export function ScoreDetails({ username, score: rawScore, onClose }: ScoreDetailsProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  // Invalid / out-of-range values never drive the charts; the AppScore header explains the state.
  const score = rawScore !== null && Number.isFinite(rawScore) ? Math.min(100, Math.max(0, rawScore)) : null;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Progression uses the shared 6-tier system (same truncation rule as every score badge).
  const tier = getTierMeta(classifyScore(score));
  const next = getNextTier(score);
  const currentFloor = tier?.min ?? 0;
  const truncated = score === null ? 0 : Math.floor(score * 10) / 10;
  const progress = score === null ? 0 : next ? Math.max(0, Math.min(100, ((truncated - currentFloor) / (next.min - currentFloor)) * 100)) : 100;
  // NOTE: breakdown, movement and history below are illustrative until per-metric scoring exists
  // (Stage 2 bugs #20/#21). They are labelled as such in the UI and never shown for a pending score.
  const metrics = metricLabels.map((label, index) => ({ label, value: score === null ? 0 : Math.round(Math.max(0, Math.min(100, score + (metricOffsets[index] ?? 0)))) }));
  const history = score === null ? [] : historyOffsets.map((offset) => Math.max(0, Math.min(100, score + offset)));
  const chartY = (value: number) => score === null ? 100 : 85 - ((value - (score - 13)) / 15) * 70;
  const points = history.map((value, index) => `${(index / (history.length - 1)) * 100},${chartY(value)}`).join(" ");
  const successfulCalls = Math.round((score ?? 0) / 6);
  const callAccuracy = Math.max(0, Math.round((score ?? 0) - 15));

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} className="safe-top fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-background font-display text-foreground outline-none animate-in fade-in slide-in-from-bottom-4 duration-200" role="dialog" aria-modal="true" aria-label={`AREM Score details for @${username}`}>
      <div className="mx-auto min-h-full max-w-2xl pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Back" className="-ml-2 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <span className="text-heading">@{username}</span>
          <span className="w-11" aria-hidden="true" />
        </header>

        <main className="px-4 sm:px-8">
          <section className="border-b border-border pb-6 pt-8">
            <h1 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">AREM Score</h1>
            <div className="mt-3 flex items-end justify-between gap-4">
              <AppScore variant="profile" score={rawScore} />
              <span className="mb-1 text-caption">{score === null ? "New member" : "Out of 100"}</span>
            </div>
          </section>

          {score === null ? (
            <p className="border-b border-border py-8 text-caption">The score will appear as this member contributes to AREM.</p>
          ) : (
            <>
              <p className="mt-6 rounded-lg bg-secondary px-4 py-3 text-caption">Illustrative preview — the breakdown, movement and history below are estimates, not yet calculated from real activity.</p>
              <section className="border-b border-border py-8" aria-label="Score breakdown (illustrative)">
                <h2 className="mb-5 text-[11px] font-bold uppercase text-muted-foreground">THE BREAKDOWN · ESTIMATE</h2>
                <div className="divide-y divide-border">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between py-3 text-base">
                      <span>{metric.label}</span><strong className="font-medium tabular-nums">{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-b border-border py-8" aria-label="Next tier progression">
                <h2 className="text-[11px] font-bold uppercase text-muted-foreground">NEXT TIER</h2>
                {next ? (
                  <>
                    <div className="mt-5 flex items-baseline justify-between gap-3">
                      <p className="text-heading uppercase">{next.label} <span className="text-muted-foreground">— {next.min}</span></p>
                      <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                    <div role="progressbar" aria-label={`Progress to ${next.label}`} aria-valuenow={truncated} aria-valuemin={currentFloor} aria-valuemax={next.min} className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-3 text-caption">{formatScore(next.min - truncated)} points to {next.label}</p>
                  </>
                ) : <p className="mt-5 text-heading uppercase">Exotic — highest tier</p>}
              </section>

              <section className="grid grid-cols-2 border-b border-border py-8" aria-label="Call performance">
                <div className="border-r border-border pr-4"><p className="text-3xl font-semibold tabular-nums">{successfulCalls}</p><p className="mt-2 text-caption">Successful Calls (est.)</p></div>
                <div className="pl-6"><p className="text-3xl font-semibold tabular-nums">{callAccuracy}%</p><p className="mt-2 text-caption">Call Accuracy (est.)</p></div>
              </section>

              <section className="border-b border-border py-8" aria-label="Recent movement">
                <h2 className="mb-5 text-[11px] font-bold uppercase text-muted-foreground">RECENT MOVEMENT · ESTIMATE</h2>
                <div className="divide-y divide-border">
                  {movements.map((movement) => (
                    <div key={movement.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span>{movement.label}</span><span className="shrink-0 font-semibold tabular-nums">{movement.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="py-8" aria-label="Score history">
                <div className="flex items-center justify-between"><h2 className="text-[11px] font-bold uppercase text-muted-foreground">SCORE HISTORY · ESTIMATE</h2><span className="text-xs text-muted-foreground">LAST 12 MONTHS</span></div>
                <div className="relative mt-7 h-40 border-b border-border">
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-border" />
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Illustrative trend from ${history[0]} to ${formatScore(score)} over 12 months`} className="relative h-full w-full overflow-visible text-foreground">
                    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                    <circle cx="100" cy={chartY(score)} r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-muted-foreground"><span>12 MONTHS AGO</span><span>NOW</span></div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>,
    document.body,
  );
}