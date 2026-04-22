import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Search, Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { fetchGeneralNews, fetchSectorSentiment } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Sentiment = "positive" | "neutral" | "negative";
interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sector: string;
  symbol?: string;
  sentiment: Sentiment;
  score: number;
  summary: string;
  url?: string;
}

const sentimentMeta = {
  positive: { icon: TrendingUp, color: "text-success", bg: "bg-success/10 border-success/30", label: "Positive" },
  negative: { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10 border-danger/30", label: "Negative" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted border-border", label: "Neutral" },
};

const News = () => {
  const [tab, setTab] = useState<"all" | Sentiment>("all");
  const [q, setQ] = useState("");
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [sectorList, setSectorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newsData, sectorsData] = await Promise.all([
          fetchGeneralNews(),
          fetchSectorSentiment()
        ]);
        setNewsList(newsData);
        setSectorList(sectorsData);
      } catch (err) {
        toast.error("Failed to sync news terminal");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return newsList.filter((n) =>
      (tab === "all" || n.sentiment === tab) &&
      (q === "" || n.title.toLowerCase().includes(q.toLowerCase()) || n.symbol?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [tab, q, newsList]);

  const stats = useMemo(() => {
    if (newsList.length === 0) return { pos: 0, neg: 0, neu: 0, avg: 0 };
    const pos = newsList.filter((n) => n.sentiment === "positive").length;
    const neg = newsList.filter((n) => n.sentiment === "negative").length;
    const avg = newsList.reduce((s, n) => s + (n.score || 0), 0) / newsList.length;
    return { pos, neg, neu: newsList.length - pos - neg, avg };
  }, [newsList]);

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-accent" />
           <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Synchronizing News Terminal...</p>
        </div>
     );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="News & Sentiment" description="Institutional grade news feed with multi-factor AI sentiment analysis." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Stories Analyzed" value={String(newsList.length)} delta="Live Node" tone="accent" icon={Newspaper} />
        <KpiCard label="Bullish Bias" value={`${stats.pos}`} delta={`${newsList.length > 0 ? ((stats.pos / newsList.length) * 100).toFixed(0) : 0}% Coverage`} tone="success" trendUp icon={TrendingUp} />
        <KpiCard label="Bearish Bias" value={`${stats.neg}`} delta={`${newsList.length > 0 ? ((stats.neg / newsList.length) * 100).toFixed(0) : 0}% Coverage`} tone="danger" icon={TrendingDown} />
        <KpiCard label="Net Alpha Pulse" value={stats.avg.toFixed(2)} delta={stats.avg > 0 ? "Strategic Positive" : "Risk Aversion Detected"} tone={stats.avg > 0 ? "success" : "danger"} icon={Sparkles} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 premium-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="bg-muted/50 border">
                <TabsTrigger value="all">Global</TabsTrigger>
                <TabsTrigger value="positive">Bullish</TabsTrigger>
                <TabsTrigger value="neutral">Neutral</TabsTrigger>
                <TabsTrigger value="negative">Bearish</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Filter by symbol or headline…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-64 h-9 text-xs" />
            </div>
          </div>
          <div className="space-y-4">
            {filtered.map((n) => {
              const meta = sentimentMeta[n.sentiment];
              const Icon = meta.icon;
              return (
                <div key={n.id} className="rounded-xl border bg-card/40 p-5 hover:bg-muted/30 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter">{n.sector}</Badge>
                        {n.symbol && <Badge className="text-[9px] font-black bg-accent/10 text-accent border-accent/20">{n.symbol}</Badge>}
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase ${meta.bg} ${meta.color}`}>
                          <Icon className="h-3 w-3 mr-1" /> {meta.label} · {n.score?.toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-[15px] leading-tight group-hover:text-accent transition-colors">{n.title}</h4>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{n.summary}</p>
                      <div className="text-[10px] font-bold text-muted-foreground/60 mt-3 flex items-center gap-2">
                        {n.source} <span className="h-1 w-1 rounded-full bg-muted-foreground/30" /> {n.time} ago
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => window.open(n.url || '#', '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                  <Newspaper className="h-12 w-12" />
                  <p className="text-sm font-bold uppercase tracking-widest">No intelligence found</p>
               </div>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6 premium-card border-border/40 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-success via-warning to-danger opacity-20" />
            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-foreground mb-8">Sector Sentiment</h3>
            <div className="space-y-6">
              {sectorList.sort((a, b) => b.score - a.score).map((s) => {
                // Determine color based on threshold to match the image
                const score = s.score;
                let colorClass = "text-success";
                let barClass = "bg-success";
                
                if (score < 0.4 && score >= -0.2) {
                  colorClass = "text-warning";
                  barClass = "bg-warning";
                } else if (score < -0.2) {
                  colorClass = "text-danger";
                  barClass = "bg-danger";
                }

                // Normalized width for the bar (0 to 1 range mapped to 10-100% width)
                const barWidth = Math.min(100, Math.max(10, ((score + 1) / 2) * 100));

                return (
                  <div key={s.sector} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-foreground/80">{s.sector}</span>
                      <span className={cn("text-xs font-black tabular-nums", colorClass)}>
                        {score >= 0 ? "+" : ""}{score.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-[5px] bg-muted/30 rounded-full w-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000 ease-out rounded-full", barClass)} 
                        style={{ width: `${barWidth}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 bg-secondary/10 border-accent/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Sparkles className="h-20 w-20" /></div>
             <h4 className="text-[11px] font-black uppercase tracking-widest text-accent mb-2">AI Pulse Insight</h4>
             <p className="text-xs font-medium leading-relaxed">
                Global sentiment is currently <span className="text-success font-black">Bullish</span> with a focus on Banking rate stability. IT remains a heavy drag on index alpha.
             </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default News;
