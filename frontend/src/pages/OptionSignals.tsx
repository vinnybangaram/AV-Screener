import { useMemo, useState } from "react";
import { Activity, Flame, Pause, Play, RotateCcw, Square, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { useOptionSignalsEngine } from "@/hooks/useOptionSignalsEngine";
import { LiveSignalsPanel } from "@/components/options/LiveSignalsPanel";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, LayoutDashboard, History as HistoryIcon, Calendar as CalendarIcon, Info } from "lucide-react";
import type { PaperTrade, RiskMode } from "@/lib/options/types";
import { cn } from "@/lib/utils";

type DirectionFilter = "ALL" | "CALL" | "PUT";
type StatusFilter = "ALL" | "OPEN" | "EXIT";
type ResultFilter = "ALL" | "PROFIT" | "LOSS";

const PAGE_SIZE = 8;

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtMoney(n: number) {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}₹${Math.abs(n).toFixed(2)}`;
}

export default function OptionSignals() {
  const eng = useOptionSignalsEngine();
  const [dir, setDir] = useState<DirectionFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [result, setResult] = useState<ResultFilter>("ALL");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("live");
  const [statsDays, setStatsDays] = useState("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportPage, setReportPage] = useState(1);

  const allRows: PaperTrade[] = useMemo(
    () => [...eng.active, ...eng.history],
    [eng.active, eng.history],
  );

  const filteredLive = useMemo(() => {
    return allRows.filter((t) => {
      if (dir !== "ALL" && t.direction !== dir) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (result === "PROFIT" && t.pnl <= 0) return false;
      if (result === "LOSS" && t.pnl > 0) return false;
      return true;
    });
  }, [allRows, dir, status, result]);

  const filteredStats = useMemo(() => {
    if (!eng.stats?.trades) return [];
    return eng.stats.trades.filter((t: PaperTrade) => {
      if (dir !== "ALL" && t.direction !== dir) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (result === "PROFIT" && t.pnl <= 0) return false;
      if (result === "LOSS" && t.pnl > 0) return false;
      return true;
    });
  }, [eng.stats, dir, status, result]);

  const exportFilteredData = () => {
    const data = activeTab === "live" ? filteredLive : filteredStats;
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Time", "Symbol", "Instrument", "Direction", "Lots", "Entry", "Exit", "P&L", "P&L%", "Reason", "Status"
    ];
    
    const csvRows = data.map(t => [
      new Date(t.executionTime).toLocaleString(),
      t.symbol,
      t.instrument || "",
      t.direction,
      t.lots,
      t.entry,
      t.status === "EXIT" ? t.currentPremium : "",
      t.pnl,
      t.pnlPct,
      t.reason,
      t.status
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Option_Trades_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast.success(`Exported ${data.length} records to CSV`);
  };

  if (eng.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-accent animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Syncing with Ignite Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Option Signals"
        description="Automated paper trading engine for Nifty & Banknifty — live scanning, SL/TSL management, and P&L."
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day's P&L</span>
              <span className={cn("text-sm font-black font-mono", eng.totalPnl >= 0 ? "text-success" : "text-danger")}>
                {fmtMoney(eng.totalPnl)}
              </span>

            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  eng.marketOpen ? "border-success/30 text-success bg-success/5" : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", eng.marketOpen ? "bg-success animate-pulse" : "bg-muted-foreground")} />
                {eng.marketOpen ? "Market Live" : "Market Closed"}
              </Badge>
              <Button
                variant={eng.settings.enabled ? "destructive" : "default"}
                size="sm"
                disabled={!eng.marketOpen && !eng.settings.enabled}
                onClick={() => {
                  if (!eng.marketOpen && !eng.settings.enabled) {
                    toast.error("Market session not active. Engine can only be started between 09:15 and 15:30 IST.");
                    return;
                  }
                  eng.updateSettings({ enabled: !eng.settings.enabled });
                }}
              >
                {eng.settings.enabled ? (<><Pause className="h-4 w-4 mr-1.5" />Stop Engine</>) : (<><Play className="h-4 w-4 mr-1.5" />Start Engine</>)}
              </Button>
            </div>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
            <TabsList className="bg-card border shadow-sm">
                <TabsTrigger value="live" className="gap-2">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Live Terminal
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2" onClick={() => eng.loadStats(Number(statsDays), fromDate, toDate)}>
                    <FileText className="h-3.5 w-3.5" /> Performance Reports
                </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
                {activeTab === "live" ? (
                    <Button variant="outline" size="sm" onClick={exportFilteredData} className="gap-2 h-9">
                        <Download className="h-3.5 w-3.5" /> Export Selected
                    </Button>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-card border rounded-md px-2 h-9">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">From</Label>
                            <input 
                                type="date" 
                                value={fromDate} 
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-transparent text-xs border-none outline-none w-[110px]"
                            />
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap ml-1">To</Label>
                            <input 
                                type="date" 
                                value={toDate} 
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-transparent text-xs border-none outline-none w-[110px]"
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-1 text-accent"
                                onClick={() => eng.loadStats(Number(statsDays), fromDate, toDate)}
                            >
                                <RotateCcw className="h-3 w-3" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-border mx-1" />

                        <Select value={statsDays} onValueChange={(v) => { setStatsDays(v); eng.loadStats(Number(v)); }}>
                            <SelectTrigger className="w-[120px] h-9">
                                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={exportFilteredData} className="gap-2 h-9">
                            <Download className="h-3.5 w-3.5" /> Export Filtered
                        </Button>
                    </div>
                )}
            </div>
        </div>


        <TabsContent value="live" className="space-y-6 mt-0">

      {/* Live indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["NIFTY", "BANKNIFTY"] as const).map((sym) => {
          const trade = eng.active.find((t) => t.symbol.toUpperCase() === sym);
          const isComingSoon = sym === "BANKNIFTY";
          
          return (
            <Card key={sym} className={cn("kpi-card relative overflow-hidden", isComingSoon && "opacity-60 grayscale")}>
              {isComingSoon && (
                <div className="absolute top-2 right-2 z-10">
                   <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-black uppercase tracking-widest">Coming Soon</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest font-medium">
                    {sym} {trade && <span className="text-accent ml-1">· {trade.instrument}</span>}
                  </p>
                  <p className="text-3xl font-bold font-mono mt-1">{eng.livePrices[sym].toFixed(2)}</p>
                </div>
                <div className="text-right">
                  {trade ? (
                    <>
                      <Badge className={cn("font-mono", trade.direction === "CALL" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground")}>
                        {trade.direction} OPEN
                      </Badge>
                      <p className={cn("mt-2 text-lg font-bold font-mono", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                        {fmtMoney(trade.pnl)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">TSL stage {trade.tslStage}/3</p>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">{isComingSoon ? "Offline" : "Scanning…"}</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Signals Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["NIFTY", "BANKNIFTY"] as const).map((sym) => {
          const sig = eng.liveSignals[sym];
          const isComingSoon = sym === "BANKNIFTY";
          
          if (isComingSoon) {
            return (
              <Card key={`live-${sym}`} className="p-12 premium-card flex flex-col items-center justify-center text-center gap-3 opacity-50 grayscale border-dashed">
                 <Activity className="h-8 w-8 text-muted-foreground/30" />
                 <div className="space-y-1">
                    <p className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">BankNifty Intelligence</p>
                    <p className="text-xs font-medium italic">Advanced Gamma analysis integration in progress...</p>
                 </div>
                 <Badge variant="outline" className="mt-2">Coming Soon</Badge>
              </Card>
            );
          }

          return sig ? (
            <LiveSignalsPanel key={`live-${sym}`} state={sig} />
          ) : (
            <Card key={`live-${sym}`} className="p-4 premium-card text-xs text-muted-foreground">
              Warming up live signal engine for {sym}…
            </Card>
          );
        })}
      </div>

      {/* Ignite controls + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
              <h3 className="font-semibold">Ignite Engine</h3>
            </div>
            <Switch
              checked={eng.settings.enabled}
              onCheckedChange={(v) => eng.updateSettings({ enabled: v })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <Label className="text-xs text-muted-foreground">Lots Per Trade ({eng.settings.slots})</Label>
              <Slider
                className="mt-2"
                min={1} max={10} step={1}
                value={[eng.settings.slots]}
                onValueChange={([v]) => eng.updateSettings({ slots: v })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Quantity used for each sequential setup</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Trades / day ({eng.settings.trades})</Label>
              <Slider
                className="mt-2"
                min={1} max={5} step={1}
                value={[eng.settings.trades]}
                onValueChange={([v]) => eng.updateSettings({ trades: v })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Daily cap per user</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Risk Mode</Label>
              <Select
                value={eng.settings.riskMode}
                onValueChange={(v) => eng.updateSettings({ riskMode: v as RiskMode })}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Threshold + cooldown</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-bold text-accent flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Trading Expiry
              </Label>
              <Select
                value={eng.settings.preferredExpiry || "Auto"}
                onValueChange={(v) => eng.updateSettings({ preferredExpiry: v === "Auto" ? null : v })}
              >
                <SelectTrigger className="mt-2 border-accent/30 bg-accent/5">
                  <SelectValue placeholder="Select Expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Market Nearest (Auto)</SelectItem>
                  {eng.availableExpiries.map(exp => (
                    <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Choose specific weekly expiry</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => eng.stopAll()}>
              <Square className="h-3.5 w-3.5 mr-1.5" /> Force exit all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => eng.clearHistory()}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear history
            </Button>
          </div>
        </Card>

        <Card className="p-5 premium-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Day Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Running P&L" value={fmtMoney(eng.runningPnl)} tone={eng.runningPnl >= 0 ? "success" : "danger"} mono />
            <Row label="Closed P&L" value={fmtMoney(eng.dailyStats.totalPnl)} tone={eng.dailyStats.totalPnl >= 0 ? "success" : "danger"} mono />
            <Row label="Trades" value={String(eng.dailyStats.trades)} mono />
            <Row label="Win Rate" value={`${eng.winRate}%`} mono />
            <Row label="Avg Gain" value={fmtMoney(eng.dailyStats.avgGain)} tone="success" mono />
            <Row label="Avg Loss" value={fmtMoney(eng.dailyStats.avgLoss)} tone="danger" mono />
          </div>
        </Card>
      </div>
      
      {/* Filter Controls */}
      <Card className="p-4 premium-card my-6">
          <div className="flex flex-wrap items-center gap-3">
              <Tabs value={dir} onValueChange={(v) => { setDir(v as DirectionFilter); setPage(1); setReportPage(1); }}>
                  <TabsList>
                      <TabsTrigger value="ALL">All Directions</TabsTrigger>
                      <TabsTrigger value="CALL">Calls Only</TabsTrigger>
                      <TabsTrigger value="PUT">Puts Only</TabsTrigger>
                  </TabsList>
              </Tabs>
              <Tabs value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); setReportPage(1); }}>
                  <TabsList>
                      <TabsTrigger value="ALL">Any Status</TabsTrigger>
                      <TabsTrigger value="OPEN">Open Only</TabsTrigger>
                      <TabsTrigger value="EXIT">Closed Only</TabsTrigger>
                  </TabsList>
              </Tabs>
              <Tabs value={result} onValueChange={(v) => { setResult(v as ResultFilter); setPage(1); setReportPage(1); }}>
                  <TabsList>
                      <TabsTrigger value="ALL">All P&L</TabsTrigger>
                      <TabsTrigger value="PROFIT">Profitable</TabsTrigger>
                      <TabsTrigger value="LOSS">Loss-Making</TabsTrigger>
                  </TabsList>
              </Tabs>
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Filtered: {filteredLive.length} Trades
              </span>
          </div>
      </Card>

      <TradeTable 
        trades={filteredLive} 
        page={page} 
        setPage={setPage} 
        emptyMessage="No trades yet. Start the engine to begin scanning."
      />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-0">
            {eng.statsLoading ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <Activity className="h-8 w-8 text-accent animate-spin" />
                </div>
            ) : eng.stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 premium-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total P&L</p>
                            <p className={cn("text-2xl font-black mt-1", eng.stats.total_pnl >= 0 ? "text-success" : "text-danger")}>
                                {fmtMoney(eng.stats.total_pnl)}
                            </p>
                        </Card>
                        <Card className="p-4 premium-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Win Rate</p>
                            <p className="text-2xl font-black mt-1 text-accent">{eng.stats.win_rate}%</p>
                        </Card>
                        <Card className="p-4 premium-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Trades</p>
                            <p className="text-2xl font-black mt-1">{eng.stats.trades_count}</p>
                        </Card>
                        <Card className="p-4 premium-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Profit Factor</p>
                            <p className="text-2xl font-black mt-1">
                                {((eng.stats?.win_loss_dist?.wins || 0) / Math.max(eng.stats?.win_loss_dist?.losses || 0, 1)).toFixed(2)}
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 p-6 premium-card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-accent" /> Equity Curve
                                </h3>
                                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Cumulative Performance (₹)</div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={eng.stats.equity_curve}>
                                        <defs>
                                            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}}
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}}
                                        />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))'}}
                                            itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                                        />
                                        <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--accent))" strokeWidth={2.5} fillOpacity={1} fill="url(#pnlGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-6 premium-card">
                            <h3 className="font-bold mb-6 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-warning" /> Win/Loss Ratio
                            </h3>
                            <div className="h-[200px] flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Wins', value: eng.stats?.win_loss_dist?.wins || 0 },
                                                { name: 'Losses', value: eng.stats?.win_loss_dist?.losses || 0 },
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="hsl(var(--success))" />
                                            <Cell fill="hsl(var(--danger))" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black">{eng.stats.win_rate}%</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Accuracy</span>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" /> Profitable Trades</span>
                                    <span className="font-bold">{eng.stats?.win_loss_dist?.wins || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-danger" /> Losing Trades</span>
                                    <span className="font-bold">{eng.stats?.win_loss_dist?.losses || 0}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-5 premium-card bg-accent/5 border-accent/20">
                        <div className="flex gap-4">
                            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Engine Intelligence Insight</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Based on the selected period, your Ignite Engine has maintained a {eng.stats.win_rate}% accuracy. 
                                    The average profit factor is {(eng.stats.win_loss_dist.wins / Math.max(eng.stats.win_loss_dist.losses, 1)).toFixed(2)}. 
                                    Institutional activity was highest during breakouts with PCR &gt; 1.2.
                                </p>
                            </div>
                        </div>
                    </Card>

                        {/* Filter Controls */}
                        <Card className="p-4 premium-card my-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Tabs value={dir} onValueChange={(v) => { setDir(v as DirectionFilter); setPage(1); setReportPage(1); }}>
                                    <TabsList>
                                        <TabsTrigger value="ALL">All Directions</TabsTrigger>
                                        <TabsTrigger value="CALL">Calls Only</TabsTrigger>
                                        <TabsTrigger value="PUT">Puts Only</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); setReportPage(1); }}>
                                    <TabsList>
                                        <TabsTrigger value="ALL">Any Status</TabsTrigger>
                                        <TabsTrigger value="OPEN">Open Only</TabsTrigger>
                                        <TabsTrigger value="EXIT">Closed Only</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs value={result} onValueChange={(v) => { setResult(v as ResultFilter); setPage(1); setReportPage(1); }}>
                                    <TabsList>
                                        <TabsTrigger value="ALL">All P&L</TabsTrigger>
                                        <TabsTrigger value="PROFIT">Profitable</TabsTrigger>
                                        <TabsTrigger value="LOSS">Loss-Making</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Filtered: {filteredStats.length} Trades
                                </span>
                            </div>
                        </Card>

                        <TradeTable 
                            trades={filteredStats} 
                            page={reportPage} 
                            setPage={setReportPage} 
                            pageSize={10}
                            emptyMessage="No historical trades found for the selected criteria."
                        />
                    </>
            ) : (
                <Card className="p-12 text-center text-muted-foreground premium-card border-dashed">
                    No historical data available for the selected period.
                </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeTable({ 
  trades, 
  page, 
  setPage, 
  pageSize = PAGE_SIZE,
  emptyMessage = "No trades yet." 
}: { 
  trades: PaperTrade[]; 
  page: number; 
  setPage: (p: number) => void; 
  pageSize?: number;
  emptyMessage?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = trades.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Card className="premium-card overflow-hidden">
      <div className="overflow-x-auto relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Dir</TableHead>
              <TableHead className="text-right whitespace-nowrap">Lots</TableHead>
              <TableHead className="text-right whitespace-nowrap">Entry</TableHead>
              <TableHead className="text-right whitespace-nowrap">Cur Prem</TableHead>
              <TableHead className="text-right whitespace-nowrap">SL</TableHead>
              <TableHead className="text-right whitespace-nowrap">TSL1</TableHead>
              <TableHead className="text-right whitespace-nowrap">TSL2</TableHead>
              <TableHead className="text-right whitespace-nowrap">TSL3</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">P&L%</TableHead>
              <TableHead className="text-right">P&L (Pts)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right sticky right-0 bg-card/95 backdrop-blur-sm z-10 border-l shadow-[-4px_0_12px_rgba(0,0,0,0.1)]">P&L (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} className="text-center text-muted-foreground py-12">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((t) => (
              <TableRow key={t.id} className={cn(t.status === "OPEN" && "bg-accent/5")}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{fmtTime(t.executionTime)}</TableCell>
                <TableCell className="font-semibold whitespace-nowrap">{t.instrument || t.symbol}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={cn("font-mono text-[11px]", t.direction === "CALL" ? "bg-success/15 text-success hover:bg-success/20" : "bg-danger/15 text-danger hover:bg-danger/20")}>
                    {t.direction === "CALL" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {t.direction}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-medium whitespace-nowrap">{t.lots}</TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">{t.entry.toFixed(2)}</TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-bold whitespace-nowrap",
                  t.status === "OPEN" ? "text-accent animate-pulse" : 
                  t.pnl > 0 ? "text-success opacity-80" :
                  t.pnl < 0 ? "text-danger opacity-80" : 
                  "text-muted-foreground opacity-60"
                )}>
                  {t.currentPremium.toFixed(2)}
                </TableCell>
                <TableCell className={cn("text-right font-mono whitespace-nowrap", t.status === "EXIT" && t.exitReason === "SL Hit" && t.pnl < 0 ? "text-danger font-bold" : "")}>{t.currentSL.toFixed(2)}</TableCell>
                <TableCell className={cn("text-right font-mono text-xs whitespace-nowrap", t.tsl1Hit && "text-success font-bold")}>{t.tsl1.toFixed(2)}</TableCell>
                <TableCell className={cn("text-right font-mono text-xs whitespace-nowrap", t.tsl2Hit && "text-success font-bold")}>{t.tsl2.toFixed(2)}</TableCell>
                <TableCell className={cn("text-right font-mono text-xs whitespace-nowrap", (t.tsl3Hit || t.exitReason === "TSL Locked") && "text-success font-bold")}>{t.tsl3.toFixed(2)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={t.status === "OPEN" ? "default" : "outline"} className="text-[11px]">
                    {t.status === "OPEN" ? "OPEN" : t.exitReason ?? "EXIT"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <ChangeBadge value={t.pnlPct} />
                </TableCell>
                <TableCell className={cn("text-right font-mono font-bold whitespace-nowrap", t.pnlPts >= 0 ? "text-success" : "text-danger")}>
                  {t.pnlPts >= 0 ? `+${t.pnlPts.toFixed(1)}` : t.pnlPts.toFixed(1)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={t.reason}>
                  {t.reason}
                </TableCell>
                <TableCell className="text-right">
                  <ScorePill score={t.confidenceScore} />
                </TableCell>
                <TableCell className={cn("text-right font-mono font-bold sticky right-0 bg-card/95 backdrop-blur-sm z-10 border-l shadow-[-4px_0_12px_rgba(0,0,0,0.1)]", t.pnl >= 0 ? "text-success" : "text-danger")}>
                  {fmtMoney(t.pnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 p-3 border-t">
          <span className="text-[10px] text-muted-foreground uppercase font-bold ml-2">Page {safePage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value, tone, mono }: { label: string; value: string; tone?: "success" | "danger"; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(mono && "font-mono", tone === "success" && "text-success font-semibold", tone === "danger" && "text-danger font-semibold")}>
        {value}
      </span>
    </div>
  );
}
