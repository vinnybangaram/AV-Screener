import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChangeBadge } from "@/components/common/Badges";
import {
  confluenceAlignment, expectedPath, historicalSessions, priceSeries,
  priceTargets, probabilityForecast, tradeSetup,
} from "@/lib/mock-data";
import {
  AlertTriangle, Bookmark, Brain, Compass, History as HistoryIcon, Search,
  Share2, Shield, Target, Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";

const metrics = [
  { label: "P/E Ratio", value: "28.4" },
  { label: "ROE", value: "14.2%" },
  { label: "Debt / Equity", value: "0.42" },
  { label: "EPS Growth", value: "+18.4%" },
  { label: "Revenue CAGR", value: "12.6%" },
  { label: "RSI (14)", value: "62.4" },
  { label: "MACD", value: "Bullish" },
  { label: "Beta", value: "1.08" },
];

const StockAnalysis = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Stock Analysis"
        description="Deep research terminal with AI-augmented signals."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Bookmark className="h-3.5 w-3.5" /> Save</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left panel */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search symbol…" className="pl-9 bg-card" defaultValue="NTPC" />
          </div>

          <div className="premium-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">NSE</div>
                <h2 className="text-xl font-bold tracking-tight">NTPC</h2>
                <div className="text-xs text-muted-foreground mt-0.5">NTPC Limited</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tabular-nums">393.45</div>
                <ChangeBadge value={1.84} className="mt-1" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-muted-foreground">Buy / Sell Meter</span>
                  <span className="font-semibold text-success">Strong Buy</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-danger via-warning to-success" style={{ width: "100%" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded bg-foreground shadow-md" style={{ left: "78%" }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Sell</span><span>Neutral</span><span>Buy</span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Conviction Score</span>
                  <span className="font-mono text-2xl font-bold text-success tabular-nums">{confluenceAlignment.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-success" style={{ width: `${confluenceAlignment.score}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">High conviction. Trend, momentum, and fundamentals aligned.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-primary text-primary-foreground shadow-elevated p-5">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">AI Recommendation</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/90">
              Strong technical breakout supported by improving margins. Maintain position with stop at 371. Target zone 396–408.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Price Chart · 1Y</h3>
              <div className="flex gap-1 rounded-lg border bg-muted/30 p-0.5">
                {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((tf, i) => (
                  <button
                    key={tf}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      i === 4 ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceSeries}>
                  <defs>
                    <linearGradient id="chartG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(158 75% 38%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(158 75% 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="p" stroke="hsl(158 75% 38%)" strokeWidth={2} fill="url(#chartG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-card border h-10">
              {["overview", "technicals", "fundamentals", "valuation", "risk", "ai"].map((t) => (
                <TabsTrigger key={t} value={t} className="capitalize text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none">
                  {t === "ai" ? "AI Summary" : t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-lg border bg-card p-4 shadow-card">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{m.label}</div>
                    <div className="mt-1.5 font-mono text-lg font-bold tabular-nums">{m.value}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {["technicals", "fundamentals", "valuation", "risk", "ai"].map((t) => (
              <TabsContent key={t} value={t} className="mt-4">
                <div className="premium-card p-8 text-center text-sm text-muted-foreground">
                  Detailed {t} view — connect data to populate.
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* === QUANTITATIVE INTELLIGENCE === */}
      <SectionHeader icon={<Brain className="h-4 w-4 text-accent" />} label="Quantitative Intelligence" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProbabilityForecastCard />
        <ConfluenceAlignmentCard />
        <TradeSetupCard />
      </div>

      {/* === PRICE TARGETS & CONTEXT === */}
      <SectionHeader icon={<Target className="h-4 w-4 text-accent" />} label="Price Targets & Context" />
      <PriceTargetsCard />

      {/* === HISTORICAL SESSION DATA === */}
      <SectionHeader icon={<HistoryIcon className="h-4 w-4 text-accent" />} label="Historical Session Data" />
      <HistoricalSessionsCard />
    </div>
  );
};

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-5 w-1 rounded-full bg-gradient-emerald" />
      {icon}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/80">{label}</h2>
    </div>
  );
}

function ProbabilityForecastCard() {
  const { bullish, neutral, bearish, confidence, reasoning } = probabilityForecast;
  const [tf, setTf] = useState("30D");
  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Probability Forecast</h3>
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-0.5">
          {["7D", "30D", "90D"].map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                "px-2.5 py-1 text-[11px] rounded-md font-bold transition-colors",
                tf === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >{t}</button>
          ))}
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-bold mb-4">
        Confidence: <span className="text-success">{confidence}</span>
      </div>

      <div className="space-y-4">
        <ForecastBar label="BULLISH" range={bullish.range} prob={bullish.probability} color="bg-success" labelColor="text-success" />
        <ForecastBar label="NEUTRAL" range={neutral.range} prob={neutral.probability} color="bg-muted-foreground/60" labelColor="text-foreground" />
        <ForecastBar label="BEARISH" range={bearish.range} prob={bearish.probability} color="bg-danger" labelColor="text-danger" />
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Quant Reasoning</div>
        <ul className="space-y-1 text-xs text-foreground/80">
          {reasoning.map((r) => <li key={r} className="flex gap-2"><span className="text-accent">•</span>{r}</li>)}
        </ul>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground italic">Forecasts are probability estimates based on market data, not financial advice.</p>
    </div>
  );
}

function ForecastBar({ label, range, prob, color, labelColor }: { label: string; range: [number, number]; prob: number; color: string; labelColor: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", labelColor)}>
          {label} <span className="font-mono text-foreground/70 ml-1">{range[0].toFixed(2)} - {range[1].toFixed(2)}</span>
        </span>
        <span className="text-xs font-mono font-bold tabular-nums">{prob}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${prob}%` }} />
      </div>
    </div>
  );
}

function ConfluenceAlignmentCard() {
  const { score, verdict, drivers } = confluenceAlignment;
  return (
    <div className="premium-card p-5 flex flex-col">
      <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground text-center mb-4">Confluence Alignment</h3>

      {/* Gauge */}
      <div className="relative mx-auto w-48 h-28 mb-4">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(158 75% 38%)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251} 251`}
            style={{ filter: "drop-shadow(0 0 8px hsl(158 75% 38% / 0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="font-mono text-4xl font-bold tabular-nums">{score}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Score</div>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="inline-block rounded-md bg-success/15 text-success px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
          {verdict}
        </span>
      </div>

      <div className="rounded-lg border bg-success/5 border-success/20 p-3 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-success mb-2">
          <Zap className="h-3 w-3" /> Key Signal Drivers
        </div>
        <ul className="space-y-1.5 text-xs text-foreground/85">
          {drivers.map((d) => <li key={d} className="flex gap-2"><span className="text-success">•</span>{d}</li>)}
        </ul>
      </div>

      <div className="rounded-lg border bg-danger/5 border-danger/20 p-3 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-danger mb-1.5">
          <AlertTriangle className="h-3 w-3" /> Risk Overlays
        </div>
        <p className="text-xs text-muted-foreground italic">No major structural warnings.</p>
      </div>
    </div>
  );
}

function TradeSetupCard() {
  const { entryZone, stopLoss, target1, target2, riskReward, rationale, riskOverlay } = tradeSetup;
  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" />
          <h3 className="font-bold uppercase tracking-wider text-xs">Trade Setup</h3>
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold">PULLBACK</span>
          <span className="rounded-md bg-warning/15 text-warning px-2 py-0.5 text-[10px] font-bold">WATCHLIST</span>
          <span className="rounded-md bg-success/15 text-success px-2 py-0.5 text-[10px] font-bold">HIGH</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Entry Zone</div>
          <div className="font-mono text-sm font-bold tabular-nums text-accent mt-1">
            {entryZone[0].toFixed(2)} - {entryZone[1].toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Stop Loss</div>
          <div className="font-mono text-sm font-bold tabular-nums text-danger mt-1">₹{stopLoss}</div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Target 1</div>
          <div className="font-mono text-sm font-bold tabular-nums text-success mt-1">₹{target1}</div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Target 2</div>
          <div className="font-mono text-sm font-bold tabular-nums text-success mt-1">₹{target2}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">Risk/Reward</span>
          <span className="font-mono font-bold tabular-nums text-warning">{riskReward}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-gold" style={{ width: "10%" }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>Low Alpha</span><span>High Edge</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-warning mb-2">
          <Zap className="h-3 w-3" /> Trade Rationale
        </div>
        <ul className="space-y-1.5 text-xs text-foreground/85">
          {rationale.map((r) => <li key={r} className="flex gap-2"><span className="text-accent">•</span>{r}</li>)}
        </ul>
      </div>

      <div className="rounded-lg border-l-4 border-danger bg-danger/5 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-danger mb-0.5">
          <Shield className="h-3 w-3" /> Risk Overlay
        </div>
        <p className="text-xs text-foreground/80">{riskOverlay}</p>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground italic text-center">Trade setups are decision-support plans, not guaranteed outcomes.</p>
    </div>
  );
}

function PriceTargetsCard() {
  const [tf, setTf] = useState<"7d" | "30d" | "90d">("30d");
  const data = priceTargets[tf];

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Price Target Consensus</h3>
        <span className="rounded-md bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold">CONFIDENCE: HIGH</span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 p-1 mb-5">
        {(["7d", "30d", "90d"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={cn(
              "py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors",
              tf === t ? "bg-gradient-emerald text-white shadow-glow-emerald" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "7d" ? "7 DAYS" : t === "30d" ? "30 DAYS" : "90 DAYS"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <TargetRow label="BULLISH" range={data.bullish.range} probable={data.bullish.probable} color="text-success" bg="bg-success/5 border-success/20" />
        <TargetRow label="BASE CASE" range={data.base.range} probable={data.base.probable} color="text-accent" bg="bg-accent/5 border-accent/20" />
        <TargetRow label="BEARISH" range={data.bearish.range} probable={data.bearish.probable} color="text-danger" bg="bg-danger/5 border-danger/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <Shield className="h-3 w-3" /> Model Drivers
          </div>
          <ul className="text-xs space-y-1">
            <li className="flex gap-2"><span className="text-accent">•</span> Strong technical alignment</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Expected Price Path</div>
          <div className="grid grid-cols-4 gap-2">
            {expectedPath.map((p) => (
              <div key={p.label} className="text-center">
                <div className="mx-auto h-2 w-2 rounded-full bg-accent mb-1.5" />
                <div className="text-[11px] font-bold">{p.label}</div>
                <div className="font-mono text-[11px] tabular-nums text-accent">
                  {p.price ? `₹${p.price.toFixed(2)}` : "---"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground italic text-center">Targets are probabilistic scenarios based on market data, not guarantees.</p>
    </div>
  );
}

function TargetRow({ label, range, probable, color, bg }: { label: string; range: [number, number]; probable: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-lg border p-4 flex items-center justify-between", bg)}>
      <div>
        <div className={cn("text-[11px] font-bold uppercase tracking-wider", color)}>{label}</div>
        <div className="font-mono text-lg font-bold tabular-nums mt-0.5">₹{range[0].toFixed(2)}-{range[1].toFixed(2)}</div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Probable Target</div>
        <div className="font-mono text-lg font-bold tabular-nums">₹{probable.toFixed(2)}</div>
      </div>
    </div>
  );
}

function HistoricalSessionsCard() {
  return (
    <div className="premium-card overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="font-semibold text-foreground">Historical Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 trading sessions with system signals</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-accent">Export CSV →</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-semibold px-5 py-2.5">Date</th>
              <th className="text-right font-semibold py-2.5">Open</th>
              <th className="text-right font-semibold py-2.5">High</th>
              <th className="text-right font-semibold py-2.5">Low</th>
              <th className="text-right font-semibold py-2.5">Close</th>
              <th className="text-right font-semibold py-2.5">Change</th>
              <th className="text-right font-semibold py-2.5">Volume</th>
              <th className="text-center font-semibold pr-5 py-2.5">Signal</th>
            </tr>
          </thead>
          <tbody>
            {historicalSessions.map((s) => (
              <tr key={s.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs tabular-nums">{s.date}</td>
                <td className="py-3 text-right font-mono tabular-nums">{s.open.toFixed(2)}</td>
                <td className="py-3 text-right font-mono tabular-nums text-success">{s.high.toFixed(2)}</td>
                <td className="py-3 text-right font-mono tabular-nums text-danger">{s.low.toFixed(2)}</td>
                <td className="py-3 text-right font-mono font-semibold tabular-nums">{s.close.toFixed(2)}</td>
                <td className="py-3 text-right"><ChangeBadge value={s.change} /></td>
                <td className="py-3 text-right font-mono text-xs text-muted-foreground tabular-nums">{s.volume}</td>
                <td className="pr-5 py-3 text-center">
                  <span className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    s.signal === "Long" && "bg-success/15 text-success",
                    s.signal === "Short" && "bg-danger/15 text-danger",
                    s.signal === "Hold" && "bg-muted text-muted-foreground",
                    s.signal === "Exit" && "bg-warning/15 text-warning",
                  )}>{s.signal}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockAnalysis;
