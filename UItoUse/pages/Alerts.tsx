import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, Activity, TrendingUp, Sparkles, Calendar } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/dashboard/KpiCard";

type AlertType = "price" | "rsi" | "breakout" | "ai" | "earnings";

interface AlertRow {
  id: string;
  symbol: string;
  type: AlertType;
  condition: string;
  active: boolean;
  triggered: number;
  created: string;
}

const seed: AlertRow[] = [
  { id: "a1", symbol: "RELIANCE", type: "price", condition: "Price ≥ ₹3,000", active: true, triggered: 0, created: "12 Apr" },
  { id: "a2", symbol: "INFY", type: "rsi", condition: "RSI crosses 70", active: true, triggered: 2, created: "10 Apr" },
  { id: "a3", symbol: "HDFCBANK", type: "breakout", condition: "Breakout above 1,700 with volume > 2x", active: true, triggered: 1, created: "09 Apr" },
  { id: "a4", symbol: "TCS", type: "ai", condition: "AI score crosses 90", active: false, triggered: 0, created: "08 Apr" },
  { id: "a5", symbol: "BHARTIARTL", type: "earnings", condition: "Earnings within 7 days", active: true, triggered: 0, created: "07 Apr" },
];

const typeMeta: Record<AlertType, { label: string; icon: typeof Bell; tone: string }> = {
  price: { label: "Price", icon: TrendingUp, tone: "bg-accent/10 text-accent border-accent/30" },
  rsi: { label: "RSI", icon: Activity, tone: "bg-warning/10 text-warning border-warning/30" },
  breakout: { label: "Breakout", icon: TrendingUp, tone: "bg-success/10 text-success border-success/30" },
  ai: { label: "AI Score", icon: Sparkles, tone: "bg-primary/10 text-primary border-primary/30" },
  earnings: { label: "Earnings", icon: Calendar, tone: "bg-muted text-foreground" },
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<AlertRow[]>(seed);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<AlertType>("price");
  const [value, setValue] = useState("");

  const create = () => {
    if (!symbol || !value) {
      toast.error("Symbol and value are required");
      return;
    }
    const conditionMap: Record<AlertType, string> = {
      price: `Price ≥ ₹${value}`,
      rsi: `RSI crosses ${value}`,
      breakout: `Breakout above ${value}`,
      ai: `AI score crosses ${value}`,
      earnings: `Earnings within ${value} days`,
    };
    const row: AlertRow = {
      id: `a${Date.now()}`,
      symbol: symbol.toUpperCase(),
      type,
      condition: conditionMap[type],
      active: true,
      triggered: 0,
      created: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    };
    setAlerts([row, ...alerts]);
    setSymbol(""); setValue("");
    toast.success(`Alert created for ${row.symbol}`);
  };

  const toggle = (id: string) => setAlerts(alerts.map((a) => a.id === id ? { ...a, active: !a.active } : a));
  const remove = (id: string) => { setAlerts(alerts.filter((a) => a.id !== id)); toast.success("Alert removed"); };

  const active = alerts.filter((a) => a.active).length;
  const triggered = alerts.reduce((s, a) => s + a.triggered, 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="Alerts" description="Create price, RSI, breakout and AI-score alerts." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Alerts" value={String(active)} delta={`${alerts.length} total`} tone="accent" icon={Bell} />
        <KpiCard label="Triggered (7D)" value={String(triggered)} delta="+1 today" tone="success" trendUp icon={Activity} />
        <KpiCard label="Avg Latency" value="1.2s" delta="Real-time engine" tone="warning" icon={Sparkles} />
        <KpiCard label="Symbols" value={String(new Set(alerts.map(a => a.symbol)).size)} delta="Unique" tone="success" icon={TrendingUp} />
      </div>

      <Card className="p-5 bg-gradient-card shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Create Alert</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <Label className="text-xs">Symbol</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. RELIANCE" className="mt-1" />
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AlertType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(typeMeta) as AlertType[]).map((k) => (
                  <SelectItem key={k} value={k}>{typeMeta[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Label className="text-xs">Threshold / Value</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 3000 or 70" className="mt-1" />
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button onClick={create} className="w-full gap-1.5 bg-gradient-emerald text-white border-0 shadow-glow-emerald">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-gradient-card shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Your Alerts</h3>
        <div className="space-y-2">
          {alerts.map((a) => {
            const meta = typeMeta[a.type];
            const Icon = meta.icon;
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-card transition">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-4 w-4 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{a.symbol}</span>
                    <Badge variant="outline" className={`text-[10px] ${meta.tone}`}>{meta.label}</Badge>
                    {a.triggered > 0 && <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">{a.triggered}× fired</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.condition} · created {a.created}</p>
                </div>
                <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} />
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
              </div>
            );
          })}
          {alerts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No alerts yet — create one above.</p>}
        </div>
      </Card>
    </div>
  );
};

export default Alerts;
