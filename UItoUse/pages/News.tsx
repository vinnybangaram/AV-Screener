import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Search, Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
}

const news: NewsItem[] = [
  { id: "1", title: "Reliance Industries posts record quarterly profit on retail expansion", source: "Mint", time: "32m", sector: "Energy", symbol: "RELIANCE", sentiment: "positive", score: 0.86, summary: "RIL beat consensus by 6.4% on strong retail and Jio platforms momentum." },
  { id: "2", title: "RBI signals dovish stance, hints at rate cut in next policy meeting", source: "ET", time: "1h", sector: "Banking", sentiment: "positive", score: 0.74, summary: "Banking and rate-sensitive sectors rallied on RBI commentary." },
  { id: "3", title: "TCS warns of soft Q1 demand from BFSI clients in North America", source: "Reuters", time: "2h", sector: "IT", symbol: "TCS", sentiment: "negative", score: -0.62, summary: "Management cautious on near-term BFSI vertical; hedging deal pipeline." },
  { id: "4", title: "Bharti Airtel rolls out 5G in 50 new cities, capex on track", source: "Bloomberg", time: "3h", sector: "Telecom", symbol: "BHARTIARTL", sentiment: "positive", score: 0.68, summary: "Aggressive 5G rollout supports ARPU expansion thesis." },
  { id: "5", title: "Adani Group denies SEBI allegations, stocks volatile in opening trade", source: "Mint", time: "4h", sector: "Infra", sentiment: "negative", score: -0.55, summary: "Group cap-mkt impact ~1.8%; clarification awaited from regulator." },
  { id: "6", title: "Crude oil slips below $78 on demand softness from China", source: "Reuters", time: "5h", sector: "Energy", sentiment: "neutral", score: 0.04, summary: "OMC margins likely to expand; upstream players under pressure." },
  { id: "7", title: "Sun Pharma receives USFDA approval for generic oncology drug", source: "ET", time: "6h", sector: "Pharma", symbol: "SUNPHARMA", sentiment: "positive", score: 0.71, summary: "Estimated peak sales potential of $120M annually." },
  { id: "8", title: "Maruti Suzuki cuts production by 10% citing semiconductor shortage", source: "Mint", time: "7h", sector: "Auto", symbol: "MARUTI", sentiment: "negative", score: -0.48, summary: "Q1 volumes likely to be impacted by 4-5% YoY." },
];

const sectorSentiment = [
  { sector: "Banking", score: 0.62 },
  { sector: "IT", score: -0.18 },
  { sector: "Energy", score: 0.42 },
  { sector: "Pharma", score: 0.55 },
  { sector: "Auto", score: -0.31 },
  { sector: "Telecom", score: 0.48 },
  { sector: "FMCG", score: 0.12 },
  { sector: "Infra", score: -0.22 },
];

const sentimentMeta = {
  positive: { icon: TrendingUp, color: "text-success", bg: "bg-success/10 border-success/30", label: "Positive" },
  negative: { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10 border-danger/30", label: "Negative" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted border-border", label: "Neutral" },
};

const News = () => {
  const [tab, setTab] = useState<"all" | Sentiment>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return news.filter((n) =>
      (tab === "all" || n.sentiment === tab) &&
      (q === "" || n.title.toLowerCase().includes(q.toLowerCase()) || n.symbol?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [tab, q]);

  const stats = useMemo(() => {
    const pos = news.filter((n) => n.sentiment === "positive").length;
    const neg = news.filter((n) => n.sentiment === "negative").length;
    const avg = news.reduce((s, n) => s + n.score, 0) / news.length;
    return { pos, neg, neu: news.length - pos - neg, avg };
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="News & Sentiment" description="Curated news with AI sentiment analysis across sectors and stocks." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Stories Today" value={String(news.length)} delta="Live feed" tone="accent" icon={Newspaper} />
        <KpiCard label="Bullish Bias" value={`${stats.pos}`} delta={`${((stats.pos / news.length) * 100).toFixed(0)}% of stories`} tone="success" trendUp icon={TrendingUp} />
        <KpiCard label="Bearish Bias" value={`${stats.neg}`} delta={`${((stats.neg / news.length) * 100).toFixed(0)}% of stories`} tone="danger" icon={TrendingDown} />
        <KpiCard label="Net Sentiment" value={stats.avg.toFixed(2)} delta={stats.avg > 0 ? "Positive tilt" : "Negative tilt"} tone={stats.avg > 0 ? "success" : "danger"} icon={Sparkles} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 bg-gradient-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="positive">Positive</TabsTrigger>
                <TabsTrigger value="neutral">Neutral</TabsTrigger>
                <TabsTrigger value="negative">Negative</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search news…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-64" />
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((n) => {
              const meta = sentimentMeta[n.sentiment];
              const Icon = meta.icon;
              return (
                <div key={n.id} className="rounded-lg border bg-card p-4 hover:shadow-card transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{n.sector}</Badge>
                        {n.symbol && <Badge variant="secondary" className="text-[10px] font-bold">{n.symbol}</Badge>}
                        <Badge variant="outline" className={`text-[10px] ${meta.bg} ${meta.color}`}>
                          <Icon className="h-3 w-3 mr-1" /> {meta.label} · {n.score.toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm leading-snug">{n.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{n.summary}</p>
                      <div className="text-[11px] text-muted-foreground mt-2">{n.source} · {n.time} ago</div>
                    </div>
                    <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No matching stories.</p>}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card shadow-card h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Sector Sentiment</h3>
          <div className="space-y-3">
            {sectorSentiment.sort((a, b) => b.score - a.score).map((s) => {
              const pct = ((s.score + 1) / 2) * 100;
              const tone = s.score > 0.2 ? "bg-success" : s.score < -0.2 ? "bg-danger" : "bg-warning";
              return (
                <div key={s.sector}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{s.sector}</span>
                    <span className={`tabular-nums font-semibold ${s.score > 0 ? "text-success" : s.score < 0 ? "text-danger" : "text-muted-foreground"}`}>
                      {s.score > 0 ? "+" : ""}{s.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default News;
