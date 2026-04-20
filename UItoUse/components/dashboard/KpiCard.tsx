import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { WebGLCardBorder } from "@/components/fx/WebGLCardBorder";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  tone?: "default" | "success" | "danger" | "accent" | "warning";
  icon?: LucideIcon;
  trendUp?: boolean;
}

const toneIconBg: Record<string, string> = {
  default: "bg-gradient-to-br from-muted to-muted/60 text-foreground",
  success: "bg-gradient-emerald text-white shadow-glow-emerald",
  danger: "bg-gradient-danger text-white",
  accent: "bg-gradient-emerald text-white shadow-glow-emerald",
  warning: "bg-gradient-gold text-white",
};

const valueAccent: Record<string, string> = {
  default: "text-foreground",
  success: "bg-gradient-emerald bg-clip-text text-transparent",
  danger: "bg-gradient-danger bg-clip-text text-transparent",
  accent: "bg-gradient-emerald bg-clip-text text-transparent",
  warning: "bg-gradient-gold bg-clip-text text-transparent",
};

export function KpiCard({ label, value, delta, hint, tone = "default", icon: Icon, trendUp }: KpiCardProps) {
  return (
    <WebGLCardBorder color="#10b981" radius={16} intensity={tone === "default" ? 0.7 : 1}>
    <div className="kpi-card group">
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{label}</span>
        </div>
        {Icon && (
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            toneIconBg[tone]
          )}>
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div className={cn(
        "relative text-[2rem] font-bold tabular-nums tracking-tight leading-none",
        valueAccent[tone]
      )}>
        {value}
      </div>

      {delta && (
        <div className="relative mt-3 flex items-center gap-2 text-xs flex-wrap">
          {trendUp !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono font-bold border",
                trendUp
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-danger/10 text-danger border-danger/20",
              )}
            >
              {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {delta}
            </span>
          ) : (
            <span className="font-semibold text-foreground/80">{delta}</span>
          )}
          {hint && <span className="text-muted-foreground text-[11px]">· {hint}</span>}
        </div>
      )}
    </div>
    </WebGLCardBorder>
  );
}
