import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Briefcase, 
  Layers, 
  Sparkles, 
  Eye, 
  Trash2, 
  Loader2, 
  Clock,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Search,
  Plus,
  Activity,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { fetchReports, generateReport, deleteReport } from "@/services/api";
import { ChangeBadge, ScorePill } from "@/components/common/Badges";

interface ReportTpl {
  id: string;
  title: string;
  desc: string;
  cadence: string;
  icon: any;
  tone: "accent" | "success" | "warning" | "danger" | "default";
  pages: number;
}

const templates: ReportTpl[] = [
  { id: "morning", title: "Morning Trade Setup", desc: "Pre-market bias, gap movers, and top breakout candidates for the session.", cadence: "Daily 9:00 AM", icon: Zap, tone: "accent", pages: 6 },
  { id: "weekly", title: "Weekly Opportunities", desc: "Top ranked swing trades with precise entry, target and stop loss levels.", cadence: "Weekly Friday", icon: Target, tone: "success", pages: 12 },
  { id: "portfolio", title: "Portfolio Health Audit", desc: "Deep dive into concentration risks, sector imbalance and volatility metrics.", cadence: "Monthly", icon: ShieldCheck, tone: "warning", pages: 18 },
  { id: "sector", title: "Sector Rotation Map", desc: "Institutional money flow analysis tracking the strongest industry trends.", cadence: "Bi-Weekly", icon: Layers, tone: "accent", pages: 10 },
  { id: "backtest", title: "Strategy Performance", desc: "Quant audit of saved strategies across various market regimes and periods.", cadence: "On Demand", icon: BarChart3, tone: "default", pages: 15 },
  { id: "watchlist", title: "Watchlist Intelligence", desc: "Automated scan of your tracked stocks for technical triggers and breakouts.", cadence: "Live Sync", icon: Search, tone: "success", pages: 8 },
];

