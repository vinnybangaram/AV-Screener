import { Button } from "@/components/ui/button";
import { CloudLightning, Plus, RefreshCw, Sparkles, Zap, Loader2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { fetchPennyStorm, addToWatchlist } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const [candidates, setCandidates] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  const loadData = async (refresh = false) => {
    setScanning(true);
    try {
      const res = await fetchPennyStorm(refresh);
      if (res.success) {
        setCandidates(res.data || []);
        if (refresh) toast.success("Storm radar recalibrated. Active cells captured.");
      } else {
        toast.error("Radar terminal offline.");
      }
    } catch (err) {
      toast.error("Atmospheric interference. Retrying link...");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = useMemo(() => {
    if (filter === "ALL") return candidates;
    return candidates.filter((c) => (c.storm_status || 'DRY') === filter);
  }, [candidates, filter]);

  const handleAddToWatchlist = async (symbol: string, price: number) => {
    try {
      await addToWatchlist({ symbol, entry_price: price, category: 'PENNY' });
      toast.success(`${symbol} marked for interception.`);
    } catch (err) {
      toast.error(`Fault marking ${symbol}.`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-warning/5 p-6 shadow-card">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-warning/10 blur-3xl opacity-50" />
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
          <p className="mt-1.5 text-sm text-muted-foreground">High-volatility assets under ₹100 · Dynamic probability rankings.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <span className={cn("pulse-dot", scanning && "animate-pulse")} /> {scanning ? "CALCULATING VECTORS" : "RADAR ACTIVE"}
            </span>
            <Button 
                size="sm" 
                onClick={() => loadData(true)} 
                disabled={scanning}
                className="ml-auto gap-2 bg-gradient-gold hover:opacity-90 text-white border-0 shadow-card"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} /> Run Storm Scan
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
              "flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-[var(--transition-base)]",
              filter === f.key
                ? "bg-foreground text-background border-foreground shadow-card"
                : "bg-card hover:border-warning hover:text-warning",
            )}
          >
            {f.key !== "ALL" && (
              <span className={cn("h-2 w-2 rounded-full", stageDot[f.key])} />
            )}
            {f.key === "ALL" && <CloudLightning className="h-3 w-3" />}
            {f.label}
          </button>
        ))}
      </div>

      {scanning && candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-warning" />
           <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Processing secondary market liquidity flows...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="premium-card p-24 text-center">
            <div className="text-muted-foreground text-sm">Atmospheric conditions stable. No {filter !== 'ALL' ? filter.toLowerCase() : ''} storms detected.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map((c) => (
            <div key={c.ticker} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)] flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold text-lg tracking-tight group-hover:text-warning transition-colors">{c.ticker}</h3>
                    <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm tabular-nums">₹{c.currentPrice?.toLocaleString('en-IN')}</span>
                    <span className={cn(
                        "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase",
                        c.storm_status === "BREWING" && "bg-warning/15 text-warning",
                        c.storm_status === "DRIZZLE" && "bg-warning/10 text-warning/80",
                        c.storm_status === "STORM_READY" && "bg-success/15 text-success",
                        c.storm_status === "DRY" && "bg-danger/15 text-danger",
                    )}>{stageLabel[c.storm_status || 'DRY']}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Storm Score</div>
                    <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-gold bg-clip-text text-transparent">
                    {(c.confidence_level || c.confidence)?.toFixed(0)}
                    </div>
                </div>
                </div>

                <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

                <div className="mb-4">
                <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">Storm Probability</span>
                    <span className="font-mono font-bold tabular-nums text-warning">{c.confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-gold transition-all duration-1000" style={{ width: `${c.confidence}%` }} />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Level</div>
                    <div className={cn(
                        "font-bold mt-0.5",
                        (c.risk_level === "High" || c.risk_level === "Extreme") ? "text-danger" : "text-success"
                    )}>{c.risk_level || "Medium"}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector</div>
                    <div className="font-bold mt-0.5 uppercase">{c.sector || "Small-Cap"}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Change %</div>
                    <div className={cn("font-mono font-bold mt-0.5", (c.change_pct || 0) >= 0 ? "text-success" : "text-danger")}>
                        {(c.change_pct || 0) >= 0 ? "↗" : "↘"} {Math.abs(c.change_pct || 0).toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Radar</div>
                    <div className="font-bold mt-0.5 text-success">Tailwind ↑</div>
                </div>
                </div>

                <div className="rounded-lg border-l-4 border-warning bg-warning/5 px-3 py-2 text-[11px] text-foreground/80 mb-4 italic">
                    {c.one_liner || `Quant signal indicates high-velocity capital rotation in ${c.ticker}. Maintain strict stop-loss discipline.`}
                </div>

                <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-1"
                    onClick={() => handleAddToWatchlist(c.ticker, c.currentPrice)}
                >
                    <Plus className="h-3 w-3" /> Watchlist
                </Button>
                <Button
                    size="sm"
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-1 bg-gradient-gold hover:opacity-90 text-white border-0 shadow-card"
                    onClick={() => navigate(`/analysis?s=${c.ticker}`)}
                >
                    <Sparkles className="h-3 w-3" /> Analyse
                </Button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default PennyStorm;
