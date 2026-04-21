import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FileText, Download, Calendar, TrendingUp, Briefcase, Layers, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";

interface ReportTpl {
  id: string;
  title: string;
  desc: string;
  cadence: string;
  icon: typeof FileText;
  tone: "accent" | "success" | "warning" | "primary";
  pages: number;
}

const templates: ReportTpl[] = [
  { id: "daily", title: "Daily Market Brief", desc: "Index performance, top movers, sector heatmap and AI takeaways.", cadence: "Every market close", icon: Calendar, tone: "accent", pages: 6 },
  { id: "weekly", title: "Weekly Opportunities", desc: "Top 10 ranked AI picks across multibagger, intraday and penny universes.", cadence: "Every Friday 6 PM", icon: TrendingUp, tone: "success", pages: 12 },
  { id: "portfolio", title: "Portfolio Health Report", desc: "Holdings, allocation drift, risk score, P&L attribution and rebalance plan.", cadence: "Monthly", icon: Briefcase, tone: "warning", pages: 18 },
  { id: "sector", title: "Sector Rotation Report", desc: "Relative strength, money flow and rotation map across all NIFTY sectors.", cadence: "Bi-weekly", icon: Layers, tone: "primary", pages: 10 },
  { id: "ai", title: "AI Recommendation Sheet", desc: "Conviction scoring, entry/SL/target levels and risk overlays per stock.", cadence: "On demand", icon: Sparkles, tone: "accent", pages: 8 },
];

const recent = [
  { name: "Daily Market Brief — 15 Apr 2025", size: "1.4 MB", time: "Today 16:02" },
  { name: "Weekly Opportunities — Wk 15", size: "3.2 MB", time: "11 Apr 18:00" },
  { name: "Portfolio Health Report — Mar 2025", size: "4.8 MB", time: "31 Mar 23:45" },
  { name: "AI Recommendation Sheet — RELIANCE", size: "0.9 MB", time: "08 Apr 11:18" },
];

const toneClass: Record<string, string> = {
  accent: "from-accent/15 to-accent/5 text-accent border-accent/30",
  success: "from-success/15 to-success/5 text-success border-success/30",
  warning: "from-warning/15 to-warning/5 text-warning border-warning/30",
  primary: "from-primary/15 to-primary/5 text-primary border-primary/30",
};

const Reports = () => {
  const generate = (t: ReportTpl) => toast.success(`Generating "${t.title}"…`, { description: "PDF will be ready in your downloads shortly." });
  const download = (name: string) => toast.success(`Downloading ${name}`);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader title="Reports" description="Generate downloadable investor-grade reports." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Templates" value={String(templates.length)} delta="Investor grade" tone="accent" icon={FileText} />
        <KpiCard label="Generated (30D)" value="42" delta="+18% vs last month" tone="success" trendUp icon={TrendingUp} />
        <KpiCard label="Scheduled" value="3" delta="Daily · Weekly · Monthly" tone="warning" icon={Calendar} />
        <KpiCard label="Storage Used" value="184 MB" delta="of 5 GB" tone="success" icon={Layers} />
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Report Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.id} className="p-5 bg-gradient-card shadow-card hover:shadow-elevated transition group">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${toneClass[t.tone]} border flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold">{t.title}</h4>
                  <Badge variant="outline" className="text-[10px] shrink-0">{t.pages}p</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.desc}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                  <Calendar className="h-3 w-3" /> {t.cadence}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => toast.info(`Previewing ${t.title}`)}>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button size="sm" className="flex-1 gap-1.5 bg-gradient-emerald text-white border-0" onClick={() => generate(t)}>
                    <Download className="h-3.5 w-3.5" /> Generate
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="p-5 bg-gradient-card shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Recent Generations</h3>
        <div className="space-y-2">
          {recent.map((r) => (
            <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-card transition">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><FileText className="h-4 w-4 text-accent" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.time} · PDF · {r.size}</div>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => download(r.name)}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
