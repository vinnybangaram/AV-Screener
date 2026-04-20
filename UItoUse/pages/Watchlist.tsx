import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { watchlistMemory } from "@/lib/mock-data";
import { Activity, Archive, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryKey = "ALL" | "MULTIBAGGER" | "INTRADAY" | "PENNY" | "MANUAL";

const categories: Array<{ key: CategoryKey; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "MULTIBAGGER", label: "Multibagger" },
  { key: "INTRADAY", label: "Intraday" },
  { key: "PENNY", label: "Penny" },
  { key: "MANUAL", label: "Manual" },
];

const Watchlist = () => {
  const counts: Record<CategoryKey, number> = {
    ALL: watchlistMemory.length,
    MULTIBAGGER: watchlistMemory.filter((w) => w.category === "MULTIBAGGER").length,
    INTRADAY: watchlistMemory.filter((w) => w.category === "INTRADAY").length,
    PENNY: watchlistMemory.filter((w) => w.category === "PENNY").length,
    MANUAL: watchlistMemory.filter((w) => w.category === "MANUAL").length,
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-accent/5 p-6">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />
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
          <p className="mt-2 text-sm text-muted-foreground">Automatic historical price capture for every tracked opportunity</p>
        </div>
      </div>

      <Tabs defaultValue="ALL" className="w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-2">
            {categories.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-bold text-muted-foreground data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {c.label}
                <span className={cn(
                  "ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold",
                  "data-[state=active]:bg-accent/15 data-[state=active]:text-accent",
                )}>
                  {counts[c.key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0">
            <Plus className="h-3.5 w-3.5" /> Add Symbol
          </Button>
        </div>

        {categories.map((cat) => {
          const list = cat.key === "ALL"
            ? watchlistMemory
            : watchlistMemory.filter((w) => w.category === cat.key);

          return (
            <TabsContent key={cat.key} value={cat.key} className="mt-6">
              {list.length === 0 ? (
                <div className="premium-card p-16 text-center text-sm text-muted-foreground">
                  No {cat.label.toLowerCase()} positions yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {list.map((w) => (
                    <MemoryCard key={w.symbol} item={w} />
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

function MemoryCard({ item: w }: { item: typeof watchlistMemory[number] }) {
  const up = w.change >= 0;
  return (
    <div className="premium-card p-5 hover:-translate-y-1 transition-[var(--transition-base)] flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg tracking-tight">{w.symbol}</h3>
        <div className="text-right">
          <div className={cn("font-mono text-base font-bold tabular-nums", up ? "text-success" : "text-danger")}>
            {up ? "+" : ""}{w.change.toFixed(2)}%
          </div>
          <div className={cn("text-[11px] font-mono tabular-nums", up ? "text-success" : "text-danger")}>
            {up ? "↑" : "↓"} ₹{Math.abs(w.delta).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={cn(
          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          w.category === "MULTIBAGGER" && "bg-accent/10 text-accent border border-accent/20",
          w.category === "PENNY" && "bg-warning/10 text-warning border border-warning/20",
          w.category === "INTRADAY" && "bg-success/10 text-success border border-success/20",
          w.category === "MANUAL" && "bg-muted text-muted-foreground border",
        )}>{w.category}</span>
        <span className={cn(
          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          w.side === "LONG" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
        )}>{w.side}</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium flex items-center gap-1">
          ⏱ {w.date}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Memory Entry</div>
          <div className="font-mono text-base font-bold tabular-nums mt-0.5">₹{w.memoryEntry.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pulse Price</div>
          <div className="font-mono text-base font-bold tabular-nums mt-0.5">₹{w.pulsePrice.toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 border p-3 mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Stop Loss Engine</div>
          <div className="font-mono text-sm font-bold tabular-nums text-danger mt-0.5">₹{w.stopLoss.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Profit Target</div>
          <div className="font-mono text-sm font-bold tabular-nums text-success mt-0.5">₹{w.profitTarget.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <Button size="sm" className="gap-1 bg-gradient-emerald hover:opacity-90 text-white border-0 text-[11px] h-8 px-3 font-bold uppercase tracking-wider shadow-glow-emerald">
          Intel Analysis <ChevronRight className="h-3 w-3" />
        </Button>
        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-danger transition-colors">
          <Archive className="h-3 w-3" /> Archive
        </button>
      </div>
    </div>
  );
}

export default Watchlist;
