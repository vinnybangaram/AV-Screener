import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const data = [
  { name: "BHARTIARTL", value: 30.3, color: "hsl(258 75% 65%)" },
  { name: "ICICIBANK", value: 22.2, color: "hsl(158 75% 45%)" },
  { name: "TCS", value: 42.5, color: "hsl(170 70% 50%)" },
  { name: "ITC", value: 5.0, color: "hsl(38 92% 55%)" },
];

export function AssetAllocationChart() {
  return (
    <div className="premium-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-foreground">Asset Allocation</h3>
      </div>
      <div className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value, entry: any) => (
                <span className="text-foreground/80">{value} <span className="text-muted-foreground font-mono">{entry.payload.value.toFixed(1)}%</span></span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-12">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Strategy</span>
          <span className="text-sm font-bold bg-gradient-emerald bg-clip-text text-transparent">Multibagger</span>
        </div>
      </div>
    </div>
  );
}
