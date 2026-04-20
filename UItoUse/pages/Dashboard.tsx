import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { SystemPositionsTable } from "@/components/dashboard/SystemPositionsTable";
import { PortfolioPerformanceChart } from "@/components/dashboard/PortfolioPerformanceChart";
import { AssetAllocationChart } from "@/components/dashboard/AssetAllocationChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  alertsTimeline, intradayScans, kpisIntraday, kpisInvestment, opportunities,
  priceSeries, sectors, watchlistSnapshot,
} from "@/lib/mock-data";
import {
  Activity, Brain, Briefcase, Calendar, Download, LineChart, Plus,
  Sparkles, Star, TrendingUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { addToWatchlist } from "@/lib/watchlist-store";
import { toast } from "sonner";

const investmentIcons = [Briefcase, LineChart, Star, TrendingUp];
const intradayIcons = [Zap, Activity, Sparkles, TrendingUp];

const Dashboard = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        description="Executive overview of market activity and your AI-powered insights."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0">
              <Plus className="h-3.5 w-3.5" /> New Screen
            </Button>
          </>
        }
      />

      {/* Mode tabs + Period filter */}
      <Tabs defaultValue="investment" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-card border h-11 p-1 shadow-card">
            <TabsTrigger
              value="investment"
              className="px-5 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-gradient-emerald data-[state=active]:text-white data-[state=active]:shadow-glow-emerald"
            >
              <Briefcase className="h-3.5 w-3.5 mr-1.5" />
              Investment
            </TabsTrigger>
            <TabsTrigger
              value="intraday"
              className="px-5 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-gradient-emerald data-[state=active]:text-white data-[state=active]:shadow-glow-emerald"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Intraday
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 rounded-lg border bg-card p-1 shadow-card">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            {["Today", "This Week", "This Month", "This Year"].map((p, i) => (
              <button
                key={p}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                  i === 2
                    ? "bg-gradient-emerald text-white shadow-glow-emerald"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 mb-1 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="pulse-dot" />
            Live Memory tracking Active
          </span>
          <span className="rounded-full border bg-card px-2.5 py-1 font-mono">
            NIFTY 50 · <span className="text-success font-semibold">24,318.45 (+0.62%)</span>
          </span>
          <span className="ml-auto text-muted-foreground font-mono">⏱ Sync: 14:02:37</span>
        </div>

        <TabsContent value="investment" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpisInvestment.map((k, i) => (
              <KpiCard key={k.label} {...k} icon={investmentIcons[i]} />
            ))}
          </div>

          {/* Performance + Allocation charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PortfolioPerformanceChart />
            </div>
            <AssetAllocationChart />
          </div>
        </TabsContent>

        <TabsContent value="intraday" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpisIntraday.map((k, i) => (
              <KpiCard key={k.label} {...k} icon={intradayIcons[i]} />
            ))}
          </div>

          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="font-semibold text-foreground">Live Intraday Scans</h3>
                <p className="text-xs text-muted-foreground mt-0.5">High-probability setups for today's session</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-accent">Open Intraday →</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-semibold px-5 py-2.5">Symbol</th>
                    <th className="text-left font-semibold py-2.5">Company</th>
                    <th className="text-right font-semibold py-2.5">Price</th>
                    <th className="text-right font-semibold py-2.5">Change</th>
                    <th className="text-center font-semibold py-2.5">Score</th>
                    <th className="text-left font-semibold pr-5 py-2.5">Setup</th>
                  </tr>
                </thead>
                <tbody>
                  {intradayScans.map((o) => (
                    <tr key={o.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-bold tracking-tight">{o.symbol}</td>
                      <td className="py-3 text-muted-foreground">{o.company}</td>
                      <td className="py-3 text-right font-mono tabular-nums">{o.price.toLocaleString()}</td>
                      <td className="py-3 text-right"><ChangeBadge value={o.change} /></td>
                      <td className="py-3 text-center"><ScorePill score={o.score} /></td>
                      <td className="pr-5 py-3 text-xs text-muted-foreground">{o.setup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Heatmap + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Sector Heatmap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Performance across 12 sectors today</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {sectors.map((s) => {
              const intensity = Math.min(Math.abs(s.change) / 2.5, 1);
              const up = s.change >= 0;
              return (
                <div
                  key={s.name}
                  className={cn(
                    "relative rounded-lg p-3 border transition-[var(--transition-base)] hover:scale-[1.02] cursor-pointer",
                    up ? "border-success/20" : "border-danger/20",
                  )}
                  style={{
                    backgroundColor: up
                      ? `hsl(142 71% 38% / ${0.06 + intensity * 0.18})`
                      : `hsl(0 72% 51% / ${0.06 + intensity * 0.18})`,
                  }}
                >
                  <div className="text-xs font-semibold text-foreground truncate">{s.name}</div>
                  <div className={cn("mt-1 font-mono text-sm font-bold tabular-nums", up ? "text-success" : "text-danger")}>
                    {up ? "+" : ""}{s.change.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 text-white shadow-elevated p-5"
          style={{ background: "linear-gradient(135deg, hsl(200 60% 8%) 0%, hsl(170 65% 12%) 50%, hsl(158 70% 16%) 100%)" }}
        >
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-success/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">AI Market Insight</span>
            </div>
            <h3 className="text-base font-bold mb-2 leading-snug">Momentum building in IT & Banking</h3>
            <p className="text-sm text-white/75 leading-relaxed mb-4">
              Breadth improved across large-cap IT with 8 of 10 above their 50-DMA. Watch continuation if NIFTY holds above 24,250.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <span className="text-[11px] text-white/70">Updated 2m ago</span>
              </div>
              <Button size="sm" className="h-7 text-xs bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald">
                Read more →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System Positions */}
      <SystemPositionsTable />

      {/* Opportunities + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 premium-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="font-semibold text-foreground">Trending Opportunities</h3>
              <p className="text-xs text-muted-foreground mt-0.5">AI-ranked setups identified today</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-accent">View screener →</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-semibold px-5 py-2.5">Symbol</th>
                  <th className="text-left font-semibold py-2.5">Company</th>
                  <th className="text-right font-semibold py-2.5">Price</th>
                  <th className="text-right font-semibold py-2.5">Change</th>
                  <th className="text-center font-semibold py-2.5">Score</th>
                  <th className="text-left font-semibold py-2.5">Setup</th>
                  <th className="text-right font-semibold pr-5 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-foreground tracking-tight">{o.symbol}</td>
                    <td className="py-3 text-muted-foreground">{o.company}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{o.price.toLocaleString()}</td>
                    <td className="py-3 text-right"><ChangeBadge value={o.change} /></td>
                    <td className="py-3 text-center"><ScorePill score={o.score} /></td>
                    <td className="py-3 text-xs text-muted-foreground">{o.setup}</td>
                    <td className="pr-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => {
                          const added = addToWatchlist(o.symbol);
                          toast[added ? "success" : "info"](
                            added ? `${o.symbol} added to watchlist` : `${o.symbol} is already in your watchlist`
                          );
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Watchlist
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Recent Alerts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live activity feed</p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative space-y-3">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {alertsTimeline.map((a, i) => (
              <div key={i} className="relative flex gap-3 pl-5">
                <div
                  className={cn(
                    "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                    a.tone === "success" && "bg-success",
                    a.tone === "danger" && "bg-danger",
                    a.tone === "warning" && "bg-warning",
                    a.tone === "accent" && "bg-accent",
                  )}
                />
                <div className="flex-1 min-w-0 pb-2">
                  <div className="text-sm font-medium text-foreground leading-tight">{a.title}</div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Watchlist snapshot */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Watchlist Snapshot</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your tracked symbols at a glance</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-accent">Manage →</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {watchlistSnapshot.map((w) => (
            <div key={w.symbol} className="rounded-lg border bg-card p-3 hover:shadow-card transition-[var(--transition-base)] hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-foreground">{w.symbol}</span>
                <ChangeBadge value={w.change} />
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums mb-2">{w.price.toLocaleString()}</div>
              <div className="h-8 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceSeries.slice(-20)}>
                    <defs>
                      <linearGradient id={`g-${w.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={w.change >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={w.change >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="p"
                      stroke={w.change >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"}
                      strokeWidth={1.5}
                      fill={`url(#g-${w.symbol})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
