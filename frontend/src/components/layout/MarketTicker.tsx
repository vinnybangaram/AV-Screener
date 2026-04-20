import { marketTicker } from "@/lib/mock-data";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketTicker() {
  const items = [...marketTicker, ...marketTicker, ...marketTicker];
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
            <div key={i} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <span className="font-semibold text-foreground tracking-tight">{t.symbol}</span>
              <span className="font-mono text-muted-foreground">{t.price}</span>
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
