import { Button } from "@/components/ui/button";
import { multibaggerCandidates } from "@/lib/mock-data";
import { Bookmark, Cpu, Plus, RefreshCw, Rocket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { addToWatchlist } from "@/lib/watchlist-store";
import { toast } from "sonner";
import { AnalyseSheet, AnalyseTarget } from "@/components/analyse/AnalyseSheet";

const Multibaggers = () => {
  const [target, setTarget] = useState<AnalyseTarget | null>(null);
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-accent/5 p-6">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-success/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-emerald shadow-glow-emerald">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Multibagger Intelligence Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Discovery <span className="bg-gradient-emerald bg-clip-text text-transparent">Terminal</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <span className="pulse-dot" /> LIVE DATA ACTIVE
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold">
              <Cpu className="h-3.5 w-3.5 text-accent" /> AI LAYER: OK
            </span>
            <Button size="sm" className="ml-auto gap-2 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald">
              <RefreshCw className="h-3.5 w-3.5" /> Run 3-Layer Scan
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {multibaggerCandidates.map((c) => (
          <div key={c.symbol} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg tracking-tight">{c.symbol}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm tabular-nums">₹{c.price.toLocaleString()}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">LIVE SCAN</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Institutional Score</div>
                <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-emerald bg-clip-text text-transparent">
                  {c.score}
                </div>
              </div>
            </div>

            <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Probability</span>
                <span className="font-mono font-bold tabular-nums text-accent">{c.probability}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-emerald" style={{ width: `${c.probability}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Structure</div>
                <div className="text-sm font-bold mt-0.5">{c.structure}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Momentum</div>
                <div className={cn(
                  "text-sm font-bold mt-0.5",
                  c.momentum === "Bullish" ? "text-success" : c.momentum === "Bearish" ? "text-danger" : "text-warning",
                )}>{c.momentum}</div>
              </div>
            </div>

            <button className="text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 mb-3">
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
                className="h-8 px-3 text-xs font-bold gap-1 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald"
                onClick={() =>
                  setTarget({
                    symbol: c.symbol,
                    exchangeSymbol: `${c.symbol}.NS`,
                    source: "Institutional Discovery",
                    probability: c.probability,
                    business: 6,
                    growth: 4,
                    management: 6,
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

export default Multibaggers;
