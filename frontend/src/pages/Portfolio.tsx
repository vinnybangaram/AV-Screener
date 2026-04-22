import { useMemo, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChangeBadge } from "@/components/common/Badges";
import { Briefcase, TrendingUp, ShieldCheck, Sparkles, Download, RefreshCcw, PieChart as PieIcon, Loader2, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { fetchPortfolioSummary } from "@/services/api";
import { cn } from "@/lib/utils";

const sectorPalette = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--danger))", "hsl(220 70% 55%)", "hsl(280 65% 55%)"];

const Portfolio = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPortfolioSummary();
      setData(res);
    } catch (err) {
      console.error("Portfolio load failed:", err);
      toast.error("Failed to load live portfolio data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing with exchange data...</p>
      </div>
    );
  }

  const stats = {
    invested: data?.total_invested || 0,
    current: data?.total_value || 0,
    pl: data?.total_pnl || 0,
    plPct: data?.total_pnl_percent || 0,
    holdingsCount: data?.holdings_count || 0,
    riskScore: data?.risk_score || 0
  };

  const sectorData = data?.sector_allocation || [];
  const holdings = data?.holdings || [];
  const suggestions = data?.rebalance_suggestions || [];

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
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => toast.info("Add stock feature coming in next update. Use backend for now.")}>
              <Plus className="h-3.5 w-3.5" /> Add Stock
            </Button>
            <Button 
              size="sm" 
              disabled={loading}
              className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0" 
              onClick={loadData}
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> {loading ? "Syncing..." : "Refresh"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Value" value={`₹${(stats.current / 1000).toFixed(2)}K`} delta={`Invested ₹${(stats.invested / 1000).toFixed(2)}K`} tone="accent" icon={Briefcase} />
        <KpiCard label="Total P/L" value={`₹${stats.pl.toFixed(0)}`} delta={`${stats.plPct >= 0 ? "+" : ""}${stats.plPct.toFixed(2)}%`} tone={stats.pl >= 0 ? "success" : "danger"} trendUp={stats.pl >= 0} icon={TrendingUp} />
        <KpiCard label="Holdings" value={String(stats.holdingsCount)} delta={`Across ${sectorData.length} sectors`} tone="warning" icon={PieIcon} />
        <KpiCard label="Risk Score" value={`${stats.riskScore} / 100`} delta="Moderate · Diversified" tone="success" icon={ShieldCheck} />
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
                {holdings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No active holdings found. Start by adding stocks to your portfolio.
                    </TableCell>
                  </TableRow>
                ) : holdings.map((h: any) => (
                  <TableRow key={h.symbol}>
                    <TableCell>
                      <div className="font-bold">{h.symbol}</div>
                      <div className="text-[11px] text-muted-foreground">{h.company_name || h.symbol}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{h.sector}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{h.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">₹{h.avg_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">₹{h.current_price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="tabular-nums font-semibold">₹{h.pnl.toFixed(0)}</div>
                      <ChangeBadge value={h.pnl_percent} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Progress value={h.weight} className="w-16 h-1.5" />
                        <span className="text-xs tabular-nums w-10 text-right">{h.weight}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Sector Allocation</h3>
          <p className="text-xs text-muted-foreground mb-4">% of portfolio by sector</p>
          <div className="h-64">
            {sectorData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No allocation data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2}>
                    {sectorData.map((_: any, i: number) => <Cell key={i} fill={sectorPalette[i % sectorPalette.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
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
          {suggestions.length === 0 ? (
             <div className="md:col-span-3 py-8 text-center text-muted-foreground text-sm">Waiting for more portfolio data to generate insights...</div>
          ) : suggestions.map((t: any, i: number) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{t.symbol}</span>
                <Badge className={
                   t.tone === "success" ? "bg-success/10 text-success border-success/30" :
                   t.tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
                   t.tone === "danger" ? "bg-danger/10 text-danger border-danger/30" :
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
