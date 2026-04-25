import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertCircle, Briefcase, CheckCircle2, ChevronDown, Flame, History as HistoryIcon,
  LineChart as LineChartIcon, Pause, Play, Radio, RotateCcw, Sparkles, Target, TrendingDown, TrendingUp,
  Wallet, Zap, ShieldAlert,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { cn } from "@/lib/utils";

type RiskMode = "Conservative" | "Balanced" | "Aggressive";
type EngineStatus = "Idle" | "Scanning" | "Running" | "Cooldown" | "Stopped";
type SignalTone = "green" | "yellow" | "orange" | "blue" | "red" | "muted";
type LiveStatus =
  | "Scanning" | "Weak" | "Low Momentum" | "Breakout Ready" | "Waiting"
  | "Waiting for Retest" | "Strong Momentum" | "Entry Triggered" | "Trade Active" | "Cooldown";

interface Opportunity {
  symbol: string; company: string; sector: string;
  entry: number; current: number; changePct: number;
  confidence: number; side: "BUY" | "SELL"; signal: string;
  status: "Watching" | "Ready" | "Triggered";
}
interface ActiveTrade {
  id: string; symbol: string; entry: number; side: "BUY" | "SELL"; qty: number; current: number;
  pnl: number; pnlPct: number; sl: number; target: number; status: "Running" | "Trailing";
}
interface HistoryRow {
  id: string; time: string; symbol: string; side: "BUY" | "SELL"; sector: string;
  entry: number; exit: number; qty: number; invested: number;
  pnl: number; pnlPct: number; status: "Profit" | "Loss" | "Open" | "Closed";
  reason: string;
}

import { 
  fetchIntradayState, 
  fetchIntradaySignals, 
  toggleIntradayEngine, 
  resetIntradayDay 
} from "@/services/api";

const SIGNAL_TONE: Record<LiveStatus, SignalTone> = {
  Scanning: "muted", Weak: "orange", "Low Momentum": "orange",
  Waiting: "yellow", "Waiting for Retest": "blue", "Breakout Ready": "green",
  "Strong Momentum": "green", "Entry Triggered": "green", "Trade Active": "green",
  Cooldown: "muted",
};

