import { useEffect, useState } from "react";
import { ArrowUpRight, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SneakerDetail } from "@/components/SneakerDetail";
import { trends, type Trend } from "@/lib/trends-data";
import { useRocked } from "@/lib/social";

function RockButton({ trend }: { trend: Trend }) {
  const [isRocked, toggle] = useRocked(`sneaker:${trend.model}`);
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`${isRocked ? "Remove Rock It from" : "Rock It"} ${trend.brand} ${trend.model}`}
      aria-pressed={isRocked}
      onClick={toggle}
      className="h-11 gap-2 rounded-sm px-2 text-[13px] font-semibold hover:bg-secondary"
    >
      <Flame aria-hidden="true" className={isRocked ? "fill-current" : ""} />
      <span>{formatRocks(trend.rocks + (isRocked ? 1 : 0))} Rock Its</span>
    </Button>
  );
}

function formatRocks(count: number) {
  return `${(count / 1000).toFixed(1)}K`;
}

export function Trends() {
  const [open, setOpen] = useState<Trend | null>(null);
  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("sneaker");
    const match = trends.find((t) => t.model === model);
    if (match) setOpen(match);
  }, []);


  return (
    <div className="mx-auto max-w-2xl font-display">
      <div className="px-4 pb-7 pt-8 sm:px-6 sm:pt-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground">
          <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" /> AREM / TRENDS
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight sm:text-4xl">What's moving</h1>
        <p className="mt-2 max-w-sm text-body text-muted-foreground">
          The pairs moving sneaker culture, according to the AREM community.
        </p>
      </div>

      <div className="space-y-11 pb-10">
        {trends.map((trend, index) => {
          return (
            <section key={trend.model} aria-labelledby={`trend-${index}`}>
              <div className="mb-3 flex items-center gap-3 px-4 sm:px-6">
                <span className="text-[11px] tabular-nums text-muted-foreground">0{index + 1}</span>
                <h2 id={`trend-${index}`} className="shrink-0 text-xs font-bold uppercase">{trend.section}</h2>
                <span className="h-px flex-1 bg-border" />
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </div>

              <button type="button" aria-label={`Open ${trend.brand} ${trend.model}`} onClick={() => setOpen(trend)} className="relative mx-4 block aspect-[5/4] w-[calc(100%-2rem)] overflow-hidden rounded-lg bg-secondary shadow-card sm:mx-6 sm:aspect-[3/2] sm:w-[calc(100%-3rem)]">
                <img
                  src={trend.image}
                  alt={`${trend.brand} ${trend.model} sneaker`}
                  width={1024}
                  height={1024}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase text-[#0A0A0A] shadow-card">
                  {trend.status}
                </span>
              </button>

              <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">{trend.brand}</p>
                  <h3 className="mt-1 text-heading sm:text-xl">{trend.model}</h3>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    <strong className="text-3xl font-semibold leading-none tabular-nums sm:text-4xl">{trend.score}</strong>
                    <span className="text-xs font-bold tabular-nums text-foreground/80">↑{trend.movement}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase text-muted-foreground">Trend Score / 100 · not App Score</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border px-4 py-2 sm:px-6">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">{trend.status}</span>
                <RockButton trend={trend} />
              </div>
            </section>
          );
        })}
      </div>
      {open && <SneakerDetail sneaker={open} onClose={() => setOpen(null)} />}
    </div>
  );
}