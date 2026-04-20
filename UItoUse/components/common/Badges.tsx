import { cn } from "@/lib/utils";

export function ChangeBadge({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
        up ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
        className,
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 85 ? "bg-success/10 text-success border-success/20"
    : score >= 70 ? "bg-accent/10 text-accent border-accent/20"
    : "bg-warning/10 text-warning border-warning/20";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums", tone)}>
      {score}
    </span>
  );
}