const TONE_CLASSES: Record<SignalTone, { dot: string; chip: string; ring: string; bar: string }> = {
  green: { dot: "bg-success", chip: "bg-success/10 text-success border-success/30", ring: "shadow-[0_0_0_4px_hsl(var(--success)/0.15)]", bar: "bg-success" },
  yellow:{ dot: "bg-warning", chip: "bg-warning/10 text-warning border-warning/30", ring: "shadow-[0_0_0_4px_hsl(var(--warning)/0.18)]", bar: "bg-warning" },
  orange:{ dot: "bg-warning", chip: "bg-warning/15 text-warning border-warning/40", ring: "shadow-[0_0_0_4px_hsl(var(--warning)/0.18)]", bar: "bg-warning" },
  blue:  { dot: "bg-accent",  chip: "bg-accent/10 text-accent border-accent/30",   ring: "shadow-[0_0_0_4px_hsl(var(--accent)/0.18)]",  bar: "bg-accent" },
  green: { dot: "bg-success", chip: "bg-success/10 text-success border-success/30", ring: "shadow-[0_0_0_4px_hsl(var(--success)/0.15)]", bar: "bg-success" },
  red:   { dot: "bg-danger",  chip: "bg-danger/10 text-danger border-danger/30",   ring: "shadow-[0_0_0_4px_hsl(var(--danger)/0.18)]",  bar: "bg-danger" },
  muted: { dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground border-border", ring: "", bar: "bg-muted-foreground" },
};

const LIVE_STATUSES: LiveStatus[] = [
  "Scanning", "Weak", "Low Momentum", "Waiting", "Waiting for Retest",
  "Breakout Ready", "Strong Momentum", "Entry Triggered", "Trade Active", "Cooldown",
];

const PNL_TREND = [
  { t: "09:30", v: 0 }, { t: "10:00", v: 260 }, { t: "10:30", v: 134 }, { t: "11:00", v: 389 },
  { t: "11:30", v: 310 }, { t: "12:00", v: 460 }, { t: "12:30", v: 595 }, { t: "13:00", v: 483 },
  { t: "13:30", v: 672 }, { t: "14:00", v: 815 }, { t: "14:30", v: 760 }, { t: "15:00", v: 970 },
];
const SECTOR_PERF = [
  { sector: "Banking", v: 1.2 }, { sector: "IT", v: 0.6 }, { sector: "Auto", v: 0.9 },
  { sector: "Energy", v: -0.3 }, { sector: "FMCG", v: 0.4 }, { sector: "NBFC", v: 0.7 },
];

const fmtINR = (n: number) =>
  `${n < 0 ? "−" : ""}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function IntradayTrading() {
  const navigate = useNavigate();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("intraday-disclaimer-accepted") === "1"
      || window.localStorage.getItem("intraday-disclaimer-accepted") === "1";
  });

  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(200000);
  const [stockCount, setStockCount] = useState(5);
  const [risk, setRisk] = useState<RiskMode>("Balanced");
  const [running, setRunning] = useState(false);
  
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [active, setActive] = useState<ActiveTrade[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [dayPnl, setDayPnl] = useState(0);

  const [activeTab, setActiveTab] = useState("live");
  const [reportDays, setReportDays] = useState("30");
  const [reportPage, setReportPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 8;

  const liveSignals = [
    { title: "Nifty Outlook", status: "Strong Momentum" as LiveStatus, confidence: 78, description: "Strong support at 22100, momentum building." },
    { title: "Sector Focus", status: "Scanning" as LiveStatus, confidence: 65, description: "Banking showing strength, IT remains sideways." },
  ];

  const budgetUsed = useMemo(() => active.reduce((s, t) => s + t.entry * t.qty, 0), [active]);
  const available = Math.max(0, budget - budgetUsed);


  const [resultFilter, setResultFilter] = useState<"ALL" | "PROFIT" | "LOSS">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");

  const sectors = useMemo(() => {
    const s = new Set(history.map(h => h.sector));
    return Array.from(s);
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchResult = resultFilter === "ALL" || (resultFilter === "PROFIT" ? h.pnl > 0 : h.pnl <= 0);
      const matchStatus = statusFilter === "ALL" || (statusFilter === "OPEN" ? h.status === "Open" : h.status !== "Open");
      const matchSector = sectorFilter === "ALL" || h.sector === sectorFilter;
      return matchResult && matchStatus && matchSector;
    });
  }, [history, resultFilter, statusFilter, sectorFilter]);

  const loadState = async () => {
    try {
      const state = await fetchIntradayState();
      setRunning(state.running);
      setBudget(state.budget);
      setStockCount(state.stock_count);
      setRisk(state.risk_mode);
      setActive(state.active_trades);
      setHistory(state.history);
      setDayPnl(state.day_pnl);
    } catch (e) {
      console.error("Failed to load engine state", e);
    }
  };

  const loadSignals = async () => {
    try {
      const data = await fetchIntradaySignals();
      setOpps(data);
    } catch (e) {
      console.error("Failed to load signals", e);
    }
  };

  useEffect(() => {
    if (disclaimerAccepted) {
      loadState();
      loadSignals();
      const interval = setInterval(() => {
        loadState();
        loadSignals();
      }, 5000); // Poll every 5s for live updates
      return () => clearInterval(interval);
    }
  }, [disclaimerAccepted]);

  const handleToggle = async () => {
    try {
      const newState = await toggleIntradayEngine({
        running: !running,
        budget,
        stock_count: stockCount,
        risk_mode: risk
      });
      setRunning(newState.running);
      setActive(newState.active_trades);
    } catch (e) {
      console.error("Toggle failed", e);
    }
  };

  const handleReset = async () => {
    try {
      await resetIntradayDay();
      loadState();
    } catch (e) {
      console.error("Reset failed", e);
    }
  };

  useEffect(() => {
    if (!disclaimerAccepted) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [disclaimerAccepted]);

  const acceptDisclaimer = () => {
    try {
      window.sessionStorage.setItem("intraday-disclaimer-accepted", "1");
      window.localStorage.setItem("intraday-disclaimer-accepted", "1");
    } catch { /* ignore */ }
    setDisclaimerAccepted(true);
  };

  const equityCurve = useMemo(() => {
    let cumulative = 0;
    return history.map((h, i) => {
      cumulative += h.pnl;
      return { date: h.time, value: cumulative };
    });
  }, [history]);

  const stats = useMemo(() => {
    const totalTrades = history.length;
    const winsCount = history.filter(h => h.pnl > 0).length;
    const lossesCount = totalTrades - winsCount;
    const totalPnl = history.reduce((s, h) => s + h.pnl, 0);
    const avgGain = winsCount > 0 ? history.filter(h => h.pnl > 0).reduce((s, h) => s + h.pnl, 0) / winsCount : 0;
    const avgLoss = lossesCount > 0 ? history.filter(h => h.pnl <= 0).reduce((s, h) => s + h.pnl, 0) / lossesCount : 0;
    
    return {
      totalTrades,
      winsCount,
      lossesCount,
      winRate: totalTrades > 0 ? Math.round((winsCount / totalTrades) * 100) : 0,
      totalPnl,
      avgGain,
      avgLoss,
      profitFactor: lossesCount > 0 ? Math.abs(history.filter(h => h.pnl > 0).reduce((s, h) => s + h.pnl, 0) / history.filter(h => h.pnl <= 0).reduce((s, h) => s + h.pnl, 0)) : winsCount > 0 ? winsCount : 0
    };
  }, [history]);

  const WIN_LOSS = useMemo(() => [
    { name: "Wins", v: stats.winsCount },
    { name: "Losses", v: stats.lossesCount },
  ], [stats]);
  const PIE_COLORS = ["hsl(var(--success))", "hsl(var(--danger))"];

  const exportData = () => {
    const data = activeTab === "live" ? active : history;
    const headers = ["Time", "Symbol", "Side", "Entry", "Exit/Current", "Qty", "P&L", "P&L%", "Status", "Reason"];
    const csvContent = [
      headers.join(","),
      ...data.map(t => [
        "time" in t ? t.time : "Live",
        t.symbol,
        t.side,
        t.entry,
        "exit" in t ? t.exit : t.current,
        t.qty,
        t.pnl,
        t.pnlPct,
        t.status,
        "reason" in t ? t.reason : ""
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Intraday_Trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const cancelDisclaimer = () => {
    navigate("/");
  };

  return (
    <>
    <div className={cn("space-y-6", !disclaimerAccepted && "pointer-events-none select-none blur-sm")}
         aria-hidden={!disclaimerAccepted}>
      <PageHeader
        title="Intraday Stock Trading"
        description="Automated paper-trading engine for high-conviction intraday stocks — set your budget & let the engine work."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day's P&L</span>
               <span className={cn("text-sm font-black font-mono", dayPnl >= 0 ? "text-success" : "text-danger")}>
                 {fmtINR(dayPnl)}
               </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                running ? "border-success/30 text-success bg-success/5" : "border-muted-foreground/30 text-muted-foreground",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-success animate-pulse" : "bg-muted-foreground")} />
              {running ? "Engine Running" : "Engine Idle"}
            </Badge>
            <Button
              variant={running ? "destructive" : "default"}
              size="sm"
              onClick={handleToggle}
            >
              {running ? (<><Pause className="h-4 w-4 mr-1.5" />Stop Engine</>) : (<><Play className="h-4 w-4 mr-1.5" />Start Engine</>)}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
            <TabsList className="bg-card border shadow-sm">
                <TabsTrigger value="live" className="gap-2">
                    <Activity className="h-3.5 w-3.5" /> Live Terminal
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                    <HistoryIcon className="h-3.5 w-3.5" /> Performance Reports
                </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportData} className="gap-2 h-9">
                    <LineChartIcon className="h-3.5 w-3.5" /> Export Data
                </Button>
            </div>
        </div>

        <TabsContent value="live" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiTile label="Day P&L"        value={fmtINR(dayPnl)}     tone={dayPnl >= 0 ? "success" : "danger"} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiTile label="Active Trades"  value={String(active.length)} icon={<Activity className="h-4 w-4" />} />
        <KpiTile label="Budget Used"    value={fmtINR(budgetUsed)} icon={<Wallet className="h-4 w-4" />} />
        <KpiTile label="Available Cash" value={fmtINR(available)}  icon={<Briefcase className="h-4 w-4" />} />
        <KpiTile label="Win Rate"       value={`${stats.winRate}%`}      tone={stats.winRate >= 50 ? "success" : "danger"} icon={<Target className="h-4 w-4" />} />
        <KpiTile label="Trades Today"   value={String(history.length + active.length)} icon={<HistoryIcon className="h-4 w-4" />} />
      </div>

      {/* Control + Live Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
              <h3 className="font-semibold">Ignite Engine</h3>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
              {risk} mode
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <Label className="text-xs text-muted-foreground">Budget (₹)</Label>
              <Input
                type="number"
                className="mt-2 font-mono"
                value={budget}
                disabled={running}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Capital deployed across stocks</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Number of Stocks ({stockCount})</Label>
              <Slider
                className="mt-3"
                min={1} max={10} step={1}
                value={[stockCount]}
                disabled={running}
                onValueChange={([v]) => setStockCount(v)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Concurrent intraday positions</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Risk Mode</Label>
              <Select value={risk} onValueChange={(v) => setRisk(v as RiskMode)} disabled={running}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Confidence threshold + cap rules</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant={running ? "destructive" : "default"} onClick={() => setRunning((v) => !v)}>
              {running ? <><Pause className="h-3.5 w-3.5 mr-1.5" /> Stop Engine</> : <><Play className="h-3.5 w-3.5 mr-1.5" /> Start Engine</>}
            </Button>
            <Button size="sm" variant="outline" disabled={!running} onClick={loadSignals}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> Force Rescan
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Day
            </Button>
            <span className="ml-auto text-[11px] text-muted-foreground self-center">
              Status: <span className="font-semibold text-foreground">{status}</span>
            </span>
          </div>
        </Card>

        <Card className="p-5 premium-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Day Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <SummaryRow label="Running P&L" value={fmtINR(active.reduce((s, t) => s + t.pnl, 0))} tone="success" mono />
            <SummaryRow label="Closed P&L"  value={fmtINR(history.reduce((s, h) => s + h.pnl, 0))} tone={history.reduce((s,h) => s + h.pnl, 0) >= 0 ? "success" : "danger"} mono />
            <SummaryRow label="Trades"      value={String(history.length)} mono />
            <SummaryRow label="Wins"        value={String(stats.winsCount)} tone="success" mono />
            <SummaryRow label="Losses"      value={String(stats.lossesCount)} tone="danger" mono />
            <SummaryRow label="Win Rate"    value={`${stats.winRate}%`} mono />
          </div>
        </Card>
      </div>

      {/* Live signals row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveSignals.map((s) => (
          <LiveSignalCard key={s.title} {...s} />
        ))}
      </div>

      {/* Stock Opportunities */}
      <Card className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Stock Opportunities</h3>
            <Badge variant="outline" className="text-[10px]">{opps.length} picks</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">High-probability intraday setups</span>
        </div>
        {opps.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-6 w-6" />} title="No signals found" hint="Adjust your risk mode or wait for the next scan." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {opps.map((o) => {
              const up = o.changePct >= 0;
              return (
                <div key={o.symbol} className="rounded-lg border bg-card/60 p-4 hover:border-accent/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-tight">{o.symbol}</span>
                        <Badge variant="outline" className="text-[10px]">{o.sector}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{o.company}</p>
                    </div>
                    <ScorePill score={o.confidence} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Stat label="Entry"   value={`₹${o.entry.toFixed(2)}`} />
                    <Stat label="Current" value={`₹${o.current.toFixed(2)}`} />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Change</div>
                      <ChangeBadge value={o.changePct} className="mt-0.5" />
                    </div>
                  </div>
                    <Badge className={cn(
                      "text-[10px] font-mono",
                      o.side === "BUY" ? "bg-success/15 text-success hover:bg-success/20" : "bg-danger/15 text-danger hover:bg-danger/20",
                    )}>
                      {o.side === "BUY" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {o.side} {o.signal}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      o.status === "Triggered" && "border-success/30 text-success",
                      o.status === "Ready"     && "border-warning/30 text-warning",
                    )}>
                      {o.status}
                    </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Active Trades */}
      <Card className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-success" />
            <h3 className="font-semibold">Active Trades</h3>
            <Badge variant="outline" className="text-[10px]">{active.length} running</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Live P&L updates</span>
        </div>
        {active.length === 0 ? (
          <EmptyState icon={<Radio className="h-6 w-6" />} title="No active trades" hint={running ? "Engine is scanning — trades will appear here." : "Start the engine to begin paper trading."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Live P&L</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((t) => (
                  <TableRow key={t.id} className="bg-accent/5">
                    <TableCell className="font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                        </span>
                        {t.symbol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-bold", t.side === "BUY" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                        {t.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{t.entry.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{t.qty}</TableCell>
                    <TableCell className="text-right font-mono">{t.current.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className={cn("font-mono font-bold", t.pnl >= 0 ? "text-success" : "text-danger")}>
                        {fmtINR(t.pnl)}
                      </div>
                      <ChangeBadge value={t.pnlPct} className="mt-0.5" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-danger">{t.sl.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-success">{t.target.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">{t.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 premium-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-accent" />
              <h3 className="font-semibold">Day P&L Trend</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">Intraday</Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PNL_TREND}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area type="monotone" dataKey="v" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 premium-card">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Capital Usage</h3>
          </div>
          <div className="text-3xl font-bold font-mono">{fmtINR(budgetUsed)}</div>
          <p className="text-[11px] text-muted-foreground">of {fmtINR(budget)} deployed</p>
          <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${budget ? Math.min(100, (budgetUsed / budget) * 100) : 0}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Available" value={fmtINR(available)} />
            <Stat label="Slots" value={`${active.length} / ${stockCount}`} />
          </div>
        </Card>

        <Card className="p-5 premium-card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h3 className="font-semibold">Win vs Loss</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={WIN_LOSS} dataKey="v" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {WIN_LOSS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Wins</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Losses</div>
          </div>
        </Card>

        <Card className="p-5 premium-card lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Sector Performance</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SECTOR_PERF}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="sector" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {SECTOR_PERF.map((s, i) => (
                    <Cell key={i} fill={s.v >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Explanations */}
      <Card className="p-5 premium-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-semibold">AI Explanations</h3>
          <Badge variant="outline" className="text-[10px]">Why these stocks</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { sym: "RELIANCE",  reason: "Breakout above intraday resistance with 2x average volume." },
            { sym: "ADANIENT",  reason: "Strong relative strength vs Nifty — momentum continuation setup." },
            { sym: "TATAMOTORS",reason: "Pullback to rising EMA holding firm — buyers stepping in." },
            { sym: "HDFCBANK",  reason: "Reversal from intraday support zone with bullish engulfing candle." },
          ].map((x) => (
            <div key={x.sym} className="flex items-start gap-3 rounded-lg border bg-card/60 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{x.sym}</div>
                <p className="text-[12px] text-muted-foreground leading-snug">{x.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 premium-card">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={resultFilter} onValueChange={(v) => setResultFilter(v as typeof resultFilter)}>
            <TabsList>
              <TabsTrigger value="ALL">All P&L</TabsTrigger>
              <TabsTrigger value="PROFIT">Profit</TabsTrigger>
              <TabsTrigger value="LOSS">Loss</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="ALL">Any status</TabsTrigger>
              <TabsTrigger value="OPEN">Open</TabsTrigger>
              <TabsTrigger value="CLOSED">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sectors</SelectItem>
              {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredHistory.length} of {history.length} executions
          </span>
        </div>
      </Card>

      {/* History */}
      <Card className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Execution History</h3>
          </div>
        </div>
        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="h-6 w-6" />}
            title={running ? "No executions match filters" : "No history available"}
            hint={running ? "Try resetting your filters." : "Start the engine to see today's executions."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs">{h.time}</TableCell>
                    <TableCell className="font-semibold">{h.symbol}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{h.sector}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{h.entry.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{h.exit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{h.qty}</TableCell>
                    <TableCell className="text-right font-mono">{fmtINR(h.invested)}</TableCell>
                    <TableCell className="text-right">
                      <div className={cn("font-mono font-bold", h.pnl >= 0 ? "text-success" : "text-danger")}>
                        {fmtINR(h.pnl)}
                      </div>
                      <ChangeBadge value={h.pnlPct} className="mt-0.5" />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[11px]",
                        h.status === "Profit" && "bg-success/15 text-success hover:bg-success/20",
                        h.status === "Loss"   && "bg-danger/15 text-danger hover:bg-danger/20",
                        h.status === "Open"   && "bg-accent/15 text-accent hover:bg-accent/20",
                      )}>
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={h.reason}>
                      {h.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* All live status legend (educational) */}
      <Card className="p-4 premium-card">
        <div className="flex items-center gap-2 mb-3">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Signal Legend</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {LIVE_STATUSES.map((s) => {
            const tone = TONE_CLASSES[SIGNAL_TONE[s]];
            return (
              <span key={s} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone.chip)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                {s}
              </span>
            );
          })}
        </div>
      </Card>
      </TabsContent>

      <TabsContent value="reports" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 premium-card">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total P&L</p>
                    <p className={cn("text-2xl font-black mt-1", stats.totalPnl >= 0 ? "text-success" : "text-danger")}>
                        {fmtINR(stats.totalPnl)}
                    </p>
                </Card>
                <Card className="p-4 premium-card">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Win Rate</p>
                    <p className="text-2xl font-black mt-1 text-accent">{stats.winRate}%</p>
                </Card>
                <Card className="p-4 premium-card">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Trades</p>
                    <p className="text-2xl font-black mt-1">{stats.totalTrades}</p>
                </Card>
                <Card className="p-4 premium-card">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Profit Factor</p>
                    <p className="text-2xl font-black mt-1">{stats.profitFactor.toFixed(2)}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 premium-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-accent" /> Equity Curve
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityCurve}>
                                <defs>
                                    <linearGradient id="pnlGradRep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#pnlGradRep)" />
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
                                        { name: 'Wins', value: stats.winsCount },
                                        { name: 'Losses', value: stats.lossesCount },
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
                    </div>
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span>Profitable Trades</span>
                            <span className="font-bold">{stats.winsCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>Losing Trades</span>
                            <span className="font-bold">{stats.lossesCount}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="premium-card overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-bold flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4 text-accent" /> Detailed Performance Log
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Side</TableHead>
                                <TableHead className="text-right">Entry</TableHead>
                                <TableHead className="text-right">Exit</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reason</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.slice((reportPage - 1) * 10, reportPage * 10).map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell className="font-mono text-xs">{h.time}</TableCell>
                                    <TableCell className="font-semibold">{h.symbol}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-[10px]", h.side === "BUY" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                                            {h.side}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{h.entry.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">{h.exit.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className={cn("font-mono font-bold", h.pnl >= 0 ? "text-success" : "text-danger")}>
                                            {fmtINR(h.pnl)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{h.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{h.reason}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {history.length > 10 && (
                    <div className="p-4 border-t flex justify-center gap-2">
                        <Button size="sm" variant="outline" disabled={reportPage === 1} onClick={() => setReportPage(p => p - 1)}>Prev</Button>
                        <Button size="sm" variant="outline" disabled={reportPage * 10 >= history.length} onClick={() => setReportPage(p => p + 1)}>Next</Button>
                    </div>
                )}
            </Card>
        </TabsContent>
      </Tabs>
    </div>
    {!disclaimerAccepted && (
      <DisclaimerGate onAccept={acceptDisclaimer} onCancel={cancelDisclaimer} />
    )}
    </>
  );
}

/* ---------- Subcomponents ---------- */

function KpiTile({
  label, value, icon, tone,
}: { label: string; value: string; icon?: React.ReactNode; tone?: "success" | "danger" }) {
  return (
    <Card className="kpi-card">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn(
        "text-2xl font-bold font-mono mt-1",
        tone === "success" && "text-success",
        tone === "danger"  && "text-danger",
      )}>
        {value}
      </p>
    </Card>
  );
}

function SummaryRow({ label, value, tone, mono }: { label: string; value: string; tone?: "success" | "danger"; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(mono && "font-mono", tone === "success" && "text-success font-semibold", tone === "danger" && "text-danger font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function LiveSignalCard({
  title, status, confidence, description,
}: { title: string; status: LiveStatus; confidence: number; description: string }) {
  const tone = TONE_CLASSES[SIGNAL_TONE[status]];
  return (
    <Card className="p-4 premium-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">Intraday</Badge>
      </div>
      <div className={cn("flex items-center gap-3 rounded-lg border p-3 transition", tone.chip, tone.ring)}>
        <span className="relative flex h-3 w-3 shrink-0">
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping", tone.dot)} />
          <span className={cn("relative inline-flex rounded-full h-3 w-3", tone.dot)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold leading-none">{status}</div>
          <p className="text-[11px] text-foreground/75 mt-1 leading-snug">{description}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          <span>Confidence</span>
          <span className="font-mono text-foreground font-semibold">{confidence}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full transition-all duration-500", tone.bar)} style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">{hint}</p>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        Tip: configure your engine above and press Start.
      </div>
    </div>
  );
}

function DisclaimerGate({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-fade-in">
      <Card className="relative w-full max-w-lg p-6 sm:p-8 premium-card shadow-2xl border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning ring-1 ring-warning/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Disclaimer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please read carefully before continuing
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            This module is for <span className="text-foreground font-medium">educational, analytical, and paper trading purposes</span> only.
            It does not guarantee profits or financial returns.
          </p>
          <p>
            Trading and investing involve <span className="text-foreground font-medium">market risk</span>. Decisions taken based on signals, analytics,
            or system outputs are the sole responsibility of the user.
          </p>
          <p>Past performance does not guarantee future results.</p>
          <p>
            Please trade responsibly and consult a qualified financial advisor if required.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onCancel} className="sm:min-w-[110px]">
            Cancel
          </Button>
          <Button onClick={onAccept} className="sm:min-w-[140px] gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            OK, I Accept
          </Button>
        </div>
      </Card>
    </div>
  );
}