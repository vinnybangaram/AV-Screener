import { marketTicker } from "@/lib/mock-data";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketTicker() {
  const items = [...marketTicker, ...marketTicker];
  return (
    <div className="relative overflow-hidden border-b bg-card">
      <div className="ticker-track flex w-max gap-8 py-2 px-4">
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
            <span className="text-border">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