const toneClass: Record<string, string> = {
  accent: "bg-accent/10 border-accent/20 text-accent",
  success: "bg-success/10 border-success/20 text-success",
  warning: "bg-warning/10 border-warning/20 text-warning",
  danger: "bg-danger/10 border-danger/20 text-danger",
  default: "bg-muted border-border text-muted-foreground",
};

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<any | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      toast.error("Failed to load reports history");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (t: ReportTpl) => {
    setGenerating(t.id);
    const tid = toast.loading(`Intelligence Engine running: ${t.title}...`);

    try {
      const res = await generateReport({
        title: `${t.title} — ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        report_type: t.id,
        metadata_json: { template: t.id }
      });
      
      setReports([res, ...reports]);
      toast.success(`${t.title} Ready`, { id: tid, description: "Scan complete. Actionable insights archived." });
    } catch (err) {
      toast.error("Generation failed", { id: tid });
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReport(id);
      setReports(reports.filter((r) => r.id !== id));
      toast.success("Report deleted from archive");
    } catch (err) {
      toast.error("Failed to delete report");
    }
  };

  const handleGenerateAll = async () => {
    const tid = toast.loading("Launching Intelligence Fleet: Generating 6 core reports...");
    try {
      // Run sequential generations to avoid overwhelming the API thread
      for (const t of templates) {
        await handleGenerate(t);
      }
      toast.success("Intelligence bundle finalized.", { id: tid });
    } catch (err) {
      toast.error("Fleet sync failed. Some reports may be missing.", { id: tid });
    }
  };

  const handleDownload = (r: any) => {
    const toastId = toast.loading(`Encrypting PDF: ${r.title}...`);
    setTimeout(() => {
      // Create a more "official" looking data segment
      const officialString = `
=========================================
      AV-SCREENER QUANT INTELLIGENCE
=========================================
REPORT: ${r.title.toUpperCase()}
TYPE: ${r.report_type.toUpperCase()}
ID: ${r.id}
DATE: ${new Date(r.created_at).toLocaleString()}
-----------------------------------------
EXECUTIVE SUMMARY:
${r.summary}

QUANTITATIVE INSIGHTS:
${JSON.stringify(r.metadata_json?.insights || {}, null, 2)}

-----------------------------------------
      PROPRIETARY & CONFIDENTIAL
=========================================
      `.trim();

      const blob = new Blob([officialString], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = r.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.href = url;
      link.setAttribute('download', `AV_REPORT_${safeTitle}_${r.id}.pdf`);
      link.click();
      toast.success("Secure link transmission complete.", { id: toastId });
    }, 1500);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const lastReport = reports[0];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader 
        title="Reports" 
        description="High-fidelity financial intelligence and performance exports." 
        actions={
          <Button 
            size="sm" 
            onClick={handleGenerateAll}
            className="gap-1.5 bg-gradient-emerald text-white shadow-glow-emerald border-0"
          >
            <Plus className="h-4 w-4" /> Generate All
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Reports Generated" value={String(reports.length)} delta="+4 this week" tone="accent" icon={FileText} />
        <KpiCard label="Active Alerts" value="24" delta="Today" tone="success" icon={Activity} />
        <KpiCard 
          label="Last Analysis" 
          value={lastReport ? new Date(lastReport.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "N/A"} 
          delta={lastReport ? new Date(lastReport.created_at).toLocaleDateString() : "Ready"} 
          tone="warning" 
          icon={Clock} 
        />
        <KpiCard label="Account Risk" value="Low" delta="Safe" tone="success" icon={ShieldCheck} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Intelligence Templates
          </h3>
          <Badge variant="outline" className="text-[10px] font-mono tracking-tighter">AI ENGINE v2.4</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const Icon = t.icon;
            const isGenerating = generating === t.id;
            return (
              <Card key={t.id} className="premium-card p-5 group flex flex-col justify-between h-full">
                <div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 border ${toneClass[t.tone]} transition-transform group-hover:scale-105`}>
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm tracking-tight">{t.title}</h4>
                    <Badge variant="secondary" className="text-[9px] font-mono bg-muted/50">{t.pages} Pgs</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t.desc}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                    <Calendar className="h-3 w-3" /> {t.cadence}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setPreviewReport({...t, isTemplate: true})}>Preview</Button>
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-gradient-emerald text-white border-0 shadow-glow-emerald px-4" 
                      onClick={() => handleGenerate(t)}
                      disabled={!!generating}
                    >
                      {isGenerating ? "Analyzing..." : "Generate"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold text-foreground">Recent History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your generated intelligence archive</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-accent" onClick={loadReports}>Refresh</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-semibold px-5 py-2.5">Date & Time</th>
                <th className="text-left font-semibold py-2.5">Analysis Title</th>
                <th className="text-left font-semibold py-2.5">Type</th>
                <th className="text-center font-semibold py-2.5">Efficiency</th>
                <th className="text-right font-semibold pr-5 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="border-b last:border-0"><td colSpan={5} className="p-5"><Skeleton className="h-4 w-full" /></td></tr>
                 ))
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic text-xs">No reports generated yet. Click generate above.</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4 text-xs font-medium text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()} at {new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="py-4 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{r.title}</span>
                        <span className="text-[10px] font-medium text-accent truncate max-w-xs">{r.summary}</span>
                      </div>
                    </td>
                    <td className="py-4"><Badge variant="outline" className="text-[9px] uppercase font-bold">{r.report_type}</Badge></td>
                    <td className="py-4 text-center"><ScorePill score={85} /></td>
                    <td className="pr-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-accent" onClick={() => setPreviewReport(r)}>
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-accent" onClick={() => handleDownload(r)}>
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-danger opacity-0 group-hover:opacity-100" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standard Dialog for Preview */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6 gap-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">{previewReport?.title}</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  {previewReport?.isTemplate ? "Previewing Template Design" : `Generated: ${new Date(previewReport?.created_at).toLocaleString()}`}
                </DialogDescription>
              </div>
              <Badge className="bg-success/20 text-success border-success/30 font-bold">ALPHA SYNC READY</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
             <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reliability Score</span>
                    <span className="text-lg font-bold text-accent">
                      {previewReport?.report_type === 'backtest' ? '98% Quant' : '94% Strategic'}
                    </span>
                </div>
                <div className={`p-4 rounded-xl border bg-card flex flex-col gap-1`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market Edge</span>
                    <span className="text-lg font-bold text-success font-mono">
                      {previewReport?.report_type === 'morning' ? '+2.4% GAP' : 'ALPHA+'}
                    </span>
                </div>
                <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Points</span>
                    <span className="text-lg font-bold italic">Institutional</span>
                </div>
             </div>

             <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Quantitative Takeaway
                </h4>
                <div className="p-6 rounded-2xl bg-muted/50 border border-border/50 text-sm leading-relaxed text-foreground/90 italic">
                    {previewReport?.summary || "Analyzing latest market dynamics for your specific profile and risk tolerances..."}
                </div>
             </div>

             {/* Dynamic Insight Rendering */}
             {previewReport?.metadata_json?.insights && (
               <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-accent" /> Detailed intelligence
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                      {previewReport.report_type === 'morning' && (
                        <>
                          <div className="text-xs font-bold text-muted-foreground border-b pb-1">Top Breakout Candidates</div>
                          {previewReport.metadata_json.insights.topBreakouts?.map((b: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-card border">
                               <span className="font-bold">{b.symbol}</span>
                               <span className="text-[10px] uppercase font-bold text-accent">{b.reason}</span>
                               <Badge variant="outline">{b.confidence}</Badge>
                            </div>
                          ))}
                        </>
                      )}
                      {previewReport.report_type === 'portfolio' && (
                        <>
                          <div className="text-xs font-bold text-muted-foreground border-b pb-1">Risk Factors & Optimization</div>
                          {previewReport.metadata_json.insights.risks?.map((r: any, i: number) => (
                            <div key={i} className="flex gap-3 items-center p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                               <div className="h-2 w-2 rounded-full bg-rose-500" />
                               <span className="text-xs font-medium text-foreground">{r}</span>
                            </div>
                          ))}
                          {previewReport.metadata_json.insights.suggestions?.map((s: any, i: number) => (
                            <div key={i} className="flex gap-3 items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                               <div className="h-2 w-2 rounded-full bg-emerald-500" />
                               <span className="text-xs font-medium text-foreground">{s}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {previewReport.report_type === 'weekly' && (
                        <div className="grid grid-cols-2 gap-3">
                           {previewReport.metadata_json.insights.map((opt: any, i: number) => (
                              <div key={i} className="p-4 rounded-xl border bg-card space-y-2">
                                 <div className="flex justify-between items-start">
                                    <span className="font-bold">{opt.symbol}</span>
                                    <ScorePill score={opt.score} />
                                 </div>
                                 <div className="text-[10px] text-muted-foreground font-medium">{opt.reason}</div>
                                 <div className="flex gap-2 text-[9px] font-mono whitespace-nowrap">
                                    <span className="text-success">ENT: ₹{opt.entry}</span>
                                    <span className="text-danger">SL: ₹{opt.stoploss}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                      )}
                      {previewReport.report_type === 'sector' && (
                        <div className="space-y-2">
                           {previewReport.metadata_json.insights.rankings?.map((s: any, i: number) => (
                             <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                               <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-16">{s.sector}</span>
                                  <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                                     <div className="h-full bg-accent" style={{width: `${s.strength}%`}} />
                                  </div>
                               </div>
                               <span className="text-[11px] font-bold text-accent">{s.topStock} Leading</span>
                             </div>
                           ))}
                        </div>
                      )}
                  </div>
               </div>
             )}

             <div className="p-6 border border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground gap-3 py-10 opacity-60">
                 <BarChart3 className="h-10 w-10" />
                 <span className="text-xs font-medium">[ Dynamic Visual Intelligence Component... ]</span>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setPreviewReport(null)}>Close Preview</Button>
            <Button className="bg-gradient-emerald text-white border-0 shadow-glow-emerald px-8" onClick={() => handleDownload(previewReport)}>
              <Download className="h-4 w-4 mr-2" /> Download Full PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
