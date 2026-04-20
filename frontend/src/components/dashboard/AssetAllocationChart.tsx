import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { useMemo } from "react";

interface Props {
  watchlist?: any[];
}

export function AssetAllocationChart({ watchlist = [] }: Props) {
  const chartData = useMemo(() => {
    if (!watchlist.length) return [];
    
    const items = watchlist.map(i => ({
      name: i.symbol,
      value: (i.latest_price || 0) * (i.quantity || 0)
    }));

    const total = items.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0) return [];

    const colors = [
      "hsl(var(--accent))", 
      "hsl(var(--success))", 
      "hsl(var(--warning))", 
      "hsl(var(--danger))", 
      "hsl(var(--primary))",
      "hsl(258 75% 65%)",
      "hsl(170 70% 50%)",
      "hsl(38 92% 55%)"
    ];

    return items
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((item, i) => ({
        ...item,
        percentage: (item.value / total) * 100,
        color: colors[i % colors.length]
      }));
  }, [watchlist]);

  return (
    <div className="premium-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-foreground">Asset Allocation</h3>
      </div>
      <div className="h-72 relative">
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                />
                <Pie
                  data={chartData}
                  dataKey="percentage"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10 }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  formatter={(value, entry: any) => (
                    <span className="text-foreground/80">{value} <span className="text-muted-foreground font-mono">{entry.payload.percentage.toFixed(1)}%</span></span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-12">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
              <span className="text-sm font-bold bg-gradient-emerald bg-clip-text text-transparent">Spread</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
            Add stocks to see allocation
          </div>
        )}
      </div>
    </div>
  );
}
