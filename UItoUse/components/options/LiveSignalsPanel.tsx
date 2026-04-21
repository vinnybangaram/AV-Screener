import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Gauge, Radio, ShieldAlert, Sparkles, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiveSignalState, LiveSignalTone } from "@/lib/options/liveSignalEngine";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<LiveSignalTone, { dot: string; chip: string; ring: string; bar: string }> = {
  green:  { dot: "bg-success",          chip: "bg-success/10 text-success border-success/30", ring: "shadow-[0_0_0_4px_hsl(var(--success)/0.15)]", bar: "bg-success" },
  yellow: { dot: "bg-warning",          chip: "bg-warning/10 text-warning border-warning/30", ring: "shadow-[0_0_0_4px_hsl(var(--warning)/0.18)]", bar: "bg-warning" },
  orange: { dot: "bg-warning",          chip: "bg-warning/15 text-warning border-warning/40", ring: "shadow-[0_0_0_4px_hsl(var(--warning)/0.18)]", bar: "bg-warning" },
  blue:   { dot: "bg-accent",           chip: "bg-accent/10 text-accent border-accent/30",    ring: "shadow-[0_0_0_4px_hsl(var(--accent)/0.18)]",  bar: "bg-accent" },
  red:    { dot: "bg-danger",           chip: "bg-danger/10 text-danger border-danger/30",    ring: "shadow-[0_0_0_4px_hsl(var(--danger)/0.18)]",  bar: "bg-danger" },
  muted:  { dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground border-border", ring: "",                                            bar: "bg-muted-foreground" },
};

function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

function TrendIcon({ trend }: { trend: LiveSignalState["trend"] }) {
  if (trend === "Up") return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (trend === "Down") return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <ArrowRight className="h-3.5 w-3.5" />;
}

function MetricCell({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border bg-card/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="text-sm font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}

export function LiveSignalsPanel({ state }: { state: LiveSignalState }) {
  const tone = TONE_CLASSES[state.tone];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const momentumPct = Math.round(((state.momentum + 100) / 200) * 100);
  const trendTone =
    state.trend === "Up" ? "text-success"
    : state.trend === "Down" ? "text-danger"
    : "text-muted-foreground";
  const riskTone =
    state.risk === "Low" ? "text-success"
    : state.risk === "Medium" ? "text-warning"
    : "text-danger";
  const dirTone =
    state.direction === "CALL" ? "text-success"
    : state.direction === "PUT" ? "text-danger"
    : "text-muted-foreground";

  return (
    <Card className="p-4 premium-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-sm">Live Signals</h4>
          <Badge variant="outline" className="text-[10px] font-mono">{state.symbol}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">Updated {timeAgo(state.lastChangedAt, now)}</span>
      </div>

      <div className={cn("flex items-center gap-3 rounded-lg border p-3 transition", tone.chip, tone.ring)}>
        <span className="relative flex h-3 w-3 shrink-0">
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping", tone.dot)} />
          <span className={cn("relative inline-flex rounded-full h-3 w-3", tone.dot)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold leading-none">{state.status}</span>
            {state.direction && (
              <Badge variant="outline" className={cn("text-[10px] font-mono border-current", dirTone)}>
                {state.direction}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-foreground/75 mt-1 leading-snug">{state.description}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />Confidence</span>
          <span className="font-mono text-foreground font-semibold">{state.confidence}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full transition-all duration-500", tone.bar)} style={{ width: `${state.confidence}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <MetricCell
          label="Momentum"
          value={
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <span className={state.momentum >= 0 ? "text-success" : "text-danger"}>
                {state.momentum > 0 ? "+" : ""}{state.momentum}
              </span>
            </span>
          }
          hint={`${momentumPct}%`}
        />
        <MetricCell
          label="Trend"
          value={
            <span className={cn("flex items-center gap-1", trendTone)}>
              <TrendIcon trend={state.trend} />
              {state.trend}
            </span>
          }
        />
        <MetricCell
          label="Risk"
          value={
            <span className={cn("flex items-center gap-1", riskTone)}>
              <ShieldAlert className="h-3 w-3" />
              {state.risk}
            </span>
          }
        />
        <MetricCell
          label="Bias"
          value={
            <span className={cn("flex items-center gap-1", dirTone)}>
              <Target className="h-3 w-3" />
              {state.direction ?? "Flat"}
            </span>
          }
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Activity className="h-3 w-3" />
        Engine is reading price action, EMAs, RSI, volume & key levels in real time.
      </div>
    </Card>
  );
}
