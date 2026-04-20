import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchWatchlist, removeFromWatchlist } from "@/services/api";
import { Activity, Archive, ChevronRight, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type CategoryKey = "ALL" | "MULTIBAGGER" | "INTRADAY" | "PENNY" | "CORE";

const categories: Array<{ key: CategoryKey; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "MULTIBAGGER", label: "Multibagger" },
  { key: "INTRADAY", label: "Intraday" },
  { key: "PENNY", label: "Penny" },
  { key: "CORE", label: "Core" },
];

const Watchlist = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const res = await fetchWatchlist();
      setList(res || []);
    } catch (err) {
      toast.error("Unable to synchronize watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleRemove = async (id: string, symbol: string) => {
    try {
      await removeFromWatchlist(id);
      setList(prev => prev.filter(i => i.id !== id));
      toast.success(`${symbol} archived from terminal memory.`);
    } catch (err) {
      toast.error(`Fault archiving ${symbol}.`);
    }
  };

  const counts: Record<CategoryKey, number> = useMemo(() => {
    return {
      ALL: list.length,
      MULTIBAGGER: list.filter((w) => w.category?.toUpperCase() === "MULTIBAGGER").length,
      INTRADAY: list.filter((w) => w.category?.toUpperCase() === "INTRADAY").length,
      PENNY: list.filter((w) => w.category?.toUpperCase() === "PENNY").length,
      CORE: list.filter((w) => ["CORE", "INVESTMENT", "MANUAL"].includes(w.category?.toUpperCase())).length,
    };
  }, [list]);

  if (loading && !list.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Synchronizing Portfolio Memory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-accent/5 p-6 shadow-card">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-emerald shadow-glow-emerald">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Asset Intelligence Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Tracking <span className="bg-gradient-emerald bg-clip-text text-transparent">Portfolio Memory</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Automated historical price capture for every tracked opportunity</p>
        </div>
      </div>

      <Tabs defaultValue="ALL" className="w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-2">
            {categories.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-bold text-muted-foreground data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
              >
                {c.label}
                <span className={cn(
                  "ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold",
                )}>
                  {counts[c.key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0" onClick={() => navigate('/analyse')}>
            <Plus className="h-3.5 w-3.5" /> Add Symbol
          </Button>
        </div>

        {categories.map((cat) => {
          const filtered = cat.key === "ALL"
            ? list
            : cat.key === "CORE" 
              ? list.filter((w) => ["CORE", "INVESTMENT", "MANUAL"].includes(w.category?.toUpperCase()))
              : list.filter((w) => w.category?.toUpperCase() === cat.key);

          return (
            <TabsContent key={cat.key} value={cat.key} className="mt-6">
              {filtered.length === 0 ? (
                <div className="premium-card p-24 text-center">
                   <div className="text-muted-foreground text-sm mb-4">No active trace for {cat.label.toLowerCase()} positions.</div>
                   <Button variant="outline" size="sm" onClick={() => navigate('/analyse')}>Initiate First Scan</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((w: any) => (
                    <MemoryCard key={w.id} item={w} onArchive={() => handleRemove(w.id, w.symbol)} onAnalyse={() => navigate(`/analysis?s=${w.symbol}`)} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

function MemoryCard({ item: w, onArchive, onAnalyse }: { item: any, onArchive: () => void, onAnalyse: () => void }) {
  const pnlPct = w.latest_pnl_percent || 0;
  const up = pnlPct >= 0;
  return (
    <div className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)] flex flex-col group">
      <div className="flex items-start justify-between mb-3">
        <div>
           <button onClick={onAnalyse} className="font-bold text-lg tracking-tight hover:text-accent transition-colors">{w.symbol}</button>
           <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">{w.company || w.category || 'Asset'}</div>
        </div>
        <div className="text-right">
          <div className={cn("font-mono text-base font-bold tabular-nums", up ? "text-success" : "text-danger")}>
            {up ? "+" : ""}{pnlPct.toFixed(2)}%
          </div>
          <div className={cn("text-[11px] font-mono tabular-nums opacity-80 font-bold", up ? "text-success" : "text-danger")}>
            {up ? "↑" : "↓"} ₹{Math.abs((w.latest_pnl || 0)).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={cn(
          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          w.category === "MULTIBAGGER" && "bg-accent/10 text-accent border border-accent/20",
          w.category === "PENNY" && "bg-warning/10 text-warning border border-warning/20",
          w.category === "INTRADAY" && "bg-success/10 text-success border border-success/20",
          (!w.category || w.category === "CORE" || w.category === "MANUAL") && "bg-muted text-muted-foreground border",
        )}>{w.category || 'MANUAL'}</span>
        <span className={cn(
          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          w.side === "SHORT" ? "bg-danger/15 text-danger" : "bg-success/15 text-success",
        )}>{w.side || 'LONG'}</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium flex items-center gap-1">
          ⏱ {w.added_at ? new Date(w.added_at).toLocaleDateString() : '---'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Memory Entry</div>
          <div className="font-mono text-base font-bold tabular-nums mt-0.5">₹{w.entry_price?.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pulse Price</div>
          <div className="font-mono text-base font-bold tabular-nums mt-0.5">₹{w.latest_price?.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 border p-3 mb-4 grid grid-cols-2 gap-3 group-hover:bg-muted/50 transition-colors">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Stop Loss Engine</div>
          <div className="font-mono text-sm font-bold tabular-nums text-danger mt-0.5">₹{w.stop_loss?.toLocaleString('en-IN') || '---'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Profit Target</div>
          <div className="font-mono text-sm font-bold tabular-nums text-success mt-0.5">₹{w.target_price?.toLocaleString('en-IN') || '---'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <Button onClick={onAnalyse} size="sm" className="gap-1 bg-gradient-emerald hover:opacity-90 text-white border-0 text-[11px] h-8 px-3 font-bold uppercase tracking-wider shadow-glow-emerald">
          Intel Analysis <ChevronRight className="h-3 w-3" />
        </Button>
        <button onClick={onArchive} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-danger transition-colors font-bold uppercase tracking-wider">
          <Archive className="h-3 w-3" /> Archive
        </button>
      </div>
    </div>
  );
}

export default Watchlist;
