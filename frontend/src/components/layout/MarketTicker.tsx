import { useState, useEffect } from "react";
import { fetchMarketTicker } from "@/services/api";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketTicker() {
  const [tickerItems, setTickerItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await fetchMarketTicker();
        // Backend returns List[Dict] with {symbol, price, change_pct, type}
        // Map it to include 'up' property for UI
        const mapped = (data || []).map((item: any) => ({
          ...item,
          up: item.change_pct >= 0,
          change: `${item.change_pct >= 0 ? '+' : ''}${item.change_pct}%`
        }));
        setTickerItems(mapped);
      } catch (err) {
        console.error("Ticker fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    const interval = setInterval(fetchItems, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  // Repeat items for smooth infinite loop
  const items = [...tickerItems, ...tickerItems, ...tickerItems];

  if (loading && tickerItems.length === 0) {
    return (
      <div className="sticky top-16 z-20 flex items-center border-b bg-card/90 backdrop-blur-md h-10 px-6 gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Loading Live Feed...</span>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-20 flex items-center border-b bg-card/90 backdrop-blur-md">
      {/* Fixed Live Label */}
      <div className="flex shrink-0 items-center gap-2 px-6 py-2.5 bg-card border-r shadow-[4px_0_12px_rgba(0,0,0,0.05)] z-30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-[10px] font-black text-success uppercase tracking-[0.2em] animate-pulse">Live</span>
      </div>

      {/* Scrolling Track Area */}
      <div className="relative overflow-hidden flex-1">
        <div className="ticker-track flex w-max gap-8 py-2 px-4 items-center h-full">
          {items.map((t, i) => (
            <div key={`${t.symbol}-${i}`} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <span className="font-semibold text-foreground tracking-tight">{t.symbol}</span>
              <span className="font-mono text-muted-foreground">₹{t.price?.toLocaleString('en-IN')}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono font-medium",
                  t.up ? "text-success" : "text-danger",
                )}
              >
                {t.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {t.change}
              </span>
              <span className="text-border ml-2">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
