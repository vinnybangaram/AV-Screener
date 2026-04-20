import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChangeBadge } from "@/components/common/Badges";
import { fetchStockAnalysis, addToWatchlist, searchTickers } from "@/services/api";
import {
  AlertTriangle, Bookmark, Brain, Compass, History as HistoryIcon, Search,
  Share2, Shield, ShieldAlert, Target, Zap, Loader2, Plus
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useSearchParams } from "react-router-dom";

const StockAnalysis = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSymbol = searchParams.get('s') || "";
  
  const [symbol, setSymbol] = useState(urlSymbol);
  const [inputVal, setInputVal] = useState(urlSymbol);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("1y");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searching, setSearching] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    if (urlSymbol && urlSymbol !== symbol) {
      setSymbol(urlSymbol);
      setInputVal(urlSymbol);
    }
  }, [urlSymbol]);

  // Handle Autocomplete Search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputVal.length < 2) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchTickers(inputVal);
        setSuggestions(res || []);
      } catch (err) {
        console.error("Autocomplete failed:", err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const loadData = async (targetSymbol: string, targetPeriod: string = period) => {
    if (!targetSymbol) return;
    setLoading(true);
    try {
      const res = await fetchStockAnalysis(targetSymbol, targetPeriod);
      if (res && res.success) {
        setData(res);
      } else {
        toast.error(`Terminal could not locate data for ${targetSymbol}`);
      }
    } catch (err) {
      toast.error("Analysis engine disconnected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      loadData(symbol, period);
    }
  }, [symbol, period]);

  const handleSelectSuggestion = (s: any) => {
    setInputVal(s.symbol);
    setSymbol(s.symbol);
    setSearchParams({ s: s.symbol });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => Math.max(prev - 1, -1));
      e.preventDefault();
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim().toUpperCase();
    if (query) {
      setSearchParams({ s: query });
      setSymbol(query);
      setShowSuggestions(false);
    }
  };

  const handleWatch = async () => {
    if (!analysis.symbol || !analysis.current_price) return;
    try {
      await addToWatchlist({ 
        symbol: analysis.symbol, 
        entry_price: analysis.current_price, 
        category: 'CORE',
        source_module: 'Stock Analysis'
      });
      toast.success(`${analysis.symbol} committed to core portfolio memory.`);
    } catch (err) {
      toast.error(`Fault committing ${analysis.symbol}. Already tracked?`);
    }
  };

  const metrics = useMemo(() => {
    if (!data || !data.analysis) return [];
    const a = data.analysis;
    const tech = a.technical || {};
    const fund = a.fundamentals || {};
    const today = a.today || {};
    
    return [
      { label: "P/E Ratio", value: fund.pe_ratio ? fund.pe_ratio.toFixed(1) : "---" },
      { label: "Market Cap", value: fund.market_cap ? `₹${(fund.market_cap / 10000000).toFixed(0)} Cr` : "---" },
      { label: "52W High", value: today.stats_1y ? `₹${today.stats_1y.high?.toFixed(0)}` : "---" },
      { label: "52W Low", value: today.stats_1y ? `₹${today.stats_1y.low?.toFixed(0)}` : "---" },
      { label: "RSI (14)", value: tech.rsi?.toFixed(1) || "---" },
      { label: "Trend", value: tech.trend || "---" },
      { label: "Volume", value: today.volume ? (today.volume / 100000).toFixed(1) + " L" : "---" },
      { label: "Sector", value: fund.sector || "---" },
    ];
  }, [data]);

  const analysis = data?.analysis || {};
  const scores = data?.scores || {};
  const ai = data?.ai_insights || {};

  // -- LANDING STATE (If no symbol selected) --
  if (!symbol && !loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-12">
              <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest shadow-sm mx-auto animate-fade-in">
                      <Brain className="h-3.5 w-3.5" /> AI Research Terminal Active
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                      Quant Intelligence <span className="text-accent underline decoration-accent/30 underline-offset-8">Search</span>
                  </h1>
                  <p className="text-muted-foreground max-w-lg mx-auto text-sm font-medium leading-relaxed">
                      Search any Indian stock to unlock deep institutional signals, AI-ranked risk profiles, and momentum forecasts.
                  </p>
              </div>

              <div className="w-full max-w-2xl group relative z-50">
                  <form onSubmit={handleSearch} className="relative">
                      <div className="absolute -inset-1 bg-gradient-emerald rounded-2xl opacity-15 blur group-focus-within:opacity-30 transition-opacity" />
                      <div className="relative flex items-center bg-card border-2 border-border/50 rounded-2xl shadow-elevated transition-all focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/5 overflow-hidden p-2">
                        <Search className="h-6 w-6 text-muted-foreground/60 ml-4" />
                        <input 
                            id="stock-terminal-search"
                            name="stock-search"
                            type="text"
                            placeholder="Enter Stock Symbol (e.g. RELIANCE, ZOMATO)..."
                            className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 px-4 py-4 text-lg font-bold placeholder:text-muted-foreground/40 placeholder:font-medium text-foreground outline-none"
                            value={inputVal}
                            onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onFocus={() => inputVal.length >= 2 && setShowSuggestions(true)}
                            autoFocus
                        />
                        <Button 
                            id="analyze-stock-btn"
                            type="submit" 
                            className="hidden sm:inline-flex h-12 px-8 bg-gradient-emerald text-white rounded-xl font-bold shadow-glow-emerald mr-1"
                        >
                            Analyze →
                        </Button>
                      </div>
                  </form>

                  {/* Landing Suggestions Dropdown */}
                  {showSuggestions && (searching || suggestions.length > 0) && (
                      <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-card border-2 border-border/80 shadow-2xl rounded-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
                           {searching ? (
                               <div className="p-10 flex flex-col items-center justify-center gap-4">
                                   <Loader2 className="h-6 w-6 animate-spin text-accent" />
                                   <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scanning Market Nodes...</span>
                               </div>
                           ) : (
                               <div className="p-2 space-y-1">
                                   <div className="px-4 py-2 border-b border-border/40 mb-1">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Probable Matches</span>
                                   </div>
                                   {suggestions.map((s, i) => (
                                       <div 
                                          key={s.symbol}
                                          onClick={() => handleSelectSuggestion(s)}
                                          onMouseEnter={() => setSelectedIndex(i)}
                                          className={cn(
                                              "flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200",
                                              selectedIndex === i ? "bg-accent/10 translate-x-1" : "hover:bg-muted/50"
                                          )}
                                       >
                                           <div className="flex items-center gap-4">
                                               <div className={cn(
                                                   "px-2.5 py-1.5 rounded-lg font-mono text-xs font-black shadow-sm transition-colors",
                                                   selectedIndex === i ? "bg-accent text-white" : "bg-muted text-foreground/80"
                                                )}>
                                                   {s.symbol}
                                               </div>
                                               <div className="flex flex-col">
                                                   <span className="text-sm font-bold text-foreground truncate max-w-[300px]">{s.name}</span>
                                                   <span className="text-[10px] text-muted-foreground font-medium">National Stock Exchange · EQ</span>
                                               </div>
                                           </div>
                                           <div className="flex items-center gap-2">
                                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md border border-border/50">NSE · EQ</div>
                                              <Search className={cn("h-3.5 w-3.5 transition-opacity", selectedIndex === i ? "opacity-100 text-accent" : "opacity-0")} />
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                      </div>
                  )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 opacity-70">
                  {/* Suggestions chips used as fallback */}
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-2">Top Research:</span>
                  {["RELIANCE", "ZOMATO", "TCS", "HDFCBANK", "SUZLON"].map(s => (
                      <button 
                        key={s} 
                        onClick={() => { setInputVal(s); setSearchParams({s}); setSymbol(s); }}
                        className="px-3 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted text-[11px] font-bold tracking-tight transition-colors"
                      >
                          {s}
                      </button>
                  ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-8 border-t border-border/40 opacity-40">
                  <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">Risk dna mapping</div>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                      <Zap className="h-5 w-5" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">Momentum signals</div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                      <Target className="h-5 w-5" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">Institutional targets</div>
                  </div>
              </div>
          </div>
      );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-medium">Calibrating Quant Models for {symbol}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Stock Analysis"
        description="Deep research terminal with AI-augmented signals."
        actions={
          <>
            <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-accent text-accent hover:bg-accent/10"
                onClick={handleWatch}
            >
              <Plus className="h-3.5 w-3.5" /> Watchlist
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left panel */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="relative z-50">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search symbol…" 
                className="pl-9 bg-card" 
                value={inputVal} 
                onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => inputVal.length >= 2 && setShowSuggestions(true)}
              />
            </form>

            {/* Sidebar Suggestions Dropdown */}
            {showSuggestions && (searching || suggestions.length > 0) && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-150">
                    {searching ? (
                        <div className="p-4 flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-accent" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Searching...</span>
                        </div>
                    ) : (
                        <div className="p-1 space-y-0.5">
                            {suggestions.slice(0, 8).map((s, i) => (
                                <div 
                                    key={s.symbol}
                                    onClick={() => handleSelectSuggestion(s)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                                        selectedIndex === i ? "bg-accent/10 text-accent" : "hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-foreground">{s.symbol}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{s.name}</span>
                                    </div>
                                    <div className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">NSE</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="premium-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">NSE</div>
                <h2 className="text-xl font-bold tracking-tight">{analysis.symbol}</h2>
                <div className="text-xs text-muted-foreground mt-0.5">{analysis.name || symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tabular-nums">₹{analysis.current_price?.toLocaleString('en-IN')}</div>
                <ChangeBadge value={analysis.change_pct} className="mt-1" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-muted-foreground">Buy / Sell Meter</span>
                  <span className={cn("font-semibold", scores.overall_score >= 70 ? "text-success" : scores.overall_score >= 40 ? "text-warning" : "text-danger")}>
                    {scores.risk_reward_verdict || "NEUTRAL"}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-danger via-warning to-success" style={{ width: "100%" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded bg-foreground shadow-md transition-all duration-500" style={{ left: `${scores.overall_score}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Sell</span><span>Neutral</span><span>Buy</span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Conviction Score</span>
                  <span className={cn("font-mono text-2xl font-bold tabular-nums", scores.overall_score >= 70 ? "text-success" : "text-warning")}>
                    {scores.overall_score?.toFixed(0)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", scores.overall_score >= 70 ? "bg-gradient-success" : "bg-gradient-gold")} style={{ width: `${scores.overall_score}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                   {ai.summary ? ai.summary.substring(0, 120) + "..." : "Quantitative signal strength based on 24 market parameters."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-primary text-primary-foreground shadow-elevated p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Brain className="h-24 w-24" />
            </div>
            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">AI Recommendation</span>
                </div>
                <p className="text-sm leading-relaxed text-primary-foreground/90">
                {ai.recommendation || "Processing institutional data to generate an AI thesis for this symbol. Maintain vigilance."}
                </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{analysis.symbol} Chart · Live Trend</h3>
              <div className="hidden sm:flex gap-1 rounded-lg border bg-muted/30 p-0.5">
                {[
                  { label: "1D", value: "1d" },
                  { label: "1W", value: "5d" },
                  { label: "1M", value: "1mo" },
                  { label: "3M", value: "3mo" },
                  { label: "1Y", value: "1y" },
                  { label: "5Y", value: "5y" }
                ].map((tf) => (
                  <button
                    key={tf.label}
                    onClick={() => setPeriod(tf.value)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      period === tf.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysis.chart_data || []}>
                  <defs>
                    <linearGradient id="chartG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(ts) => {
                      const d = new Date(ts);
                      if (period === "1d") return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
                    }}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} 
                    tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    labelFormatter={(ts) => {
                      const d = new Date(ts);
                      if (period === "1d") return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) + ", " + d.toLocaleDateString([], { day: 'numeric', month: 'short' });
                      return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`₹${val}`, "Price"]}
                  />
                  <Area type="monotone" dataKey="close" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#chartG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-card border h-10">
              {["overview", "technicals", "fundamentals", "risk", "ai"].map((t) => (
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
                    <div className="mt-1.5 font-mono text-lg font-bold tabular-nums text-foreground">{m.value}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
               <div className="premium-card p-5">
                 <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-accent">Deep Intelligence Report</h4>
                 <div className="prose prose-sm text-muted-foreground max-w-none">
                   <p className="whitespace-pre-line leading-relaxed">{ai.summary || "No detailed report available for this symbol."}</p>
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="technicals" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Moving Average Stack</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.technical?.ma_stack?.sma || {}).map(([ma, val]) => (
                      <div key={ma} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{ma.toUpperCase()} SMA</span>
                        <div className="flex items-center gap-2">
                           <span className="font-mono">₹{(val as number)?.toFixed(2)}</span>
                           <span className={cn("text-[10px] font-bold", (analysis.current_price > (val as number)) ? "text-success" : "text-danger")}>
                             {(analysis.current_price > (val as number)) ? "ABOVE" : "BELOW"}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                   <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Momentum Indicators</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <div className="text-[10px] text-muted-foreground uppercase font-bold">RSI (14)</div>
                         <div className="text-lg font-bold font-mono">{analysis.technical?.rsi?.toFixed(1)}</div>
                         <div className="text-[10px] text-muted-foreground">{analysis.technical?.rsi > 70 ? "Overbought" : analysis.technical?.rsi < 30 ? "Oversold" : "Neutral Range"}</div>
                      </div>
                      <div>
                         <div className="text-[10px] text-muted-foreground uppercase font-bold">MACD</div>
                         <div className="text-sm font-bold">{analysis.technical?.macd?.status || "Neutral"}</div>
                         <div className="text-[10px] text-muted-foreground font-mono">Value: {analysis.technical?.macd?.macd?.toFixed(2)}</div>
                      </div>
                   </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fundamentals" className="mt-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {[
                   { label: "ROE", value: `${(analysis.fundamentals?.roe * 100).toFixed(1)}%`, status: (analysis.fundamentals?.roe >= 0.15 ? "Strong" : "Average") },
                   { label: "Debt / Equity", value: analysis.fundamentals?.debt_to_equity?.toFixed(2), status: (analysis.fundamentals?.debt_to_equity <= 0.5 ? "Clean" : "High") },
                   { label: "Earnings Growth", value: `${(analysis.fundamentals?.earnings_growth * 100).toFixed(1)}%`, status: "Actual" },
                   { label: "Revenue Growth", value: `${(analysis.fundamentals?.revenue_growth * 100).toFixed(1)}%`, status: "Actual" },
                   { label: "Promoter Holding", value: `${analysis.fundamentals?.promoter_holding?.toFixed(1)}%`, status: "Vested" },
                   { label: "P/E Trailing", value: analysis.fundamentals?.pe_ratio?.toFixed(1), status: "Valuation" }
                 ].map(f => (
                   <div key={f.label} className="rounded-lg border bg-card p-3">
                      <div className="text-muted-foreground font-bold uppercase text-[9px]">{f.label}</div>
                      <div className="text-base font-bold font-mono mt-0.5">{f.value}</div>
                      <div className={cn("text-[9px] font-bold mt-1", f.status === "Strong" || f.status === "Clean" ? "text-success" : "text-muted-foreground")}>{f.status}</div>
                   </div>
                 ))}
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
               <div className="premium-card p-5 border-danger/20 bg-danger/5">
                  <div className="flex items-center gap-2 mb-4 text-danger">
                     <ShieldAlert className="h-4 w-4" />
                     <h4 className="text-xs font-bold uppercase tracking-wider">Structural Risk Profile</h4>
                  </div>
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-card border border-border/40">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase">Solvency Risk</div>
                           <div className="text-sm font-bold mt-1">{analysis.fundamentals?.debt_to_equity > 1.5 ? "HIGH" : "LOW"}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/40">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase">Volatility Risk</div>
                           <div className="text-sm font-bold mt-1">{scores.overall_score < 40 ? "HIGH" : "MODERATE"}</div>
                        </div>
                     </div>
                     <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {scores.risk_verdict || "No major structural warnings identified."}
                     </p>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SectionHeader icon={<Brain className="h-4 w-4 text-accent" />} label="Quantitative Intelligence" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProbabilityForecastCard 
            symbol={analysis.symbol} 
            currentPrice={analysis.current_price} 
            forecastData={data?.forecasts} 
        />
        <ConfluenceAlignmentCard scores={scores} />
        <TradeSetupCard analysis={analysis} scores={scores} ai={ai} />
      </div>

      <SectionHeader icon={<Target className="h-4 w-4 text-accent" />} label="Price Targets & Context" />
      <PriceTargetsCard 
        currentPrice={analysis.current_price} 
        targetData={data?.price_targets} 
      />

      {/* === HISTORICAL SESSION DATA === */}
      <SectionHeader icon={<HistoryIcon className="h-4 w-4 text-accent" />} label="Historical Session Data" />
       <HistoricalSessionsCard history={analysis.history || []} />
    </div>
  );
};

function PriceTargetsCard({ currentPrice, targetData }: { currentPrice: number; targetData: any }) {
  const [tf, setTf] = useState<"7d" | "30d" | "90d">("30d");
  
  if (!targetData || !targetData.targets || !targetData.targets[tf]) {
      return (
          <div className="premium-card p-8 text-center text-sm text-muted-foreground">
             Calculating institutional price targets...
          </div>
      );
  }

  const hData = targetData.targets[tf];
  
  // Parse range strings "X-Y"
  const parseRange = (r: string): [number, number] => {
      const parts = r.split('-');
      return [parseFloat(parts[0]), parseFloat(parts[1])];
  };

  const expectedPath = [
    { label: "NOW", price: currentPrice },
    { label: "7D", price: targetData.targets["7d"]?.expected },
    { label: "30D", price: targetData.targets["30d"]?.expected },
    { label: "90D", price: targetData.targets["90d"]?.expected },
  ];

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Price Target Consensus</h3>
        <span className="rounded-md bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold uppercase">Confidence: {hData.confidence}</span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 p-1 mb-5">
        {(["7d", "30d", "90d"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={cn(
              "py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors",
              tf === t ? "bg-gradient-emerald text-white shadow-glow-emerald" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "7d" ? "7 DAYS" : t === "30d" ? "30 DAYS" : "90 DAYS"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <TargetRow label="BULLISH" range={parseRange(hData.bullish)} probable={parseFloat(hData.bullish.split('-')[1]) * 0.95} color="text-success" bg="bg-success/5 border-success/20" />
        <TargetRow label="BASE CASE" range={parseRange(hData.base)} probable={hData.expected} color="text-accent" bg="bg-accent/5 border-accent/20" />
        <TargetRow label="BEARISH" range={parseRange(hData.bearish)} probable={parseFloat(hData.bearish.split('-')[0]) * 1.05} color="text-danger" bg="bg-danger/5 border-danger/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <Shield className="h-3 w-3" /> Model Drivers
          </div>
          <ul className="text-xs space-y-1 text-muted-foreground">
            {(targetData.drivers || []).map((d: string, i: number) => (
                <li key={i} className="flex gap-2"><span className="text-accent">•</span> {d}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Expected Price Path</div>
          <div className="grid grid-cols-4 gap-2">
            {expectedPath.map((p) => (
              <div key={p.label} className="text-center">
                <div className="mx-auto h-2 w-2 rounded-full bg-accent mb-1.5" />
                <div className="text-[10px] font-bold uppercase tracking-widest">{p.label}</div>
                <div className="font-mono text-[10px] tabular-nums text-accent font-bold">
                  {p.price ? `₹${p.price.toFixed(0)}` : "---"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground italic text-center">Targets are probabilistic scenarios based on market data, not financial advice.</p>
    </div>
  );
}

function TargetRow({ label, range, probable, color, bg }: { label: string; range: [number, number]; probable: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-lg border p-4 flex items-center justify-between", bg)}>
      <div>
        <div className={cn("text-[10px] font-bold uppercase tracking-wider", color)}>{label}</div>
        <div className="font-mono text-base font-bold tabular-nums mt-0.5">₹{range[0]?.toFixed(2)} - ₹{range[1]?.toFixed(2)}</div>
      </div>
      <div className="text-right">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Probable Target</div>
        <div className="font-mono text-base font-bold tabular-nums">₹{probable?.toFixed(2)}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-5 w-1 rounded-full bg-gradient-emerald" />
      {icon}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/80">{label}</h2>
    </div>
  );
}

function ProbabilityForecastCard({ symbol, currentPrice, forecastData }: { symbol: string; currentPrice: number; forecastData: any }) {
  const [tf, setTf] = useState("30D");
  
  const activeForecast = forecastData ? forecastData[tf] : null;

  if (!activeForecast) {
      return (
          <div className="premium-card p-8 text-center text-sm text-muted-foreground">
             Generating probabilistic forecasts...
          </div>
      );
  }

  const parseRange = (r: string): [number, number] => {
      const parts = r.split(' - ');
      return [parseFloat(parts[0]), parseFloat(parts[1])];
  };

  const bullish = activeForecast.scenarios.bullish;
  const neutral = activeForecast.scenarios.neutral;
  const bearish = activeForecast.scenarios.bearish;

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
        Confidence: <span className={cn(activeForecast.confidence === "High" ? "text-success" : "text-warning")}>
            {activeForecast.confidence.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        <ForecastBar label="BULLISH" range={parseRange(bullish.range)} prob={bullish.probability} color="bg-success" labelColor="text-success" />
        <ForecastBar label="NEUTRAL" range={parseRange(neutral.range)} prob={neutral.probability} color="bg-muted-foreground/60" labelColor="text-foreground" />
        <ForecastBar label="BEARISH" range={parseRange(bearish.range)} prob={bearish.probability} color="bg-danger" labelColor="text-danger" />
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Quant Reasoning</div>
        <ul className="space-y-1 text-xs text-foreground/80">
          {(activeForecast.reasoning || []).map((r: string, i: number) => (
              <li key={i} className="flex gap-2"><span className="text-accent">•</span> {r}</li>
          ))}
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
          {label} <span className="font-mono text-foreground/70 ml-1">{range[0]?.toFixed(2)} - {range[1]?.toFixed(2)}</span>
        </span>
        <span className="text-xs font-mono font-bold tabular-nums">{prob}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${prob}%` }} />
      </div>
    </div>
  );
}

function ConfluenceAlignmentCard({ scores }: { scores: any }) {
  const score = scores.overall_score || 0;
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
            stroke={score >= 70 ? "hsl(142 71% 45%)" : "hsl(38 92% 50%)"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251} 251`}
            style={{ filter: "drop-shadow(0 0 8px hsl(158 75% 38% / 0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="font-mono text-4xl font-bold tabular-nums">{score.toFixed(0)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Score</div>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className={cn("inline-block rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider", 
          score >= 70 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
          {score >= 70 ? "CONVINCING" : "MODERATE"} ALIGNMENT
        </span>
      </div>

      <div className="rounded-lg border bg-card p-3 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent mb-2">
          <Zap className="h-3 w-3" /> Key Signal Drivers
        </div>
        <ul className="space-y-1.5 text-xs text-foreground/85">
          <li className="flex gap-2"><span className="text-success font-bold">✓</span> Technical: {scores.technical_verdict}</li>
          <li className="flex gap-2"><span className="text-success font-bold">✓</span> Fundamental: {scores.fundamental_verdict}</li>
        </ul>
      </div>

      <div className="rounded-lg border bg-danger/5 border-danger/20 p-3 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-danger mb-1.5">
          <AlertTriangle className="h-3 w-3" /> Risk Overlays
        </div>
        <p className="text-xs text-muted-foreground italic">{scores.risk_verdict || "No major structural warnings."}</p>
      </div>
    </div>
  );
}

function TradeSetupCard({ analysis, scores, ai }: { analysis: any; scores: any; ai: any }) {
  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" />
          <h3 className="font-bold uppercase tracking-wider text-xs">Trade Setup</h3>
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold">STRATEGY</span>
          <span className="rounded-md bg-success/15 text-success px-2 py-0.5 text-[10px] font-bold">{analysis.trend?.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Base Price</div>
          <div className="font-mono text-sm font-bold tabular-nums text-foreground mt-1">₹{analysis.current_price?.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Risk Weight</div>
          <div className="font-mono text-sm font-bold tabular-nums text-danger mt-1">{scores.risk_verdict || "LOW"}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">Reward Ratio</span>
          <span className="font-mono font-bold tabular-nums text-warning">{scores.risk_reward_verdict}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${scores.overall_score}%` }} />
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent mb-2">
          <Zap className="h-3 w-3" /> Trade Rationale
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic">
           {ai.recommendation || "Maintain long exposure while monitoring support levels."}
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-danger bg-danger/5 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-danger mb-0.5">
          <Shield className="h-3 w-3" /> Risk Overlay
        </div>
        <p className="text-xs text-foreground/80">{ai.risks || "Sentiment indicates potential over-extension in the short term. Use trailed stop loss."}</p>
      </div>
    </div>
  );
}

function HistoricalSessionsCard({ history = [] }: { history: any[] }) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="font-semibold text-foreground">Historical Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Recent trading sessions with volume trace</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Export CSV →</Button>
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
              <th className="text-right font-semibold py-2.5">Volume</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 7).map((s) => (
              <tr key={s.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs tabular-nums text-foreground">{new Date(s.date_str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3 text-right font-mono tabular-nums text-muted-foreground">₹{s.open?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-success/80">₹{s.high?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-danger/80">₹{s.low?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono font-semibold tabular-nums text-foreground">₹{s.close?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono text-xs text-muted-foreground tabular-nums">{s.volume?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockAnalysis;
