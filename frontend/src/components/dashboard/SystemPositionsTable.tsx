import { Award, AlertCircle, Search, Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState, memo } from "react";

interface SystemPositionsTableProps {
  data?: any[];
  showHeader?: boolean;
}

export const SystemPositionsTable = memo(({ data = [], showHeader = true }: SystemPositionsTableProps) => {
  const [posTab, setPosTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = useMemo(() => {
    const cats = new Set(data.map(i => i.category).filter(Boolean));
    return ["All Categories", ...Array.from(cats)];
  }, [data]);

  const filtered = useMemo(() => {
    // 1. Initial categorisation by Hit Status
    const targetHit = data.filter(i => (i.side !== 'SHORT' ? i.latest_price >= i.target_price : i.latest_price <= i.target_price) && i.target_price > 0);
    const slHit = data.filter(i => (i.side !== 'SHORT' ? i.latest_price <= i.stop_loss : i.latest_price >= i.stop_loss) && i.stop_loss > 0);
    const active = data;
    
    // 2. Select data based on active tab
    let baseData = active;
    if (posTab === "target") baseData = targetHit;
    if (posTab === "sl") baseData = slHit;

    // 3. Apply category filter
    if (catFilter !== "All Categories") {
      baseData = baseData.filter(i => i.category === catFilter);
    }

    // 4. Apply search filter
    const searched = baseData.filter(item => 
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 5. Pagination
    const totalPages = Math.ceil(searched.length / itemsPerPage);
    const paged = searched.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return { 
      active, targetHit, slHit, 
      displayItems: paged, 
      totalItems: searched.length,
      totalPages 
    };
  }, [data, posTab, searchTerm, catFilter, currentPage]);

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ["Asset", "Category", "Strategy", "Date", "Entry", "Current", "Side", "SL", "Target", "PnL", "Alpha"];
    const rows = data.map(p => [
      p.symbol,
      p.category,
      "INTRADAY",
      p.added_at ? new Date(p.added_at).toLocaleDateString() : '---',
      p.entry_price,
      p.latest_price,
      p.side || 'LONG',
      p.stop_loss,
      p.target_price,
      (p.latest_pnl || 0) * (p.quantity || 1),
      (p.latest_pnl_percent || 0).toFixed(2) + "%"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `av_screener_positions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (items: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-semibold px-5 py-2.5">Asset</th>
            <th className="text-left font-semibold py-2.5">Strategy</th>
            <th className="text-left font-semibold py-2.5">Date</th>
            <th className="text-right font-semibold py-2.5">Entry</th>
            <th className="text-right font-semibold py-2.5">Current</th>
            <th className="text-right font-semibold py-2.5">Day's PnL</th>
            <th className="text-center font-semibold py-2.5">Side</th>
            <th className="text-right font-semibold py-2.5">SL</th>
            <th className="text-right font-semibold py-2.5">Target</th>
            <th className="text-right font-semibold py-2.5">Overall PNL</th>
            <th className="text-right font-semibold pr-5 py-2.5">Alpha</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const pnlValue = (p.latest_pnl || 0) * (p.quantity || 1);
            const pnlUp = pnlValue >= 0;
            const alphaUp = (p.latest_pnl_percent || 0) >= 0;
            const dayPnl = p.day_pnl || 0;
            const dayPnlUp = dayPnl >= 0;
            const isIntraday = (p.category || "").toLowerCase().includes("intraday");
            return (
              <tr key={p.id || p.symbol} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-bold text-foreground tracking-tight">{p.symbol}</td>
                <td className="py-3">
                  <span className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    ["MULTIBAGGER", "INVESTMENT"].includes(p.category?.toUpperCase())
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-warning/10 text-warning border border-warning/20",
                  )}>
                    {p.category || "CORE"}
                  </span>
                </td>
                <td className="py-3 text-xs text-muted-foreground">
                   {p.added_at ? new Date(p.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '---'}
                </td>
                <td className="py-3 text-right font-mono tabular-nums">₹{p.entry_price?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-foreground">₹{p.latest_price?.toLocaleString('en-IN')}</td>
                <td className={cn("py-3 text-right font-mono tabular-nums font-semibold", dayPnlUp ? "text-success" : "text-danger")}>
                  {dayPnl > 0 ? "+" : dayPnl < 0 ? "-" : ""}₹{Math.abs(dayPnl).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="py-3 text-center">
                  {isIntraday ? (
                    <span className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
                      p.side === "SHORT" ? "bg-danger/15 text-danger" : "bg-success/15 text-success",
                    )}>{p.side || 'LONG'}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-danger/80">₹{p.stop_loss?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right font-mono tabular-nums text-success/80">₹{p.target_price?.toLocaleString('en-IN')}</td>
                <td className={cn("py-3 text-right font-mono tabular-nums font-bold", pnlUp ? "text-success" : "text-danger")}>
                  {pnlValue < 0 ? "-" : ""}₹{Math.abs(pnlValue).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className={cn("pr-5 py-3 text-right font-mono tabular-nums font-bold", alphaUp ? "text-success" : "text-danger")}>
                  {alphaUp ? "↗" : "↘"} {Math.abs(p.latest_pnl_percent || 0).toFixed(2)}%
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={11} className="p-12 text-center text-sm text-muted-foreground italic">
                No performance data captured for this criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="premium-card overflow-hidden">
      {showHeader && (
        <div className="flex items-start justify-between gap-4 p-5 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
              <Award className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">System Positions</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Quantitative Strategy Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            SL & Target are system-generated estimates, not financial advice
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-b bg-muted/5">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbol, category..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-background border rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-accent outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select 
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-1.5 bg-muted/50 hover:bg-muted text-xs font-semibold rounded-lg border transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </button>
        </div>
      </div>

      <Tabs value={posTab} onValueChange={(v) => { setPosTab(v); setCurrentPage(1); }} className="w-full">
        <div className="px-5 mt-4">
          <TabsList className="bg-muted/40 h-9 p-1">
            <TabsTrigger value="active" className="text-[11px] uppercase tracking-wider font-bold data-[state=active]:bg-gradient-emerald data-[state=active]:text-white">
              Active <span className="ml-1.5 text-[10px] opacity-80">({filtered.active.length})</span>
            </TabsTrigger>
            <TabsTrigger value="target" className="text-[11px] uppercase tracking-wider font-bold">
              Target Hit <span className="ml-1.5 text-[10px] opacity-80">({filtered.targetHit.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sl" className="text-[11px] uppercase tracking-wider font-bold">
              SL Hit <span className="ml-1.5 text-[10px] opacity-80">({filtered.slHit.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={posTab} className="mt-3">
          {renderTable(filtered.displayItems)}
        </TabsContent>
      </Tabs>

      {filtered.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-foreground">{Math.min(currentPage * itemsPerPage, filtered.totalItems)}</span> of <span className="text-foreground">{filtered.totalItems}</span> positions
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1.5 rounded-md border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(filtered.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-8 w-8 text-xs font-bold rounded-md border transition-colors",
                    currentPage === i + 1 ? "bg-accent text-white border-accent shadow-glow-accent" : "bg-card hover:bg-muted"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === filtered.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1.5 rounded-md border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
