import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChangeBadge } from "@/components/common/Badges";
import { 
  Play, 
  History, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Activity, 
  Loader2, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  XCircle,
  BrainCircuit,
  BarChart3,
  Waves,
  CalendarDays,
  LineChart,
  Save,
  Trash2,
  Copy
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Bar,
  BarChart,
  Line,
  LineChart as RechartsLineChart,
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { runBacktest, saveBacktest, fetchBacktestHistory } from "@/services/api";
import { cn } from "@/lib/utils";

const strategies = [
  { id: "multibagger", name: "Multibagger Compounder", desc: "Breakout momentum with RSI confirmation" },
  { id: "trend", name: "Trend Following 50/200", desc: "Classic SMA 50/200 Golden/Death cross" },
];

const Backtesting = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("");
  
  const [strategy, setStrategy] = useState("multibagger");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [capital, setCapital] = useState("100000");
  const [start, setStart] = useState("2023-01-01");
  const [end, setEnd] = useState("2024-04-15");
  const [risk, setRisk] = useState([2]);
  
  // Results State
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // Filter states
  const [tradeSearch, setTradeSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all"); // all, wins, losses

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
        const data = await fetchBacktestHistory();
        setHistory(data || []);
    } catch (err) {
        console.error("Failed to load history");
    }
  };

  const stats = results?.stats || { 
    cagr: 0, max_dd: 0, win_rate: 0, sharpe: 0, final_equity: 100000,
    profit_factor: 0, avg_gain: 0, avg_loss: 0, recovery_factor: 0,
    win_streak: 0, loss_streak: 0, exposure: 0
  };
  
  const equity = results?.equity_curve || [];
  const trades = results?.trades || [];
  const monthlyReturns = results?.monthly_returns || [];
  const drawdownSeries = results?.drawdown_series || [];
  const benchmark = results?.benchmark || [];

  const handleRun = async () => {
    setLoading(true);
    setLoadingProgress(5);
    setLoadingStage("Initializing engine...");
    
    // Simulate premium wait
    const stages = [
      { p: 15, s: "Scanning candles..." },
      { p: 40, s: "Generating entries..." },
      { p: 75, s: "Calculating metrics..." },
      { p: 90, s: "Syncing AI insights..." },
    ];

    let currentInterval = 0;
    const interval = setInterval(() => {
        if (currentInterval < stages.length) {
            setLoadingProgress(stages[currentInterval].p);
            setLoadingStage(stages[currentInterval].s);
            currentInterval++;
        }
    }, 1200);

    try {
      const res = await runBacktest({
        strategy_id: strategy,
        symbol,
        start_date: start,
        end_date: end,
        initial_capital: parseFloat(capital),
        risk_pct: risk[0]
      });
      
      clearInterval(interval);
      setLoadingProgress(100);
      setLoadingStage("Complete!");
      
      setTimeout(() => {
        setResults(res);
        setLoading(false);
        toast.success(`Simulation successful for ${symbol}`, {
            description: `CAGR: ${res.stats.cagr}% | Win Rate: ${res.stats.win_rate}%`
        });
      }, 500);
      
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.response?.data?.detail || "Backtest failed. Check your parameters.");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results) return;
    setSaving(true);
    try {
        await saveBacktest({
            strategy_id: strategy,
            symbol,
            start_date: start,
            end_date: end,
            initial_capital: parseFloat(capital),
            risk_pct: risk[0],
            stats: results.stats,
            notes: "Manually saved run"
        });
        toast.success("Strategy run saved to cloud");
        loadHistory();
    } catch (err) {
        toast.error("Failed to save run");
    } finally {
        setSaving(false);
    }
  };

  const filteredTrades = useMemo(() => {
    return trades.filter((t: any) => {
        const matchesSearch = t.date.toLowerCase().includes(tradeSearch.toLowerCase()) || 
                             symbol.toLowerCase().includes(tradeSearch.toLowerCase());
        const matchesFilter = tradeFilter === "all" ? true :
                             tradeFilter === "wins" ? t.pnl > 0 :
                             t.pnl < 0;
        return matchesSearch && matchesFilter;
    });
  }, [trades, tradeSearch, tradeFilter, symbol]);

  const exportCSV = () => {
    if (!trades.length) return;
    const headers = ["Date", "Symbol", "Side", "Entry", "Exit", "PnL %", "Hold"];
    const rows = trades.map((t: any) => [t.date, symbol, t.side, t.entry, t.exit, t.pnl, t.hold]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `backtest_${symbol}_${strategy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const combinedData = useMemo(() => {
    if (!equity.length || !benchmark.length) return [];
    return equity.map((item: any, index: number) => {
        const b = benchmark.find((x: any) => x.date === item.date) || benchmark[index];
        return {
            date: item.date,
            strategy: item.equity,
            benchmark: b?.equity || item.equity // fallback
        };
    });
  }, [equity, benchmark]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <PageHeader 
            title="Backtesting & AI Simulation" 
            description="Institutional-grade historical validation. Verify alpha before execution." 
        />
        {results && (
            <Button 
                variant="outline" 
                className="gap-2 border-accent text-accent hover:bg-accent/5 h-11 px-6 shadow-glow"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Run To Cloud"}
            </Button>
        )}
      </div>

      {loading && (
        <Card className="p-8 flex flex-col items-center justify-center space-y-4 border-accent/20 bg-accent/5 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <div className="text-center space-y-2 w-full max-w-md">
                <h3 className="text-lg font-bold tracking-tight animate-pulse">{loadingStage}</h3>
                <Progress value={loadingProgress} className="h-2" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Precision modeling in progress</p>
            </div>
        </Card>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="CAGR" value={`${stats.cagr}%`} delta={`Final: ₹${(stats.final_equity / 1000).toFixed(1)}K`} tone={stats.cagr >= 0 ? "success" : "danger"} trendUp={stats.cagr >= 0} icon={TrendingUp} />
            <KpiCard label="Win Rate" value={`${stats.win_rate}%`} delta={`${trades.length} trades`} tone="accent" icon={Award} />
            <KpiCard label="Max Drawdown" value={`${stats.max_dd}%`} delta="Peak-to-trough" tone="warning" icon={ShieldAlert} />
            <KpiCard label="Sharpe Ratio" value={stats.sharpe.toFixed(2)} delta="Risk-adjusted" tone="success" icon={Activity} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Config */}
        <Card className="lg:col-span-1 p-5 bg-gradient-card shadow-card h-fit sticky top-6">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4 bg-background/50 h-8">
                <TabsTrigger value="config" className="text-[10px] uppercase font-bold">Params</TabsTrigger>
                <TabsTrigger value="history" className="text-[10px] uppercase font-bold">History ({history.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-4 mt-0">
                <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Alpha Model</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="mt-1 bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                    {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{strategies.find(s => s.id === strategy)?.desc}</p>
                </div>
                <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Asset Symbol</Label>
                <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                    value={symbol} 
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
                    placeholder="e.g. RELIANCE" 
                    className="pl-8 bg-background/50" 
                    />
                </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Start</Label>
                    <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 bg-background/50 h-9" />
                </div>
                <div>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">End</Label>
                    <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 bg-background/50 h-9" />
                </div>
                </div>
                <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Capital (₹)</Label>
                <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="mt-1 bg-background/50" />
                </div>
                <div>
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Risk per Trade</Label>
                    <span className="text-xs font-bold tabular-nums text-accent">{risk[0]}%</span>
                </div>
                <Slider value={risk} onValueChange={setRisk} min={0.5} max={5} step={0.5} className="mt-2" />
                </div>
                
                <div className="pt-2 border-t border-border/50">
                <Button 
                    onClick={handleRun} 
                    disabled={loading}
                    className="w-full gap-2 bg-gradient-emerald text-white border-0 shadow-glow-emerald hover:scale-[1.02] transition-transform active:scale-95 py-6"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
                    <span className="font-bold text-sm">{loading ? "SIMULATING..." : "RUN BACKTEST"}</span>
                </Button>
                </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-0">
                {history.length === 0 ? (
                    <div className="py-8 text-center opacity-40 italic text-xs">No saved runs yet</div>
                ) : history.map((run: any) => (
                    <div key={run.id} className="p-3 bg-background/50 border border-border/50 rounded-lg hover:border-accent/40 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-accent">{run.symbol}</span>
                            <span className="text-[9px] text-muted-foreground">{new Date(run.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono">{run.strategy_id}</span>
                            <Badge variant="outline" className="text-[9px] px-1 h-4">{run.stats.cagr}% cagr</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    </div>
                ))}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Charts & Metrics Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Chart Section */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <Tabs defaultValue="equity" className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Performance Analytics</h3>
                  <p className="text-xs text-muted-foreground">{symbol} · Strategy Validation</p>
                </div>
                <TabsList className="bg-background/50 border border-border/50 p-1">
                  <TabsTrigger value="equity" className="text-xs gap-1.5"><LineChart className="h-3.5 w-3.5" /> Equity</TabsTrigger>
                  <TabsTrigger value="drawdown" className="text-xs gap-1.5"><Waves className="h-3.5 w-3.5" /> Drawdown</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Monthly</TabsTrigger>
                  <TabsTrigger value="compare" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Compare</TabsTrigger>
                </TabsList>
              </div>

              <div className="h-[350px]">
                {!results ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 border-2 border-dashed border-border/50 rounded-xl">
                      <div className="p-3 bg-muted/20 rounded-full">
                        <Activity className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="text-xs uppercase tracking-widest font-semibold opacity-60">Run simulation to visualize performance</p>
                  </div>
                ) : (
                  <>
                    <TabsContent value="equity" className="h-full mt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equity}>
                          <defs>
                            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" hide />
                          <YAxis 
                            axisLine={false} tickLine={false} 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                            domain={['dataMin - 10000', 'dataMax + 10000']}
                          />
                          <Tooltip 
                            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} 
                            formatter={(v: any) => [`₹${v.toLocaleString()}`, "Equity"]}
                          />
                          <Area type="monotone" dataKey="equity" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#eq)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="drawdown" className="h-full mt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={drawdownSeries}>
                          <defs>
                            <linearGradient id="dd" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" hide />
                          <YAxis 
                            axisLine={false} tickLine={false} 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip 
                            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} 
                            formatter={(v: any) => [`${v}%`, "Drawdown"]}
                          />
                          <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#dd)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="monthly" className="h-full mt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyReturns}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} 
                          />
                          <YAxis 
                            axisLine={false} tickLine={false} 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip 
                            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                          />
                          <Bar 
                            dataKey="return" 
                            radius={[4, 4, 0, 0]} 
                            fill={(entry: any) => entry.return >= 0 ? "hsl(var(--accent))" : "hsl(var(--destructive))"} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="compare" className="h-full mt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={combinedData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" hide />
                          <YAxis 
                            axisLine={false} tickLine={false} 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                          />
                          <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                          <Legend verticalAlign="top" height={36}/>
                          <Line type="monotone" dataKey="strategy" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Algo-S Strategy" />
                          <Line type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="NIFTY 50" />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </Card>

          {/* Deep Metrics & AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" /> AI Strategy Insights
              </h3>
              {!results ? (
                <div className="space-y-3 opacity-30">
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                        "{results.ai_summary}"
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Regime Focus</span>
                            <p className="text-xs font-semibold">Momentum Breakout</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Asset Class</span>
                            <p className="text-xs font-semibold">Equities / NSE</p>
                        </div>
                    </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5">Deep Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Profit Factor</span>
                   <span className="text-xs font-bold font-mono">{stats.profit_factor}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Avg Gain</span>
                   <span className="text-xs font-bold font-mono text-emerald-500">{stats.avg_gain}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Avg Loss</span>
                   <span className="text-xs font-bold font-mono text-destructive">{stats.avg_loss}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Recovery Factor</span>
                   <span className="text-xs font-bold font-mono">{stats.recovery_factor}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Win Streak</span>
                   <span className="text-xs font-bold font-mono text-emerald-500">{stats.win_streak}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Loss Streak</span>
                   <span className="text-xs font-bold font-mono text-destructive">{stats.loss_streak}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Exposure</span>
                   <span className="text-xs font-bold font-mono">{stats.exposure}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                   <span className="text-xs text-muted-foreground">Final Capital</span>
                   <span className="text-xs font-bold font-mono text-accent">₹{(stats.final_equity / 1000).toFixed(1)}K</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Trade Log */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-accent/10 rounded-lg">
                <History className="h-5 w-5 text-accent" />
             </div>
             <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Simulation Trade Log</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{trades.length} executions recorded</p>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Search date or asset..." 
                   className="pl-9 h-9 text-xs bg-background/50 border-border/50" 
                   value={tradeSearch}
                   onChange={(e) => setTradeSearch(e.target.value)}
                />
            </div>
            <Select value={tradeFilter} onValueChange={setTradeFilter}>
                <SelectTrigger className="h-9 w-[120px] text-xs bg-background/50">
                    <SelectValue placeholder="All Trades" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="wins">Winners only</SelectItem>
                    <SelectItem value="losses">Losers only</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs border-border/50 hover:bg-accent/5" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] uppercase font-black text-muted-foreground py-3">Date</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-muted-foreground">Symbol</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-muted-foreground text-center">Outcome</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-muted-foreground">Entry</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-muted-foreground">Exit</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-muted-foreground">Return %</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-muted-foreground">Holding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground italic">
                          {trades.length === 0 ? "Start backtest to see execution logs" : "No trades match your filters"}
                      </TableCell>
                  </TableRow>
              ) : filteredTrades.map((t: any, i: number) => (
                <TableRow key={i} className="group hover:bg-accent/5 border-border/30 transition-colors">
                  <TableCell className="text-xs font-mono text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    <div className="font-bold text-xs">{symbol}</div>
                    <div className="text-[9px] text-muted-foreground">NSE Equity</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {t.pnl > 0 ? 
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 px-1.5 h-5 text-[9px]"><CheckCircle2 className="h-2.5 w-2.5" /> WIN</Badge> : 
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-1.5 h-5 text-[9px]"><XCircle className="h-2.5 w-2.5" /> LOSS</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs font-medium">₹{t.entry.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs font-bold">₹{t.exit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <ChangeBadge value={t.pnl} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground">{t.hold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Trust Layer */}
      <Card className="p-6 border-accent/20 bg-accent/5">
        <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <ShieldAlert className="h-8 w-8 text-accent animate-pulse" />
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Simulation Guardrails Active</h4>
                    <p className="text-[10px] text-muted-foreground max-w-sm">Brokerage (0.03%) and Slippage (0.1%) included. Past performance does not guarantee future results.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold">Brokerage Included</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold">Slippage Included</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold">Taxes (Optional)</span>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default Backtesting;
