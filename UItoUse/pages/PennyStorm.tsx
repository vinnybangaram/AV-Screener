import { Button } from "@/components/ui/button";
import { pennyStormCandidates } from "@/lib/mock-data";
import { Bookmark, CloudLightning, Plus, RefreshCw, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { addToWatchlist } from "@/lib/watchlist-store";
import { toast } from "sonner";
import { AnalyseSheet, AnalyseTarget } from "@/components/analyse/AnalyseSheet";

const stageDot: Record<string, string> = {
  STORM_READY: "bg-success",
  BREWING: "bg-warning",
  DRIZZLE: "bg-warning/70",
  DRY: "bg-danger",
};
const stageLabel: Record<string, string> = {
  STORM_READY: "STORM READY",
  BREWING: "BREWING",
  DRIZZLE: "DRIZZLE",
  DRY: "DRY",
};

const filters: Array<{ key: string; label: string; icon?: string }> = [
  { key: "ALL", label: "ALL" },
  { key: "STORM_READY", label: "STORM READY" },
  { key: "BREWING", label: "BREWING" },
  { key: "DRIZZLE", label: "DRIZZLE" },
  { key: "DRY", label: "DRY" },
];

const PennyStorm = () => {
  const [filter, setFilter] = useState("ALL");
  const [target, setTarget] = useState<AnalyseTarget | null>(null);
  const list = filter === "ALL" ? pennyStormCandidates : pennyStormCandidates.filter((c) => c.storm === filter);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-warning/5 p-6">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-warning/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold shadow-card">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-warning">Penny Storm Intelligence Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Storm <span className="bg-gradient-gold bg-clip-text text-transparent">Radar</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Under ₹100 · High-probability rankings</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <span className="pulse-dot" /> LIVE SCAN
            </span>
            <Button size="sm" className="ml-auto gap-2 bg-gradient-gold hover:opacity-90 text-white border-0 shadow-card">
              <RefreshCw className="h-3.5 w-3.5" /> Run Storm Scan
            </Button>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-[var(--transition-base)]",
              filter === f.key
                ? "bg-foreground text-background border-foreground shadow-card"
                : "bg-card hover:border-warning hover:text-warning",
            )}
          >
            {f.key !== "ALL" && (
              <span className={cn("h-2 w-2 rounded-full", stageDot[f.key])} />
            )}
            {f.key === "ALL" && <CloudLightning className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((c) => (
          <div key={c.symbol} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg tracking-tight">{c.symbol}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm tabular-nums">₹{c.price}</span>
                  <span className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                    c.storm === "BREWING" && "bg-warning/15 text-warning",
                    c.storm === "DRIZZLE" && "bg-warning/10 text-warning/80",
                    c.storm === "STORM_READY" && "bg-success/15 text-success",
                    c.storm === "DRY" && "bg-danger/15 text-danger",
                  )}>{stageLabel[c.storm]}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Storm Score</div>
                <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-gold bg-clip-text text-transparent">
                  {c.probability}
                </div>
              </div>
            </div>

            <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

            <div className="mb-4">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Storm Probability</span>
                <span className="font-mono font-bold tabular-nums text-warning">{c.probability}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${c.probability}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Level</div>
                <div className={cn(
                  "font-bold mt-0.5",
                  c.risk === "Low" && "text-success",
                  c.risk === "Medium" && "text-warning",
                  c.risk === "Medium-High" && "text-warning",
                  c.risk === "High" && "text-danger",
                )}>{c.risk}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector</div>
                <div className="font-bold mt-0.5">{c.sector}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Change 24H</div>
                <div className={cn("font-mono font-bold tabular-nums mt-0.5", c.change24h >= 0 ? "text-success" : "text-danger")}>
                  {c.change24h >= 0 ? "↗" : "↘"} {Math.abs(c.change24h).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Radar</div>
                <div className={cn(
                  "font-bold mt-0.5",
                  c.radar === "Tailwind" && "text-success",
                  c.radar === "Headwind" && "text-danger",
                  c.radar === "Neutral" && "text-muted-foreground",
                )}>{c.radar} {c.radar === "Tailwind" ? "↑" : c.radar === "Headwind" ? "↓" : "→"}</div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-warning bg-warning/5 px-3 py-2 text-xs text-foreground/80 mb-3">
              {c.note}
            </div>

            <button className="text-[11px] font-bold uppercase tracking-wider text-warning hover:text-warning/80 mb-3">
              ⓘ View Score Insights
            </button>

            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs font-semibold gap-1"
                onClick={() => {
                  const added = addToWatchlist(c.symbol);
                  toast[added ? "success" : "info"](
                    added ? `${c.symbol} added to watchlist` : `${c.symbol} already in watchlist`
                  );
                }}
              >
                <Plus className="h-3 w-3" /> Watchlist
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1 bg-gradient-gold hover:opacity-90 text-white border-0 shadow-card"
                onClick={() =>
                  setTarget({
                    symbol: c.symbol,
                    exchangeSymbol: `${c.symbol}.NS`,
                    source: "Penny Storm Radar",
                    probability: c.probability,
                    business: 4,
                    growth: 7,
                    management: 5,
                    insight: c.note,
                    outlook: c.radar === "Tailwind" ? "Sectoral tailwinds support short-term breakout potential." : "Mixed signals — wait for confirmation before entry.",
                    risks: `Risk profile: ${c.risk}. ${c.risk === "High" ? "Position size conservatively." : "Standard penny-stock volatility applies."}`,
                  })
                }
              >
                <Sparkles className="h-3 w-3" /> Analyse
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AnalyseSheet open={!!target} onOpenChange={(v) => !v && setTarget(null)} target={target} />
    </div>
  );
};

export default PennyStorm;
