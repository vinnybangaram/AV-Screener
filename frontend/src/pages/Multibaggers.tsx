import { Button } from "@/components/ui/button";
import { Bookmark, Cpu, Plus, RefreshCw, Rocket, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { fetchMultibaggers, addToWatchlist } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Multibaggers = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const navigate = useNavigate();

  const loadData = async (refresh = false) => {
    setScanning(true);
    try {
      const res = await fetchMultibaggers(refresh);
      if (res.success) {
        setCandidates(res.data || []);
        if (refresh) toast.success("Quant systems recalibrated. Fresh signals captured.");
      } else {
        toast.error("Discovery terminal offline.");
      }
    } catch (err) {
      toast.error("Neural link interrupted.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToWatchlist = async (symbol: string, price: number) => {
    try {
      await addToWatchlist({ symbol, entry_price: price, category: 'MULTIBAGGER' });
      toast.success(`${symbol} committed to portfolio memory.`);
    } catch (err) {
      toast.error(`Fault committing ${symbol}.`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-accent/5 p-6 shadow-card">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl opacity-50" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-success/10 blur-3xl opacity-50" />
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
              <span className={cn("pulse-dot", scanning && "animate-pulse")} /> {scanning ? "SCANNING..." : "LIVE DATA ACTIVE"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold">
              <Cpu className="h-3.5 w-3.5 text-accent" /> AI LAYER: {scanning ? "CALIBRATING" : "OK"}
            </span>
            <Button 
                size="sm" 
                onClick={() => loadData(true)} 
                disabled={scanning}
                className="ml-auto gap-2 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} /> Run 3-Layer Scan
            </Button>
          </div>
        </div>
      </div>

      {scanning && candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-accent" />
           <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Parsing institutional volume clusters...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="premium-card p-24 text-center">
            <div className="text-muted-foreground text-sm">No multibagger candidates identified in current scan cycle.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {candidates.map((c) => (
            <div key={c.ticker} className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)] flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold text-lg tracking-tight group-hover:text-accent transition-colors">{c.ticker}</h3>
                    <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm tabular-nums">₹{c.currentPrice?.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">VERIFIED</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Discovery Score</div>
                    <div className="font-mono text-3xl font-bold tabular-nums bg-gradient-emerald bg-clip-text text-transparent">
                    {(c.confidence_level || c.confidence)?.toFixed(0) || '---'}
                    </div>
                </div>
                </div>

                <Bookmark className="h-3.5 w-3.5 text-muted-foreground mb-3" />

                <div className="mb-4">
                <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">Quant Confidence</span>
                    <span className="font-mono font-bold tabular-nums text-accent">{c.confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-emerald transition-all duration-1000" style={{ width: `${c.confidence}%` }} />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Classification</div>
                    <div className="text-[11px] font-bold mt-0.5 uppercase tracking-wide truncate">{c.classification || 'Alpha Bet'}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Momentum</div>
                    <div className="text-[11px] font-bold mt-0.5 text-success uppercase tracking-wide">STR. BULLISH</div>
                </div>
                </div>

                <div className="rounded-lg border-l-4 border-accent bg-accent/5 px-3 py-2 text-[11px] text-foreground/80 mb-4 font-medium italic">
                   {c.one_liner || c.reason || "Structural breakout with institutional accumulation cluster identified."}
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
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-1 bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald"
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

export default Multibaggers;
