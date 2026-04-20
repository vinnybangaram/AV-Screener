import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { fetchScreenerResults, addToWatchlist } from "@/services/api";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    marketCap: "All",
    sector: "All Sectors",
    peRange: [0, 80],
    roeMin: [15],
    rsiRange: [40, 70],
    pattern: "Any",
    volumeSurge: "Any",
    aiScoreMin: [75],
    riskLevel: "All",
  });

  const handleRunScreen = async () => {
    setLoading(true);
    try {
      // Pass filters to API
      const res = await fetchScreenerResults(filters);
      if (res?.success) {
        setResults(res.data || []);
        toast.success(`Found ${res.data?.length || 0} matching opportunities`);
      } else {
        toast.error("Failed to run screener. Please try again.");
      }
    } catch (err) {
      console.error("Screener error:", err);
      toast.error("An error occurred while screening.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunScreen();
  }, []);

  const handlePresetClick = (presetLabel: string) => {
    // Basic preset logic - can be expanded
    if (presetLabel === "Value Picks") {
      setFilters(prev => ({ ...prev, peRange: [0, 15], roeMin: [20], riskLevel: "Low" }));
    } else if (presetLabel === "Momentum Breakouts") {
      setFilters(prev => ({ ...prev, aiScoreMin: [80], volumeSurge: "2x avg", rsiRange: [60, 85] }));
    } else if (presetLabel === "Low Risk Bets") {
      setFilters(prev => ({ ...prev, riskLevel: "Low", roeMin: [18] }));
    }
  };

  const handleWatch = async (symbol: string, price: number) => {
    try {
      await addToWatchlist({ 
        symbol, 
        entry_price: price, 
        category: 'CORE',
        source_module: 'AI Screener'
      });
      toast.success(`${symbol} added to Core Watchlist`);
    } catch (err) {
      toast.error(`Symbol ${symbol} is already being tracked.`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="AI Screener"
        description="Filter, rank and discover the best opportunities in seconds."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Preset</Button>
            <Button 
              size="sm" 
              className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0"
              onClick={handleRunScreen}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Scanning..." : "Run Screen"}
            </Button>
          </>
        }
      />

      {/* Smart presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePresetClick(p.label)}
            className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-card hover:border-accent hover:text-accent transition-[var(--transition-base)] active:scale-95"
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="premium-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          <Filter label="Market Cap">
            <select 
              value={filters.marketCap}
              onChange={(e) => setFilters(f => ({ ...f, marketCap: e.target.value }))}
              className="w-full h-9 rounded-md border bg-background px-2.5 text-sm"
            >
              <option>All</option><option>Large Cap</option><option>Mid Cap</option><option>Small Cap</option>
            </select>
          </Filter>
          <Filter label="Sector">
            <select 
              value={filters.sector}
              onChange={(e) => setFilters(f => ({ ...f, sector: e.target.value }))}
              className="w-full h-9 rounded-md border bg-background px-2.5 text-sm"
            >
              <option>All Sectors</option><option>Banking</option><option>IT</option><option>Pharma</option>
              <option>Finance</option><option>Energy</option><option>Consumer</option><option>Infrastructure</option>
            </select>
          </Filter>
          <Filter label={`P/E Range (${filters.peRange[0]}–${filters.peRange[1]})`}>
            <Slider 
              value={filters.peRange} 
              onValueChange={(val) => setFilters(f => ({ ...f, peRange: val }))}
              max={80} step={1} 
            />
          </Filter>
          <Filter label={`ROE Min (${filters.roeMin[0]}%)`}>
            <Slider 
              value={filters.roeMin} 
              onValueChange={(val) => setFilters(f => ({ ...f, roeMin: val }))}
              max={50} step={1} 
            />
          </Filter>
          <Filter label={`RSI Range (${filters.rsiRange[0]}–${filters.rsiRange[1]})`}>
            <Slider 
              value={filters.rsiRange} 
              onValueChange={(val) => setFilters(f => ({ ...f, rsiRange: val }))}
              max={100} step={1} 
            />
          </Filter>
          <Filter label="Breakout Pattern">
            <select 
              value={filters.pattern}
              onChange={(e) => setFilters(f => ({ ...f, pattern: e.target.value }))}
              className="w-full h-9 rounded-md border bg-background px-2.5 text-sm"
            >
              <option>Any</option><option>Cup & Handle</option><option>Flag</option><option>Triangle</option>
            </select>
          </Filter>
          <Filter label="Volume Surge">
            <select 
              value={filters.volumeSurge}
              onChange={(e) => setFilters(f => ({ ...f, volumeSurge: e.target.value }))}
              className="w-full h-9 rounded-md border bg-background px-2.5 text-sm"
            >
              <option>Any</option><option>1.5x avg</option><option>2x avg</option><option>3x avg</option>
            </select>
          </Filter>
          <Filter label={`AI Score Min (${filters.aiScoreMin[0]})`}>
            <Slider 
              value={filters.aiScoreMin} 
              onValueChange={(val) => setFilters(f => ({ ...f, aiScoreMin: val }))}
              max={100} step={1} 
            />
          </Filter>
          <Filter label="Risk Level">
            <select 
              value={filters.riskLevel}
              onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
              className="w-full h-9 rounded-md border bg-background px-2.5 text-sm"
            >
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </Filter>
        </div>
      </div>

      {/* Results */}
      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">Results <span className="text-muted-foreground font-normal text-sm">· {results.length} matches</span></h3>
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
              {results.map((r) => {
                const breakdown = r.scores_breakdown || {};
                const momentum = breakdown.momentum_score || 50;
                const valuation = breakdown.fundamental_score || 50;
                const riskVal = breakdown.risk_score || 50;
                const riskLabel = riskVal >= 70 ? "Low" : riskVal >= 40 ? "Medium" : "High";

                return (
                  <tr key={r.ticker} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-bold tracking-tight">{r.ticker}</td>
                    <td className="py-3 text-muted-foreground">{r.sector || "General"}</td>
                    <td className="py-3 text-right font-mono tabular-nums">₹{r.current_price?.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-center"><ScorePill score={r.score} /></td>
                    <td className="py-3 text-center">
                      <MiniBar value={momentum} />
                    </td>
                    <td className="py-3 text-center">
                      <MiniBar value={valuation} />
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        riskLabel === "Low" && "bg-success/10 text-success",
                        riskLabel === "Medium" && "bg-warning/10 text-warning",
                        riskLabel === "High" && "bg-danger/10 text-danger",
                      )}>{riskLabel}</span>
                    </td>
                    <td className="pr-5 py-3 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2 text-xs text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => handleWatch(r.ticker, r.current_price)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </td>
                  </tr>
                );
              })}
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
