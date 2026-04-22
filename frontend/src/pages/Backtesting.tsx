import { useMemo, useState } from "react";
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
import { Play, History, TrendingUp, ShieldAlert, Award, Activity, Loader2, Search } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { runBacktest } from "@/services/api";
import { cn } from "@/lib/utils";

const strategies = [
  { id: "multibagger", name: "Multibagger Compounder", desc: "Breakout momentum with RSI confirmation" },
  { id: "trend", name: "Trend Following 50/200", desc: "Classic SMA 50/200 Golden/Death cross" },
];

const Backtesting = () => {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState("multibagger");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [capital, setCapital] = useState("100000");
  const [start, setStart] = useState("2023-01-01");
  const [end, setEnd] = useState("2024-04-15");
  const [risk, setRisk] = useState([2]);
  
  // Results State
  const [results, setResults] = useState<any>(null);

  const stats = results?.stats || { cagr: 0, max_dd: 0, win_rate: 0, sharpe: 0, final_equity: 100000 };
  const equity = results?.equity_curve || [];
  const trades = results?.trades || [];

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runBacktest({
        strategy_id: strategy,
        symbol,
        start_date: start,
        end_date: end,
        initial_capital: parseFloat(capital),
        risk_pct: risk[0]
      });
      setResults(res);
      toast.success(`Simulation successful for ${symbol}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Backtest failed. Check your parameters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="Backtesting" description="Test strategies with historical data — CAGR, win rate, drawdown." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="CAGR" value={`${stats.cagr}%`} delta={`Final: ₹${(stats.final_equity / 1000).toFixed(1)}K`} tone={stats.cagr >= 0 ? "success" : "danger"} trendUp={stats.cagr >= 0} icon={TrendingUp} />
        <KpiCard label="Win Rate" value={`${stats.win_rate}%`} delta={`${trades.length} trades`} tone="accent" icon={Award} />
        <KpiCard label="Max Drawdown" value={`${stats.max_dd}%`} delta="Peak-to-trough" tone="warning" icon={ShieldAlert} />
        <KpiCard label="Sharpe Ratio" value={stats.sharpe.toFixed(2)} delta="Risk-adjusted" tone="success" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-1 p-5 bg-gradient-card shadow-card h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs italic">Alpha Model</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">{strategies.find(s => s.id === strategy)?.desc}</p>
            </div>
            <div>
              <Label className="text-xs">Asset Symbol</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                   value={symbol} 
                   onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
                   placeholder="e.g. RELIANCE" 
                   className="pl-8" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Initial Capital (₹)</Label>
              <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Risk per Trade</Label>
                <span className="text-xs font-bold tabular-nums">{risk[0]}%</span>
              </div>
              <Slider value={risk} onValueChange={setRisk} min={0.5} max={5} step={0.5} className="mt-2" />
            </div>
            <Button 
                onClick={handleRun} 
                disabled={loading}
                className="w-full gap-1.5 bg-gradient-emerald text-white border-0 shadow-glow-emerald"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Simulating..." : "Run AI Backtest"}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Equity Multiplier Curve</h3>
              <p className="text-xs text-muted-foreground">{symbol} · {strategies.find(s => s.id === strategy)?.name}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5">
              Historical OHLCV
            </Badge>
          </div>
          <div className="h-72">
            {!results ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Activity className="h-10 w-10 opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-semibold">Select parameters to generate curve</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equity}>
                    <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" hide />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="equity" stroke="hsl(var(--accent))" fill="url(#eq)" strokeWidth={2.5} animationDuration={1500} />
                </AreaChart>
                </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-accent" /> Simulation Trade Log
          </h3>
          <Badge variant="outline" className="text-[10px] tabular-nums">{trades.length} entries recorded</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Date</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Asset</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Leg</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Entry Price</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Exit Price</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Return (%)</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground italic">
                          Start backtest to see granular execution logs
                      </TableCell>
                  </TableRow>
              ) : trades.map((t: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{t.date}</TableCell>
                  <TableCell className="font-bold">{symbol}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-bold py-0">{t.side}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">₹{t.entry.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">₹{t.exit.toFixed(2)}</TableCell>
                  <TableCell className="text-right"><ChangeBadge value={t.pnl} /></TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-mono">{t.hold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Backtesting;
