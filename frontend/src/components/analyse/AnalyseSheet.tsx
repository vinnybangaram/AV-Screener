import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, AlertOctagon, Cpu, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalyseTarget {
  symbol: string;
  exchangeSymbol?: string;
  source?: string;
  probability?: number;
  business?: number;
  growth?: number;
  management?: number;
  insight?: string;
  outlook?: string;
  risks?: string;
  intelligence?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: AnalyseTarget | null;
}

const Score = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="rounded-xl border bg-card p-4 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={cn("mt-2 font-mono text-2xl font-bold tabular-nums", accent)}>
      {value} <span className="text-sm text-muted-foreground font-medium">/ 10</span>
    </div>
  </div>
);

export function AnalyseSheet({ open, onOpenChange, target }: Props) {
  if (!target) return null;
  const prob = target.probability ?? 63;
  const biz = target.business ?? 6;
  const growth = target.growth ?? 4;
  const mgmt = target.management ?? 6;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="p-5 border-b bg-gradient-to-br from-card to-accent/5">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <SheetTitle className="text-2xl font-bold tracking-tight">{target.symbol}</SheetTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {target.exchangeSymbol ?? `${target.symbol}.NS`}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {target.source ?? "Institutional Discovery"}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4 rounded-xl border bg-card p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Multibagger Probability</span>
            <span className="font-mono text-2xl font-bold bg-gradient-emerald bg-clip-text text-transparent">
              {prob}%
            </span>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid grid-cols-2 mx-5 mt-4 bg-muted">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-emerald data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-emerald data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
              AI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="p-5 space-y-5">
            {/* Strategic Insight */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-accent" />
                <h4 className="font-bold">Strategic Insight</h4>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {target.insight ?? "This stock is currently in a downtrend phase. MACD shows a bullish crossover supporting momentum."}
              </p>
            </section>

            {/* Score grid */}
            <div className="grid grid-cols-3 gap-3">
              <Score label="Business" value={biz} accent="text-accent" />
              <Score label="Growth" value={growth} accent="text-warning" />
              <Score label="Management" value={mgmt} accent="text-accent" />
            </div>

            {/* Market Outlook */}
            <section className="rounded-xl border-l-4 border-success bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="h-4 w-4 text-success" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-success">Market Outlook</h4>
              </div>
              <p className="text-sm text-foreground/80">
                {target.outlook ?? "Bearish outlook for the short-to-medium term."}
              </p>
            </section>

            {/* Potential Risks */}
            <section className="rounded-xl border-l-4 border-danger bg-danger/5 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertOctagon className="h-4 w-4 text-danger" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-danger">Potential Risks</h4>
              </div>
              <p className="text-sm text-foreground/80">
                {target.risks ?? "General market volatility and macroeconomic uncertainties."}
              </p>
            </section>

            {/* Intelligence Layer */}
            <section className="rounded-xl border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intelligence Layer</div>
                  <div className="text-sm font-bold">{target.intelligence ?? "Analytic Fallback Logic"}</div>
                </div>
              </div>
              <span className="rounded-full border border-danger/30 bg-danger/10 text-danger px-2.5 py-0.5 text-[10px] font-bold uppercase">
                Low
              </span>
            </section>
          </TabsContent>

          <TabsContent value="ai" className="p-5">
            <div className="rounded-xl border bg-muted/30 p-8 text-center">
              <Cpu className="h-8 w-8 text-accent mx-auto mb-3" />
              <h4 className="font-bold">AI Chat — Coming soon</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask questions about {target.symbol}, get instant fundamental & technical breakdowns.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
