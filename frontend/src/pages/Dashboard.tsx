import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { SystemPositionsTable } from "@/components/dashboard/SystemPositionsTable";
import { PortfolioPerformanceChart } from "@/components/dashboard/PortfolioPerformanceChart";
import { AssetAllocationChart } from "@/components/dashboard/AssetAllocationChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchDashboard, addToWatchlist } from "@/services/api";
import {
  Activity, Brain, Briefcase, Calendar, Download, LineChart, Plus,
  Sparkles, Star, TrendingUp, Zap, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MarketRegime from "@/components/dashboard/MarketRegime";
import PortfolioHealthEngine from "@/components/dashboard/PortfolioHealthEngine";

const investmentIcons = [Briefcase, Activity, Calendar, Star];
const intradayIcons = [Zap, Activity, Sparkles, TrendingUp];

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mainTab, setMainTab] = useState("investment");
  const [investmentSubTab, setInvestmentSubTab] = useState("all");
  const [intradaySubTab, setIntradaySubTab] = useState("all");
  const [timeframe, setTimeframe] = useState("This Month");
  const navigate = useNavigate();

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      let category = mainTab === "investment" ? "Investment" : "Intraday Radar";
      
      // Fine-grained category mapping for backend filtering
      if (mainTab === "investment" && investmentSubTab !== "all") {
        category = investmentSubTab === "multibagger" ? "Multibaggers" : 
                   investmentSubTab === "penny" ? "Penny Stocks" : "Core Portfolio";
      } else if (mainTab === "intraday" && intradaySubTab !== "all") {
        category = intradaySubTab === "longs" ? "Intraday Longs" : "Intraday Shorts";
      }

      const result = await fetchDashboard(category, timeframe);
      setData(result);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      toast.error("Unable to connect to terminal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 300000);
    return () => clearInterval(interval);
  }, [mainTab, timeframe, investmentSubTab, intradaySubTab]);

  const kpis = useMemo(() => {
    if (!data || !data.user || !data.user.metrics) return [];
    const m = data.user.metrics;
    
    const isIntraday = mainTab === "intraday";
    const labelPrefix = isIntraday ? "Intraday" : "Portfolio";
    
    return [
      { 
        label: `${labelPrefix} Value`, 
        value: `₹${(m.total_value || 0).toLocaleString('en-IN')}`, 
        delta: `${m.total_pnl_pct >= 0 ? '+' : ''}${m.total_pnl_pct?.toFixed(2)}%`, 
        tone: m.total_pnl_pct >= 0 ? "success" : "danger", 
        hint: "Current position value" 
      },
      { 
        label: `${labelPrefix} P/L`, 
        value: `₹${(m.total_pl_abs || 0).toLocaleString('en-IN')}`, 
        delta: `Today: ₹${(m.today_pl_abs || 0).toLocaleString('en-IN')}`, 
        tone: m.total_pl_abs >= 0 ? "success" : "danger" 
      },
      { 
        label: "Alpha Performer", 
        value: m.best_performer?.symbol || "---", 
        delta: `${m.best_performer?.pl_pct?.toFixed(2)} %`, 
        tone: "warning" 
      },
      { 
        label: "Active Nodes", 
        value: String(m.count || 0), 
        delta: `${isIntraday ? 'Open setups' : 'Core positions'}`, 
        tone: "accent" 
      },
    ];
  }, [data, mainTab]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-medium">Synchronizing Terminal Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        description="Executive overview of market activity and your AI-powered insights."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => (window as any).handleExport?.()}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0">
              <Plus className="h-3.5 w-3.5" /> New Screen
            </Button>
          </>
        }
      />

      {/* Mode tabs + Period filter */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
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
            {["Today", "This Week", "This Month", "This Year"].map((p) => (
              <button
                key={p}
                onClick={() => setTimeframe(p)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                  timeframe === p
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
            <span className={cn("pulse-dot", refreshing && "bg-warning")} />
            {refreshing ? "Synchronizing..." : "Live Memory tracking Active"}
          </span>
          <span className="rounded-full border bg-card px-2.5 py-1 font-mono">
            NIFTY 50 · <span className={cn("font-semibold", (data?.global?.marketContext?.change_pct || 0) >= 0 ? "text-success" : "text-danger")}>
              {data?.global?.marketContext?.last_price?.toLocaleString('en-IN')} ({(data?.global?.marketContext?.change_pct || 0) >= 0 ? '+' : ''}{data?.global?.marketContext?.change_pct?.toFixed(2)}%)
            </span>
          </span>
          <span className="ml-auto text-muted-foreground font-mono">⏱ Sync: {new Date(data?.lastUpdated || Date.now()).toLocaleTimeString()}</span>
        </div>

        <TabsContent value="investment" className="mt-5 space-y-6">
          <Tabs defaultValue="all" value={investmentSubTab} onValueChange={setInvestmentSubTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
               <TabsList className="bg-muted/50 border h-9 p-1">
                 <TabsTrigger value="all" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">All Assets</TabsTrigger>
                 <TabsTrigger value="multibagger" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">Multibaggers</TabsTrigger>
                 <TabsTrigger value="penny" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">Penny Stocks</TabsTrigger>
                 <TabsTrigger value="core" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">Core Portfolio</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value={investmentSubTab} className="space-y-6 mt-0">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map((k, i) => (
                    <KpiCard key={k.label} {...k} icon={investmentIcons[i]} />
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <PortfolioPerformanceChart timeframe={timeframe} category={investmentSubTab === 'all' ? 'Investment' : investmentSubTab.toUpperCase()} />
                  </div>
                  <AssetAllocationChart 
                    watchlist={(data?.user?.watchlist || []).filter((o: any) => {
                        if (investmentSubTab === 'all') return true;
                        const cat = o.category?.toLowerCase() || '';
                        if (investmentSubTab === 'core') return cat === 'core' || cat === 'investment' || cat === 'manual';
                        return cat === investmentSubTab;
                    })} 
                  />
               </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="intraday" className="mt-5 space-y-6">
           <Tabs defaultValue="all" value={intradaySubTab} onValueChange={setIntradaySubTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
               <TabsList className="bg-muted/50 border h-9 p-1">
                 <TabsTrigger value="all" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">All Radar</TabsTrigger>
                 <TabsTrigger value="longs" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">Long Positions</TabsTrigger>
                 <TabsTrigger value="shorts" className="text-[10px] uppercase tracking-widest font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">Short Positions</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value={intradaySubTab} className="space-y-6 mt-0">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map((k, i) => (
                    <KpiCard key={k.label} {...k} icon={intradayIcons[i]} />
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <PortfolioPerformanceChart timeframe={timeframe} category={intradaySubTab === 'all' ? 'Intraday Radar' : intradaySubTab === 'longs' ? 'Intraday Longs' : 'Intraday Shorts'} />
                  </div>
                  <AssetAllocationChart 
                    watchlist={(data?.user?.watchlist || []).filter((o: any) => {
                        const cat = o.category?.toLowerCase() || '';
                        if (!cat.includes('intraday')) return false;
                        if (intradaySubTab === 'all') return true;
                        if (intradaySubTab === 'longs') return o.side !== 'SHORT';
                        if (intradaySubTab === 'shorts') return o.side === 'SHORT';
                        return true;
                    })} 
                  />
               </div>

               {/* Live Intraday Scans with UItoUse table layout */}
               <div className="premium-card overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                        {intradaySubTab === 'all' ? 'Live Intraday Scans' : 
                         intradaySubTab === 'longs' ? 'Institutional Buy Clusters' : 'Short-Side Exhaustion Signals'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">High-probability setups for today's session</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-accent" onClick={() => navigate('/intraday')}>Open Intraday →</Button>
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
                      {(data?.user?.watchlist || [])
                       .filter((o: any) => {
                          const cat = o.category?.toLowerCase() || '';
                          if (!cat.includes('intraday')) return false;
                          if (intradaySubTab === 'all') return true;
                          if (intradaySubTab === 'longs') return o.side !== 'SHORT';
                          if (intradaySubTab === 'shorts') return o.side === 'SHORT';
                          return true;
                       })
                       .slice(0, 8).map((o: any) => (
                        <tr key={o.id || o.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/analysis?s=${o.symbol}`)}>
                          <td className="px-5 py-3 font-bold tracking-tight text-foreground">{o.symbol}</td>
                          <td className="py-3 text-muted-foreground">{o.company || "Company Node"}</td>
                          <td className="py-3 text-right font-mono tabular-nums text-foreground">₹{o.latest_price?.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right"><ChangeBadge value={o.latest_pnl_percent} /></td>
                          <td className="py-3 text-center"><ScorePill score={Math.abs(o.latest_pnl_percent * 20)} /></td>
                          <td className="pr-5 py-3 text-xs text-muted-foreground font-bold uppercase tracking-widest">{o.side || "LONG"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Heatmap + AI Insight (From UItoUse) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Sector Heatmap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Performance across {(data?.global?.sectorPerformance || []).length} sectors today</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(data?.global?.sectorPerformance || []).map((s: any) => {
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
            <h3 className="text-base font-bold mb-2 leading-snug">{data?.global?.aiInsight?.title || "Momentum building in IT & Banking"}</h3>
            <p className="text-sm text-white/75 leading-relaxed mb-4">
              {data?.global?.aiInsight?.content || "Breadth improved across large-cap IT with 8 of 10 stocks trading above 50-DMA. Institutional accumulation detected."}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <span className="text-[11px] text-white/70">Terminal Update: Active</span>
              </div>
              <Button size="sm" className="h-7 text-xs bg-gradient-emerald hover:opacity-90 text-white border-0 shadow-glow-emerald">
                Deep Intel →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Modules (Market Regime & Health Engine) - Kept as Additional Modules */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MarketRegime />
          <PortfolioHealthEngine />
      </div>

      {/* System Positions (Existing) */}
      <SystemPositionsTable data={data?.user?.watchlist || []} />

      {/* Opportunities + Alerts (From UItoUse) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 premium-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="font-semibold text-foreground">Trending Opportunities</h3>
              <p className="text-xs text-muted-foreground mt-0.5">AI-ranked setups identified today</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-accent" onClick={() => navigate('/screener')}>View screener →</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-semibold px-5 py-2.5">Symbol</th>
                  <th className="text-right font-semibold py-2.5">Price</th>
                  <th className="text-right font-semibold py-2.5">Change</th>
                  <th className="text-center font-semibold py-2.5">Score</th>
                  <th className="text-left font-semibold py-2.5">Strategy</th>
                  <th className="text-right font-semibold pr-5 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.global?.topGainers || []).slice(0, 6).map((o: any) => (
                  <tr key={o.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-foreground tracking-tight">{o.symbol}</td>
                    <td className="py-3 text-right font-mono tabular-nums text-foreground">₹{o.price?.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right"><ChangeBadge value={o.change_pct} /></td>
                    <td className="py-3 text-center"><ScorePill score={o.momentum_score || 75} /></td>
                    <td className="py-3 text-xs text-muted-foreground uppercase font-bold tracking-wider">Bullish Breakout</td>
                    <td className="pr-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-accent hover:text-accent hover:bg-accent/10"
                        onClick={async () => {
                          try {
                            const res = await addToWatchlist({ 
                                symbol: o.symbol, 
                                entry_price: o.price, 
                                category: 'CORE', 
                                source_module: 'Trending Opportunities' 
                            });
                            if (res) {
                                toast.success(`${o.symbol} added to Core Watchlist`);
                            }
                          } catch (err) {
                            toast.error(`${o.symbol} is already in your watchlist or failed to add.`);
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Watch
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
            {(data?.user?.notifications || []).length > 0 ? (
                (data?.user?.notifications || []).map((a: any, i: number) => (
                    <div key={i} className="relative flex gap-3 pl-5">
                        <div
                        className={cn(
                            "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                            a.priority === "high" ? "bg-danger" : a.type === "alert" ? "bg-warning" : "bg-accent",
                        )}
                        />
                        <div className="flex-1 min-w-0 pb-2">
                        <div className="text-sm font-medium text-foreground leading-tight">{a.message}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
                            {new Date(a.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.symbol || "SYSTEM"}
                        </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="pl-5 text-xs text-muted-foreground italic py-8 text-center">No recent alerts detected in this cycle.</div>
            )}
          </div>
        </div>
      </div>

      {/* Watchlist snapshot (Existing) */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Watchlist Snapshot</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time performance of your tracked symbols</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-accent" onClick={() => navigate('/watchlist')}>Manage →</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(data?.user?.watchlist || []).slice(0, 6).map((w: any) => (
            <div key={w.symbol} className="rounded-lg border bg-card p-3 hover:shadow-card transition-[var(--transition-base)] hover:-translate-y-0.5 cursor-pointer"
               onClick={() => navigate(`/analysis?s=${w.symbol}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-foreground">{w.symbol}</span>
                <ChangeBadge value={w.latest_pnl_percent} />
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums mb-2">₹{w.latest_price?.toLocaleString('en-IN')}</div>
              <div className="h-8 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                      {p: w.entry_price},
                      {p: w.latest_price * 0.98},
                      {p: w.latest_price * 1.01},
                      {p: w.latest_price}
                  ]}>
                    <defs>
                      <linearGradient id={`g-${w.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={(w.latest_pnl_percent || 0) >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={(w.latest_pnl_percent || 0) >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="p"
                      stroke={(w.latest_pnl_percent || 0) >= 0 ? "hsl(142 71% 38%)" : "hsl(0 72% 51%)"}
                      strokeWidth={1.5}
                      fill={`url(#g-${w.symbol})`}
                      animationDuration={1500}
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
