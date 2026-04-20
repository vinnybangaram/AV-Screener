import { Award, AlertCircle } from "lucide-react";
import { systemPositions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SystemPositionsTableProps {
  limit?: number;
  showHeader?: boolean;
}

export function SystemPositionsTable({ limit, showHeader = true }: SystemPositionsTableProps) {
  const active = limit ? systemPositions.slice(0, limit) : systemPositions;

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

      <Tabs defaultValue="active" className="w-full">
        <div className="px-5">
          <TabsList className="bg-muted/40 h-9">
            <TabsTrigger value="active" className="text-xs data-[state=active]:bg-gradient-emerald data-[state=active]:text-white">
              Active <span className="ml-1.5 text-[10px] opacity-80">({active.length})</span>
            </TabsTrigger>
            <TabsTrigger value="target" className="text-xs">Target Hit <span className="ml-1.5 text-[10px] opacity-80">(0)</span></TabsTrigger>
            <TabsTrigger value="sl" className="text-xs">SL Hit <span className="ml-1.5 text-[10px] opacity-80">(0)</span></TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-3">
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
                  <th className="text-right font-semibold py-2.5">Exit</th>
                  <th className="text-right font-semibold py-2.5">Overall PNL</th>
                  <th className="text-right font-semibold pr-5 py-2.5">Alpha</th>
                </tr>
              </thead>
              <tbody>
                {active.map((p) => {
                  const pnlUp = p.pnl >= 0;
                  const alphaUp = p.alpha >= 0;
                  return (
                    <tr key={p.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-foreground tracking-tight">{p.symbol}</td>
                      <td className="py-3">
                        <span className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          p.strategy === "MULTIBAGGER"
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-warning/10 text-warning border border-warning/20",
                        )}>
                          {p.strategy}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{p.date}</td>
                      <td className="py-3 text-right font-mono tabular-nums">₹{p.entry.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono tabular-nums">₹{p.current.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
                          p.side === "LONG" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                        )}>{p.side}</span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-danger">₹{p.sl.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono tabular-nums text-success">₹{p.target.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono tabular-nums text-muted-foreground">---</td>
                      <td className={cn("py-3 text-right font-mono tabular-nums font-bold", pnlUp ? "text-success" : "text-danger")}>
                        {pnlUp ? "₹" : "₹"}{p.pnl.toFixed(2)}
                      </td>
                      <td className={cn("pr-5 py-3 text-right font-mono tabular-nums font-bold", alphaUp ? "text-success" : "text-danger")}>
                        {alphaUp ? "↗" : "↘"} {Math.abs(p.alpha).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="target" className="mt-3">
          <div className="p-12 text-center text-sm text-muted-foreground">No targets hit yet today.</div>
        </TabsContent>
        <TabsContent value="sl" className="mt-3">
          <div className="p-12 text-center text-sm text-muted-foreground">No stop losses triggered.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
