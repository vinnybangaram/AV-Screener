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
import { Play, History, TrendingUp, ShieldAlert, Award, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const strategies = [
  { id: "multibagger", name: "Multibagger Compounder", desc: "Quality + momentum on large caps" },
  { id: "penny", name: "Penny Storm Radar", desc: "Volatility-driven micro caps" },
  { id: "intraday", name: "Intraday VWAP Bounce", desc: "Mean-reversion intraday" },
  { id: "trend", name: "Trend Following 50/200", desc: "Classic SMA crossover" },
];

function generateEquity(seed: number, points = 60) {
  const data: { day: string; equity: number }[] = [];
  let v = 100000;
  for (let i = 0; i < points; i++) {
    v *= 1 + (Math.sin(i / 4 + seed) * 0.012 + (Math.random() - 0.45) * 0.018);
    data.push({ day: `D${i + 1}`, equity: +v.toFixed(0) });
  }
  return data;
}

const trades = [
  { date: "12 Apr", symbol: "RELIANCE", side: "LONG", entry: 2810.0, exit: 2918.4, pnl: 3.86, hold: "11d" },
  { date: "08 Apr", symbol: "INFY", side: "LONG", entry: 1815.5, exit: 1872.3, pnl: 3.13, hold: "8d" },
  { date: "05 Apr", symbol: "HDFCBANK", side: "LONG", entry: 1654.0, exit: 1620.5, pnl: -2.02, hold: "5d" },
  { date: "02 Apr", symbol: "TCS", side: "LONG", entry: 4080.0, exit: 4214.1, pnl: 3.29, hold: "14d" },
  { date: "28 Mar", symbol: "ITC", side: "LONG", entry: 462.0, exit: 478.9, pnl: 3.66, hold: "9d" },
  { date: "22 Mar", symbol: "BHARTIARTL", side: "LONG", entry: 1610.0, exit: 1592.7, pnl: -1.07, hold: "6d" },
];

const Backtesting = () => {
  const [strategy, setStrategy] = useState("multibagger");
  const [capital, setCapital] = useState("100000");
  const [start, setStart] = useState("2024-01-01");
  const [end, setEnd] = useState("2025-04-15");
  const [risk, setRisk] = useState([2]);
  const [equity, setEquity] = useState(() => generateEquity(1));

  const stats = useMemo(() => {
    const startValue = equity[0]?.equity || 100000;
    const endValue = equity[equity.length - 1]?.equity || startValue;
    const cagr = ((endValue / startValue) ** (365 / 90) - 1) * 100;
    const maxDD = Math.min(...equity.map((p, i) => {
      const peak = Math.max(...equity.slice(0, i + 1).map((x) => x.equity));
      return ((p.equity - peak) / peak) * 100;
    }));
    const winRate = (trades.filter((t) => t.pnl > 0).length / trades.length) * 100;
    const sharpe = 1.42;
    return { cagr, maxDD, winRate, sharpe, finalEquity: endValue };
  }, [equity]);

  const run = () => {
    setEquity(generateEquity(Math.random() * 10));
    toast.success(`Backtest complete: ${strategies.find(s => s.id === strategy)?.name}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="Backtesting" description="Test strategies with historical data — CAGR, win rate, drawdown." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="CAGR" value={`${stats.cagr.toFixed(1)}%`} delta={`Final: ₹${(stats.finalEquity / 1000).toFixed(1)}K`} tone={stats.cagr >= 0 ? "success" : "danger"} trendUp={stats.cagr >= 0} icon={TrendingUp} />
        <KpiCard label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} delta={`${trades.length} trades`} tone="accent" icon={Award} />
        <KpiCard label="Max Drawdown" value={`${stats.maxDD.toFixed(1)}%`} delta="Peak-to-trough" tone="warning" icon={ShieldAlert} />
        <KpiCard label="Sharpe Ratio" value={stats.sharpe.toFixed(2)} delta="Risk-adjusted" tone="success" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-1 p-5 bg-gradient-card shadow-card h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">{strategies.find(s => s.id === strategy)?.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Initial Capital (₹)</Label>
              <Input value={capital} onChange={(e) => setCapital(e.target.value)} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Risk per Trade</Label>
                <span className="text-xs font-bold tabular-nums">{risk[0]}%</span>
              </div>
              <Slider value={risk} onValueChange={setRisk} min={0.5} max={5} step={0.5} className="mt-2" />
            </div>
            <Button onClick={run} className="w-full gap-1.5 bg-gradient-emerald text-white border-0 shadow-glow-emerald">
              <Play className="h-4 w-4" /> Run Backtest
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Equity Curve</h3>
              <p className="text-xs text-muted-foreground">{strategies.find(s => s.id === strategy)?.name}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] uppercase">Simulated</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="equity" stroke="hsl(var(--accent))" fill="url(#eq)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-accent" /> Trade Log
          </h3>
          <Badge variant="outline" className="text-[10px]">{trades.length} trades</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">Hold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="font-bold">{t.symbol}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{t.side}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">₹{t.entry.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">₹{t.exit.toFixed(2)}</TableCell>
                  <TableCell className="text-right"><ChangeBadge value={t.pnl} /></TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{t.hold}</TableCell>
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
