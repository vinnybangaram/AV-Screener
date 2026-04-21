import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChangeBadge } from "@/components/common/Badges";
import { Briefcase, TrendingUp, ShieldCheck, Sparkles, Download, RefreshCcw, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

interface Holding {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avg: number;
  ltp: number;
  weight: number;
}

const holdings: Holding[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", qty: 40, avg: 2710.5, ltp: 2918.4, weight: 22.4 },
  { symbol: "TCS", name: "Tata Consultancy", sector: "IT", qty: 18, avg: 3890.2, ltp: 4214.1, weight: 14.6 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", qty: 55, avg: 1602.0, ltp: 1684.55, weight: 17.9 },
  { symbol: "INFY", name: "Infosys", sector: "IT", qty: 30, avg: 1715.6, ltp: 1872.3, weight: 10.8 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", qty: 22, avg: 1480.5, ltp: 1592.7, weight: 6.8 },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG", qty: 220, avg: 446.8, ltp: 478.9, weight: 20.4 },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma", qty: 28, avg: 1740.2, ltp: 1812.4, weight: 7.1 },
];

const sectorPalette = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--danger))", "hsl(220 70% 55%)", "hsl(280 65% 55%)"];

const rebalanceTips = [
  { symbol: "RELIANCE", action: "Trim 10%", reason: "Concentration above 22% — diversify into IT", tone: "warning" as const },
  { symbol: "SUNPHARMA", action: "Add 25%", reason: "Defensive sector underweight; momentum turning positive", tone: "success" as const },
  { symbol: "ITC", action: "Hold", reason: "Yield + stability anchor — maintain weight", tone: "neutral" as const },
];

const Portfolio = () => {
  const stats = useMemo(() => {
    let invested = 0, current = 0;
    holdings.forEach((h) => {
      invested += h.avg * h.qty;
      current += h.ltp * h.qty;
    });
    const pl = current - invested;
    const plPct = (pl / invested) * 100;
    return { invested, current, pl, plPct };
  }, []);

  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h) => map.set(h.sector, (map.get(h.sector) || 0) + h.ltp * h.qty));
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: +(value / total * 100).toFixed(1) }));
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Portfolio"
        description="Holdings, allocation, P&L and AI-powered rebalance suggestions."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Portfolio CSV exported")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0" onClick={() => toast.info("Rebalance simulation queued")}>
              <RefreshCcw className="h-3.5 w-3.5" /> Rebalance
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Value" value={`₹${(stats.current / 1000).toFixed(2)}K`} delta={`Invested ₹${(stats.invested / 1000).toFixed(2)}K`} tone="accent" icon={Briefcase} />
        <KpiCard label="Total P/L" value={`₹${stats.pl.toFixed(0)}`} delta={`${stats.plPct >= 0 ? "+" : ""}${stats.plPct.toFixed(2)}%`} tone={stats.pl >= 0 ? "success" : "danger"} trendUp={stats.pl >= 0} icon={TrendingUp} />
        <KpiCard label="Holdings" value={String(holdings.length)} delta="Across 6 sectors" tone="warning" icon={PieIcon} />
        <KpiCard label="Risk Score" value="62 / 100" delta="Moderate · Diversified" tone="success" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Holdings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live mark-to-market valuation</p>
            </div>
            <Badge variant="secondary" className="text-[10px] uppercase">Live</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">LTP</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => {
                  const pl = (h.ltp - h.avg) * h.qty;
                  const plPct = ((h.ltp - h.avg) / h.avg) * 100;
                  return (
                    <TableRow key={h.symbol}>
                      <TableCell>
                        <div className="font-bold">{h.symbol}</div>
                        <div className="text-[11px] text-muted-foreground">{h.name}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{h.sector}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{h.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">₹{h.avg.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">₹{h.ltp.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="tabular-nums font-semibold">₹{pl.toFixed(0)}</div>
                        <ChangeBadge value={plPct} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Progress value={h.weight} className="w-16 h-1.5" />
                          <span className="text-xs tabular-nums w-10 text-right">{h.weight}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Sector Allocation</h3>
          <p className="text-xs text-muted-foreground mb-4">% of portfolio by sector</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2}>
                  {sectorData.map((_, i) => <Cell key={i} fill={sectorPalette[i % sectorPalette.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider">AI Rebalance Suggestions</h3>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase">Beta</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rebalanceTips.map((t) => (
            <div key={t.symbol} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{t.symbol}</span>
                <Badge className={
                  t.tone === "success" ? "bg-success/10 text-success border-success/30" :
                  t.tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
                  "bg-muted text-muted-foreground"
                } variant="outline">{t.action}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.reason}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Portfolio;
