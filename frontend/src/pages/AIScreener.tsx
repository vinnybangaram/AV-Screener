import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ScorePill } from "@/components/common/Badges";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Save, Sparkles, Filter as FilterIcon, ChevronLeft, ChevronRight, Info, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { fetchScreenerResults, addToWatchlist } from "@/services/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const presets = [
  { label: "Breakout Stocks", icon: "🚀" },
  { label: "Long Term Compounders", icon: "🌱" },
  { label: "Intraday Movers", icon: "⚡" },
  { label: "Penny Blast", icon: "💣" },
  { label: "Safe Bluechips", icon: "🛡️" },
];

const FilterItem = ({ label, children, info }: { label: string; children: React.ReactNode; info?: string }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      {info && <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" title={info} />}
    </div>
    {children}
  </div>
);

const AIScreener = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Comprehensive filter state with persistence
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("av_screener_filters");
    return saved ? JSON.parse(saved) : {
      exchange: "NSE",
      index: "Nifty 500",
      sector: "All",
      mcap: [0, 100], 
      price: [0, 100000],
      volSpike: [0],
      pe: [0, 100],
      roe: [0],
      rsi: [0, 100],
      conviction: [0],
      risk: [0, 100],
      sentiment: [0, 100],
      breakout: "Any",
      debtEq: "Any",
      profitGrowth: "Any",
      trendStatus: "Any",
      returns1M: "Any",
      relStr: [0]
    };
  });

  const handleRunScreen = async (resetPage = true) => {
    setLoading(true);
    const targetPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      localStorage.setItem("av_screener_filters", JSON.stringify(filters));
      const res = await fetchScreenerResults(filters, targetPage, pageSize, search);
      if (res?.success) {
        setResults(res.data || []);
        setTotal(res.total || 0);
        if (resetPage) toast.success(`Found ${res.total || 0} ranked matches`);
      } else {
        toast.error(res?.error || "Failed to run scan.");
      }
    } catch (err) {
      toast.error("An error occurred during screening.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunScreen(false);
  }, [page]);

  const handlePresetClick = (label: string) => {
    setActivePreset(label);
    let newFilters = { ...filters };
    
    if (label === "Breakout Stocks") {
      newFilters = { ...newFilters, breakout: "Fresh Breakout", rsi: [60, 85], volSpike: [2] };
    } else if (label === "Long Term Compounders") {
      newFilters = { ...newFilters, roe: [20], debtEq: [0, 0.5], mcap: [70, 100] };
    } else if (label === "Intraday Movers") {
      newFilters = { ...newFilters, volSpike: [3], rsi: [50, 90], conviction: [70] };
    } else if (label === "Penny Blast") {
      newFilters = { ...newFilters, price: [0, 100], conviction: [85] };
    } else if (label === "Safe Bluechips") {
      newFilters = { ...newFilters, index: "Nifty 50", pe: [0, 25], roe: [15], risk: [0, 30] };
    }
    
    setFilters(newFilters);
    setPage(1);
    // Use timeout to ensure state is updated before running screen
    setTimeout(() => handleRunScreen(true), 10);
  };

  const handleWatch = async (symbol: string, price: number) => {
    try {
      await addToWatchlist({ symbol, entry_price: price, category: 'CORE', source_module: 'Screener' });
      toast.success(`${symbol} added to watchlist`);
    } catch (err) {
      toast.error(`Already watching ${symbol}`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="AI Stock Screener"
        description="Institutional-grade absolute screening engine for Indian stocks — Ranked by weighted convergence logic."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative group">
               <input 
                 type="text"
                 placeholder="Search Symbol..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleRunScreen(true)}
                 className="h-9 w-64 rounded-md border bg-background px-9 text-xs font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
               />
               <Sparkles className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-accent transition-colors" />
            </div>
             <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                localStorage.removeItem("av_screener_filters");
                window.location.reload();
             }}><RefreshCcw className="h-3.5 w-3.5" /> Reset</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Strategy</Button>
            <Button 
              size="sm" 
              className="gap-1.5 bg-gradient-emerald hover:opacity-90 text-white shadow-glow-emerald border-0"
              onClick={() => handleRunScreen(true)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Ranking..." : "Execute Screen"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePresetClick(p.label)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95",
              activePreset === p.label ? "border-accent bg-accent/5 text-accent shadow-glow-accent" : "hover:border-accent/40"
            )}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      <Card className="premium-card overflow-hidden shadow-glow-accent/5">
        <Tabs defaultValue="basic" className="w-full">
          <div className="bg-muted/30 border-b px-5">
            <TabsList className="h-11 bg-transparent p-0 gap-6">
              <TabsTrigger value="basic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-11 text-[11px] font-bold uppercase tracking-wider">Basic</TabsTrigger>
              <TabsTrigger value="fundamental" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-11 text-[11px] font-bold uppercase tracking-wider">Fundamental</TabsTrigger>
              <TabsTrigger value="technical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-11 text-[11px] font-bold uppercase tracking-wider">Technical</TabsTrigger>
              <TabsTrigger value="momentum" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-11 text-[11px] font-bold uppercase tracking-wider">Momentum</TabsTrigger>
              <TabsTrigger value="avai" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-11 text-[11px] font-bold uppercase tracking-wider text-accent">AV AI Engine</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="basic" className="mt-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <FilterItem label="Exchange">
                <select className="premium-select" value={filters.exchange} onChange={e => setFilters({...filters, exchange: e.target.value})}>
                  <option>NSE</option><option>BSE</option>
                </select>
              </FilterItem>
              <FilterItem label="Index">
                <select className="premium-select" value={filters.index} onChange={e => setFilters({...filters, index: e.target.value})}>
                  <option>Nifty 50</option><option>Nifty 100</option><option>Nifty 500</option><option>All</option>
                </select>
              </FilterItem>
              <FilterItem label="Sector">
                <select className="premium-select" value={filters.sector} onChange={e => setFilters({...filters, sector: e.target.value})}>
                  <option>All</option><option>Banking</option><option>IT</option><option>Auto</option><option>Pharma</option>
                  <option>Energy</option><option>Infrastructure</option><option>Consumer</option><option>Defense</option>
                </select>
              </FilterItem>
              <FilterItem label={`Market Cap Rank`}>
                <Slider value={filters.mcap} onValueChange={v => setFilters({...filters, mcap: v})} max={100} step={1} />
              </FilterItem>
              <FilterItem label="Max Price">
                <select className="premium-select" value={filters.price[1]} onChange={e => setFilters({...filters, price: [0, Number(e.target.value)]})}>
                  <option value={100000}>No Limit</option><option value={100}>₹100</option><option value={500}>₹500</option><option value={2000}>₹2000</option>
                </select>
              </FilterItem>
              <FilterItem label="Volume Spike">
                <select className="premium-select" value={filters.volSpike[0]} onChange={e => setFilters({...filters, volSpike: [Number(e.target.value)]})}>
                  <option value={0}>Any</option><option value={1.5}>&gt; 1.5x</option><option value={2}>&gt; 2.0x</option>
                </select>
              </FilterItem>
            </TabsContent>

            <TabsContent value="fundamental" className="mt-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <FilterItem label={`P/E Ratio (${filters.pe[0]}-${filters.pe[1]})`}>
                <Slider value={filters.pe} onValueChange={v => setFilters({...filters, pe: v})} max={100} step={1} />
              </FilterItem>
              <FilterItem label={`ROE Min (${filters.roe[0]}%)`}>
                <Slider value={filters.roe} onValueChange={v => setFilters({...filters, roe: v})} max={50} step={1} />
              </FilterItem>
              <FilterItem label="Debt/Equity">
                <select 
                  className="premium-select" 
                  value={filters.debtEq} 
                  onChange={e => setFilters({...filters, debtEq: e.target.value})}
                >
                  <option value="Any">Any</option>
                  <option value="Zero Debt">Zero Debt</option>
                  <option value="Low">Low (&lt; 0.5)</option>
                  <option value="Moderate">Moderate (&lt; 1.5)</option>
                </select>
              </FilterItem>
              <FilterItem label="Profit Growth">
                <select 
                  className="premium-select"
                  value={filters.profitGrowth}
                  onChange={e => setFilters({...filters, profitGrowth: e.target.value})}
                >
                  <option value="Any">Any</option>
                  <option value="> 15%">&gt; 15%</option>
                  <option value="> 25%">&gt; 25%</option>
                </select>
              </FilterItem>
            </TabsContent>

            <TabsContent value="technical" className="mt-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <FilterItem label={`RSI (${filters.rsi[0]}-${filters.rsi[1]})`}>
                <Slider value={filters.rsi} onValueChange={v => setFilters({...filters, rsi: v})} max={100} step={1} />
              </FilterItem>
              <FilterItem label="Breakout Pattern">
                <select className="premium-select" value={filters.breakout} onChange={e => setFilters({...filters, breakout: e.target.value})}>
                  <option>Any</option><option>Fresh Breakout</option><option>High Volume Spike</option>
                </select>
              </FilterItem>
              <FilterItem label="Trend Status">
                <select 
                  className="premium-select"
                  value={filters.trendStatus}
                  onChange={e => setFilters({...filters, trendStatus: e.target.value})}
                >
                  <option value="Any">Any</option>
                  <option value="Above 200 DMA">Above 200 DMA</option>
                  <option value="Above 50 DMA">Above 50 DMA</option>
                </select>
              </FilterItem>
            </TabsContent>

            <TabsContent value="momentum" className="mt-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <FilterItem label="1M Returns">
                <select 
                  className="premium-select"
                  value={filters.returns1M || "Any"}
                  onChange={e => setFilters({...filters, returns1M: e.target.value})}
                >
                  <option value="Any">Any</option>
                  <option value="Positive">Positive</option>
                  <option value="> 10%">&gt; 10%</option>
                  <option value="> 20%">&gt; 20%</option>
                </select>
              </FilterItem>
              <FilterItem label="Relative Strength">
                <Slider value={filters.relStr || [0]} onValueChange={v => setFilters({...filters, relStr: v})} max={100} step={1} />
              </FilterItem>
            </TabsContent>

            <TabsContent value="avai" className="mt-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              <FilterItem label={`AI Conviction Min (${filters.conviction[0]})`}>
                <Slider value={filters.conviction} onValueChange={v => setFilters({...filters, conviction: v})} max={100} step={1} />
              </FilterItem>
              <FilterItem label={`Risk Appetite Max (${filters.risk[1]})`}>
                <Slider value={filters.risk} onValueChange={v => setFilters({...filters, risk: v})} max={100} step={1} />
              </FilterItem>
              <FilterItem label={`Sentiment Score Min (${filters.sentiment[0]})`}>
                <Slider value={filters.sentiment} onValueChange={v => setFilters({...filters, sentiment: v})} max={100} step={1} />
              </FilterItem>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Opportunities Dashboard</h3>
              <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 text-[10px] uppercase font-black tracking-widest px-2">Top Ranked</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Showing {results.length} stocks ranked by weighted convergence score</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-bold font-mono">Page {page}</span>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={results.length < pageSize} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
             </div>
             <div className="h-4 w-px bg-border mx-1" />
             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <FilterIcon className="h-3 w-3" /> Weighted Ranking Active
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-y text-[11px] uppercase tracking-wider text-muted-foreground font-black">
              <tr>
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-left py-3">Sector</th>
                <th className="text-right py-3">Price</th>
                <th className="text-center py-3">AV Score</th>
                <th className="text-center py-3">Conviction</th>
                <th className="text-center py-3">Momentum</th>
                <th className="text-center py-3">Risk</th>
                <th className="text-right pr-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground italic">
                    {loading ? "Aggregating market data and calculating ranks..." : "No stocks matching your criteria. Try relaxing some filters for suggestions."}
                  </td>
                </tr>
              ) : (
                results.map((r) => {
                  const breakdown = r.scores_breakdown || {};
                  const momentum = breakdown.momentum_score || 50;
                  const conviction = r.score || 50;
                  const riskVal = breakdown.risk_score || 50;
                  const riskLabel = riskVal >= 70 ? "Low" : riskVal >= 40 ? "Medium" : "High";

                  return (
                    <tr key={r.ticker} className="border-b last:border-0 hover:bg-muted/30 transition-all duration-200">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-base tracking-tight">{r.ticker}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">{r.exchange || "NSE"}</span>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-muted-foreground">{r.sector || "General"}</td>
                      <td className="py-4 text-right font-mono tabular-nums font-semibold">₹{r.current_price?.toLocaleString('en-IN')}</td>
                      <td className="py-4 text-center"><ScorePill score={r.score} /></td>
                      <td className="py-4 text-center">
                        <MiniBar value={conviction} />
                      </td>
                      <td className="py-4 text-center">
                        <MiniBar value={momentum} />
                      </td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm",
                          riskLabel === "Low" && "bg-success/15 text-success border border-success/20",
                          riskLabel === "Medium" && "bg-warning/15 text-warning border border-warning/20",
                          riskLabel === "High" && "bg-danger/15 text-danger border border-danger/20",
                        )}>{riskLabel}</span>
                      </td>
                      <td className="pr-5 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 text-xs font-bold gap-1.5 border-accent/20 hover:border-accent hover:bg-accent/5 hover:text-accent"
                          onClick={() => handleWatch(r.ticker, r.current_price)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Watch
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MiniBar = ({ value }: { value: number }) => (
  <div className="inline-flex items-center gap-2">
    <div className="w-16 h-2 rounded-full bg-muted/50 overflow-hidden shadow-inner">
      <div
        className={cn("h-full rounded-full transition-all duration-500", 
          value >= 75 ? "bg-success shadow-glow-success" : 
          value >= 60 ? "bg-accent shadow-glow-accent" : 
          "bg-warning shadow-glow-warning"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="font-mono text-[11px] tabular-nums font-bold w-6 text-right text-foreground/80">{value}</span>
  </div>
);

export default AIScreener;
