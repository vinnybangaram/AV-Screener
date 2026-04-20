import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp, Zap, Bookmark } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { fetchIntraday, addToWatchlist } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Intraday = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const navigate = useNavigate();

  const loadData = async (refresh = false) => {
    setScanning(true);
    try {
      const res = await fetchIntraday(refresh);
      if (res && res.success) {
        setCandidates(res.data || []);
        if (refresh) toast.success("Intraday radar synchronized.");
      } else {
        toast.error("Radar terminal disconnected.");
      }
    } catch (err) {
      toast.error("Latency issues in radar uplink.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5 * 60 * 1000); // refresh every 5m
    return () => clearInterval(interval);
  }, []);

  const { longList, shortList } = useMemo(() => {
    const longs = candidates.filter(c => c.side !== 'SHORT');
    const shorts = candidates.filter(c => c.side === 'SHORT');
    return { longList: longs, shortList: shorts };
  }, [candidates]);

  const list = side === "LONG" ? longList : shortList;

  const handleAddToWatchlist = async (symbol: string, price: number) => {
    try {
      await addToWatchlist({ symbol, entry_price: price, category: 'INTRADAY', side });
      toast.success(`${symbol} added to session monitor.`);
    } catch (err) {
      toast.error(`Fault adding ${symbol}.`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-success/5 p-6 shadow-card">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-success/10 blur-3xl opacity-50" />
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
              <span className={cn("pulse-dot", scanning && "animate-pulse")} /> {scanning ? "SCANNING..." : "LIVE SCAN"}
            </span>
            <Button 
                size="sm" 
                onClick={() => loadData(true)} 
                disabled={scanning}
                className="ml-auto gap-2 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} /> Sync Radar
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

      {scanning && candidates.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center py-32 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-success mb-4" />
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <Zap className="h-4 w-4 text-warning" />
            Synchronizing Neural Scans…
          </div>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm">
             Mapping high-frequency volume clusters for the active session.
          </p>
        </div>
      ) : list.length === 0 ? (
          <div className="premium-card p-24 text-center">
             <div className="text-muted-foreground text-sm">No actionable {side.toLowerCase()} setups detected in current scan cycle.</div>
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((c) => {
            const up = c.change_pct >= 0;
            return (
              <div key={c.symbol} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)] flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight group-hover:text-accent transition-colors">{c.symbol}</h3>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{c.company || 'NSE STOCK'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-sm tabular-nums">₹{c.price?.toLocaleString('en-IN')}</span>
                      <span className={cn(
                        "rounded-md px-2 py-0.5 text-[9px] font-bold",
                        up ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                      )}>
                        {up ? "+" : ""}{c.change_pct?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pulse</div>
                    <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-emerald bg-clip-text text-transparent">
                      {c.score?.toFixed(0)}
                    </div>
                  </div>
                </div>

                <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

                <div className="mb-4">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">Confidence</span>
                    <span className="font-mono font-bold tabular-nums text-accent">{c.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-emerald transition-all duration-1000" style={{ width: `${c.score}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-accent bg-accent/5 px-3 py-2 text-[11px] text-foreground/80 mb-4 font-medium italic">
                  <span className="font-bold uppercase text-[9px] tracking-wider text-accent">Setup:</span> {c.setup || "Breakout setup identified with high relative volume."}
                </div>

                <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-1"
                    onClick={() => handleAddToWatchlist(c.symbol, c.price)}
                  >
                    <Plus className="h-3 w-3" /> Watchlist
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-1 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald"
                    onClick={() => navigate(`/analysis?s=${c.symbol}`)}
                  >
                    <Sparkles className="h-3 w-3" /> Analyse
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Intraday;
