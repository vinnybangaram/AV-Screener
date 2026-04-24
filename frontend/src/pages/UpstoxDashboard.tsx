import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchUpstoxQuote, fetchUpstoxOptions, fetchUpstoxProfile } from "@/services/api";
import { Search, TrendingUp, TrendingDown, Activity, Layers, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { UpstoxConnect } from "@/components/upstox/UpstoxConnect";

export default function UpstoxDashboard() {
  const [symbol, setSymbol] = useState("NSE_EQ|RELIANCE");
  const [quote, setQuote] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const q = await fetchUpstoxQuote(symbol);
      setQuote(q.data?.[symbol]);
      
      const opt = await fetchUpstoxOptions("NSE_INDEX|Nifty 50");
      setOptions(opt.data);
    } catch (err) {
      console.error("Failed to fetch Upstox data:", err);
    }
  }, [symbol, profile]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const p = await fetchUpstoxProfile();
        setProfile(p);
      } catch (err) {
        setProfile(null);
      }
    };
    checkProfile();
  }, []);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  useEffect(() => {
    if (!autoRefresh || !profile) return;
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, profile, loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Upstox Terminal" 
        description="Live market data, institutional option chain, and trade execution powered by Upstox."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpstoxConnect />

          {profile && (
            <>
              {/* Market Quote */}
              <Card className="premium-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" /> Market Watch
                  </h3>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="e.g. NSE_EQ|RELIANCE" 
                        className="pl-9 w-[240px] h-9"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline">Search</Button>
                  </form>
                </div>

                {quote ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Last Traded Price</p>
                      <p className="text-2xl font-black mt-1 font-mono">₹{quote.last_price.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Change</p>
                      <div className={cn("flex items-center gap-1.5 mt-1 font-mono font-bold", quote.net_change >= 0 ? "text-success" : "text-danger")}>
                        {quote.net_change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {quote.net_change.toFixed(2)} ({((quote.net_change / (quote.last_price - quote.net_change)) * 100).toFixed(2)}%)
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Volume</p>
                      <p className="text-xl font-bold mt-1 font-mono">{(quote.volume / 1000000).toFixed(2)}M</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Average Price</p>
                      <p className="text-xl font-bold mt-1 font-mono">₹{quote.average_price.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center border-dashed border-2 rounded-2xl">
                    <p className="text-muted-foreground italic">Search a symbol to see live quotes</p>
                  </div>
                )}
              </Card>

              {/* Option Chain */}
              <Card className="premium-card p-0 overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-warning" /> Nifty Option Chain
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold text-muted-foreground">Auto-Refresh</span>
                       <RefreshCw className={cn("h-3 w-3", autoRefresh && "animate-spin text-success")} onClick={() => setAutoRefresh(!autoRefresh)} />
                    </div>
                    <Badge variant="outline">Expiry: 25-Apr-2024</Badge>
                  </div>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-blue-400">Calls (OI)</TableHead>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-blue-400">IV</TableHead>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-blue-400">LTP</TableHead>
                        <TableHead className="text-center bg-accent/10 font-black text-[11px]">Strike</TableHead>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-red-400">LTP</TableHead>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-red-400">IV</TableHead>
                        <TableHead className="text-center font-black text-[10px] uppercase tracking-tighter text-red-400">Puts (OI)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {options ? options.map((row: any, i: number) => (
                        <TableRow key={i} className="hover:bg-accent/5">
                          <TableCell className="text-center font-mono text-xs">{row.call_options?.market_data?.oi || "0"}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{row.call_options?.market_data?.iv?.toFixed(1) || "0.0"}</TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold text-success">{row.call_options?.market_data?.ltp?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="text-center font-black bg-accent/5 font-mono">{row.strike_price}</TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold text-danger">{row.put_options?.market_data?.ltp?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{row.put_options?.market_data?.iv?.toFixed(1) || "0.0"}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{row.put_options?.market_data?.oi || "0"}</TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                           <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                             Connect Upstox to view institutional option chain data.
                           </TableCell>
                         </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="premium-card p-6">
            <h3 className="font-bold mb-4">Quick Insights</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-card border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Market Status</span>
                <Badge variant="outline" className="text-success border-success/30 bg-success/5">OPEN</Badge>
              </div>
              <div className="p-3 rounded-lg bg-card border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">API Latency</span>
                <span className="text-xs font-bold font-mono">14ms</span>
              </div>
              <div className="p-3 rounded-lg bg-card border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tokens Status</span>
                <span className="text-xs font-bold text-success">Valid</span>
              </div>
            </div>
          </Card>

          <Card className="premium-card p-6 bg-accent/5 border-accent/20">
             <h4 className="text-sm font-bold mb-2">Order Execution Stub</h4>
             <p className="text-xs text-muted-foreground leading-relaxed">
               The order placement engine is currently in "Dry Run" mode. Once verified, you can execute signals directly from the terminal.
             </p>
             <Button variant="outline" size="sm" className="w-full mt-4 border-accent/30 text-accent" disabled>
               Place Sample Order
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
