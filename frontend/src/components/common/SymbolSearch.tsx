import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Building2, TrendingUp, Activity, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import axios from 'axios';

const SymbolSearch = ({ onSelect, placeholder = "Search Indian stocks (e.g. RELIANCE, HDFC BANK)..." }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:10000/api/symbols/search?q=${query}`);
      if (res.data.success) {
        setResults(res.data.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={cn("h-4 w-4 text-muted-foreground transition-colors", query && "text-accent")} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-12 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm transition-all shadow-sm group-hover:border-border/80 font-medium"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[400px] overflow-y-auto p-1.5 custom-scrollbar">
            {results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted/50 flex items-center justify-center border border-border/50 group-hover:border-accent/30 group-hover:bg-accent/5 transition-colors">
                    {item.instrument_type === 'EQUITY' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : item.instrument_type === 'ETF' ? (
                      <Activity className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Building2 className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-tight">{item.symbol}</span>
                      {item.aliases?.includes(query.toUpperCase()) && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0 bg-accent/5 text-accent border-accent/20">
                          <History className="w-2 h-2 mr-0.5" /> Prev. Symbol
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium line-clamp-1 group-hover:text-foreground/80 transition-colors">
                      {item.company_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pr-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0 border-muted-foreground/20 text-muted-foreground">
                    {item.instrument_type}
                  </Badge>
                  <Sparkles className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0" />
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium italic">Found {results.length} ranked matches</span>
            <span className="text-[10px] text-muted-foreground">Press <kbd className="bg-muted px-1 rounded text-[9px]">Enter</kbd> to select</span>
          </div>
        </Card>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <Card className="absolute z-50 w-full mt-2 p-8 text-center bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-muted/50 mb-2">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-semibold">No results for "{query}"</h4>
            <p className="text-xs text-muted-foreground max-w-[200px]">Try searching by symbol, company name, or historical ticker.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SymbolSearch;
