import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { intradayScans } from "@/lib/mock-data";
import { addToWatchlist } from "@/lib/watchlist-store";
import { toast } from "sonner";
import { AnalyseSheet, AnalyseTarget } from "@/components/analyse/AnalyseSheet";

const Intraday = () => {
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [target, setTarget] = useState<AnalyseTarget | null>(null);

  const longList = intradayScans.filter((c) => c.change >= 0);
  const shortList = intradayScans.filter((c) => c.change < 0);
  const list = side === "LONG" ? longList : shortList;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-success/5 p-6">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-success/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-emerald shadow-glow-emerald">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-success">Intraday Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Intraday <span className="bg-gradient-emerald bg-clip-text text-transparent">Radar</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <span className="pulse-dot" /> LIVE SCAN
            </span>
            <Button size="sm" className="ml-auto gap-2 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald">
              <RefreshCw className="h-3.5 w-3.5" /> Sync Radar
            </Button>
          </div>
        </div>
      </div>

      {/* Side switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setSide("LONG")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-[var(--transition-base)]",
            side === "LONG"
              ? "bg-success/15 text-success border-success/40 shadow-card"
              : "bg-card hover:border-success",
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" /> LONG ({longList.length})
        </button>
        <button
          onClick={() => setSide("SHORT")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-[var(--transition-base)]",
            side === "SHORT"
              ? "bg-danger/15 text-danger border-danger/40 shadow-card"
              : "bg-card hover:border-danger",
          )}
        >
          <TrendingDown className="h-3.5 w-3.5" /> SHORT ({shortList.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center py-32 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-success mb-4" />
          <div className="flex items-center gap-2 text-base font-bold">
            <Zap className="h-4 w-4 text-warning" />
            Processing Liquidity Scans…
          </div>
          <p className="mt-2 text-xs text-muted-foreground max-w-md">
            No {side.toLowerCase()} setups for now. Try Sync Radar after the next market open.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((c) => {
            const up = c.change >= 0;
            return (
              <div key={c.symbol} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight">{c.symbol}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.company}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-sm tabular-nums">₹{c.price.toLocaleString()}</span>
                      <span className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold",
                        up ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                      )}>
                        {up ? "+" : ""}{c.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Score</div>
                    <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-emerald bg-clip-text text-transparent">
                      {c.score}
                    </div>
                  </div>
                </div>

                <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">Conviction</span>
                    <span className="font-mono font-bold tabular-nums text-accent">{c.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-emerald" style={{ width: `${c.score}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-accent bg-accent/5 px-3 py-2 text-xs text-foreground/80 mb-3">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-accent">Setup:</span> {c.setup}
                </div>

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
                        source: "Intraday Radar",
                        probability: c.score,
                        business: 7,
                        growth: 6,
                        management: 7,
                        insight: `${c.symbol} shows ${c.setup.toLowerCase()} pattern with intraday strength.`,
                        outlook: up ? "Short-term bullish for the session." : "Short-term bearish — caution advised.",
                        risks: "Intraday positions carry overnight risk if not closed by EOD.",
                      })
                    }
                  >
                    <Sparkles className="h-3 w-3" /> Analyse
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnalyseSheet open={!!target} onOpenChange={(v) => !v && setTarget(null)} target={target} />
    </div>
  );
};

export default Intraday;
