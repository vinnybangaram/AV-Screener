import { Award, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState } from "react";

interface SystemPositionsTableProps {
  data?: any[];
  showHeader?: boolean;
}

export function SystemPositionsTable({ data = [], showHeader = true }: SystemPositionsTableProps) {
  const [posTab, setPosTab] = useState("active");

  const filtered = useMemo(() => {
    const active = data;
    const targetHit = data.filter(i => (i.side !== 'SHORT' ? i.latest_price >= i.target_price : i.latest_price <= i.target_price) && i.target_price > 0);
    const slHit = data.filter(i => (i.side !== 'SHORT' ? i.latest_price <= i.stop_loss : i.latest_price >= i.stop_loss) && i.stop_loss > 0);
    
    return { active, targetHit, slHit };
  }, [data]);

  const renderTable = (items: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-semibold px-5 py-2.5">Asset</th>
            <th className="text-left font-semibold py-2.5">Strategy</th>
            <th className="text-left font-semibold py-2.5">Date</th>
            <th className="text-right font-semibold py-2.5">Entry</th>
            <th className="text-right font-semibold py-2.5">Current</th>
            <th className="text-center font-semibold py-2.5">Side</th>
            <th className="text-right font-semibold py-2.5">SL</th>
            <th className="text-right font-semibold py-2.5">Target</th>
            <th className="text-right font-semibold py-2.5">Overall PNL</th>
            <th className="text-right font-semibold pr-5 py-2.5">Alpha</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const pnlValue = p.latest_pnl * p.quantity;
            const pnlUp = pnlValue >= 0;
            const alphaUp = p.latest_pnl_percent >= 0;
            return (
              <tr key={p.id || p.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-bold text-foreground tracking-tight">{p.symbol}</td>
                <td className="py-3">
                  <span className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    ["MULTIBAGGER", "INVESTMENT"].includes(p.category?.toUpperCase())
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-warning/10 text-warning border border-warning/20",
                  )}>
                    {p.category || "CORE"}
                  </span>
                </td>
                <td className="py-3 text-xs text-muted-foreground">
                   {p.added_at ? new Date(p.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '---'}
                </td>
                <td className="py-3 text-right font-mono tabular-nums">₹{p.entry_price?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-foreground">₹{p.latest_price?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-center">
                  <span className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
                    p.side === "SHORT" ? "bg-danger/15 text-danger" : "bg-success/15 text-success",
                  )}>{p.side || 'LONG'}</span>
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-danger/80">₹{p.stop_loss?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-success/80">₹{p.target_price?.toLocaleString('en-IN')}</td>
                <td className={cn("py-3 text-right font-mono tabular-nums font-bold", pnlUp ? "text-success" : "text-danger")}>
                  ₹{(Math.abs(pnlValue)).toLocaleString('en-IN')}
                </td>
                <td className={cn("pr-5 py-3 text-right font-mono tabular-nums font-bold", alphaUp ? "text-success" : "text-danger")}>
                  {alphaUp ? "↗" : "↘"} {Math.abs(p.latest_pnl_percent).toFixed(2)}%
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={10} className="p-12 text-center text-sm text-muted-foreground italic">
                No performance data captured for this criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="premium-card overflow-hidden">
      {showHeader && (
        <div className="flex items-start justify-between gap-4 p-5 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
              <Award className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">System Positions</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Quantitative Strategy Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            SL & Target are system-generated estimates, not financial advice
          </div>
        </div>
      )}

      <Tabs value={posTab} onValueChange={setPosTab} className="w-full">
        <div className="px-5">
          <TabsList className="bg-muted/40 h-9 p-1">
            <TabsTrigger value="active" className="text-[11px] uppercase tracking-wider font-bold data-[state=active]:bg-gradient-emerald data-[state=active]:text-white">
              Active <span className="ml-1.5 text-[10px] opacity-80">({filtered.active.length})</span>
            </TabsTrigger>
            <TabsTrigger value="target" className="text-[11px] uppercase tracking-wider font-bold">
              Target Hit <span className="ml-1.5 text-[10px] opacity-80">({filtered.targetHit.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sl" className="text-[11px] uppercase tracking-wider font-bold">
              SL Hit <span className="ml-1.5 text-[10px] opacity-80">({filtered.slHit.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-3">
          {renderTable(filtered.active)}
        </TabsContent>
        <TabsContent value="target" className="mt-3">
          {renderTable(filtered.targetHit)}
        </TabsContent>
        <TabsContent value="sl" className="mt-3">
          {renderTable(filtered.slHit)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
