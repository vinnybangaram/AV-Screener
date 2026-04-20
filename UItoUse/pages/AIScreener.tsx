import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { Slider } from "@/components/ui/slider";
import { screenerResults } from "@/lib/mock-data";
import { Plus, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const presets = [
  { label: "Value Picks", icon: "💎" },
  { label: "Momentum Breakouts", icon: "🚀" },
  { label: "Swing Trades", icon: "⚡" },
  { label: "Long-Term Compounders", icon: "🌱" },
  { label: "Low Risk Bets", icon: "🛡️" },
];

const Filter = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">{label}</label>
    {children}
  </div>
);

const AIScreener = () => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="AI Screener"
        description="Filter, rank and discover the best opportunities in seconds."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Preset</Button>
            <Button size="sm" className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0">
              <Sparkles className="h-3.5 w-3.5" /> Run Screen
            </Button>
          </>
        }
      />

      {/* Smart presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-card hover:border-accent hover:text-accent transition-[var(--transition-base)]"
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="premium-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          <Filter label="Market Cap">
            <select className="w-full h-9 rounded-md border bg-background px-2.5 text-sm">
              <option>All</option><option>Large Cap</option><option>Mid Cap</option><option>Small Cap</option>
            </select>
          </Filter>
          <Filter label="Sector">
            <select className="w-full h-9 rounded-md border bg-background px-2.5 text-sm">
              <option>All Sectors</option><option>Banking</option><option>IT</option><option>Pharma</option>
            </select>
          </Filter>
          <Filter label="P/E Range (0–80)">
            <Slider defaultValue={[12, 35]} max={80} step={1} />
          </Filter>
          <Filter label="ROE Min (%)">
            <Slider defaultValue={[15]} max={50} step={1} />
          </Filter>
          <Filter label="RSI Range">
            <Slider defaultValue={[40, 70]} max={100} step={1} />
          </Filter>
          <Filter label="Breakout Pattern">
            <select className="w-full h-9 rounded-md border bg-background px-2.5 text-sm">
              <option>Any</option><option>Cup & Handle</option><option>Flag</option><option>Triangle</option>
            </select>
          </Filter>
          <Filter label="Volume Surge">
            <select className="w-full h-9 rounded-md border bg-background px-2.5 text-sm">
              <option>Any</option><option>1.5x avg</option><option>2x avg</option><option>3x avg</option>
            </select>
          </Filter>
          <Filter label="AI Score Min">
            <Slider defaultValue={[75]} max={100} step={1} />
          </Filter>
          <Filter label="Risk Level">
            <select className="w-full h-9 rounded-md border bg-background px-2.5 text-sm">
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </Filter>
        </div>
      </div>

      {/* Results */}
      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">Results <span className="text-muted-foreground font-normal text-sm">· {screenerResults.length} matches</span></h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sorted by AI Score · descending</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-y text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left font-semibold px-5 py-2.5">Symbol</th>
                <th className="text-left font-semibold py-2.5">Sector</th>
                <th className="text-right font-semibold py-2.5">Price</th>
                <th className="text-center font-semibold py-2.5">AI Score</th>
                <th className="text-center font-semibold py-2.5">Momentum</th>
                <th className="text-center font-semibold py-2.5">Valuation</th>
                <th className="text-center font-semibold py-2.5">Risk</th>
                <th className="text-right font-semibold pr-5 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenerResults.map((r) => (
                <tr key={r.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-bold tracking-tight">{r.symbol}</td>
                  <td className="py-3 text-muted-foreground">{r.sector}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{r.price.toLocaleString()}</td>
                  <td className="py-3 text-center"><ScorePill score={r.score} /></td>
                  <td className="py-3 text-center">
                    <MiniBar value={r.momentum} />
                  </td>
                  <td className="py-3 text-center">
                    <MiniBar value={r.valuation} />
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      r.risk === "Low" && "bg-success/10 text-success",
                      r.risk === "Medium" && "bg-warning/10 text-warning",
                      r.risk === "High" && "bg-danger/10 text-danger",
                    )}>{r.risk}</span>
                  </td>
                  <td className="pr-5 py-3 text-right">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-accent hover:text-accent hover:bg-accent/10">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MiniBar = ({ value }: { value: number }) => (
  <div className="inline-flex items-center gap-2">
    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full", value >= 75 ? "bg-success" : value >= 60 ? "bg-accent" : "bg-warning")}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="font-mono text-xs tabular-nums w-6 text-right">{value}</span>
  </div>
);

export default AIScreener;
