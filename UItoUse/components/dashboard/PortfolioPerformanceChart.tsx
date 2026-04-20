import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const symbols = [
  { key: "ITC", color: "hsl(38 92% 50%)", base: 1820 },
  { key: "TCS", color: "hsl(220 70% 60%)", base: 2520 },
  { key: "ICICIBANK", color: "hsl(142 71% 45%)", base: 1280 },
  { key: "BHARTIARTL", color: "hsl(258 70% 65%)", base: 380 },
];

const days = ["Mar 20","Mar 22","Mar 24","Mar 26","Mar 28","Mar 30","Apr 1","Apr 3","Apr 5","Apr 7","Apr 9","Apr 11","Apr 13","Apr 15"];

function buildSeries() {
  return days.map((d, i) => {
    const row: Record<string, number | string> = { day: d };
    symbols.forEach((s, idx) => {
      const noise = Math.sin((i + idx * 2) / 2.2) * (s.base * 0.012);
      const drift = i * (s.base * 0.0014);
      row[s.key] = +(s.base + noise + drift).toFixed(2);
    });
    return row;
  });
}

export function PortfolioPerformanceChart() {
  const [mode, setMode] = useState<"pl" | "ret">("pl");
  const data = useMemo(buildSeries, []);

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Portfolio Performance Intelligence
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Market value across tracked equities</p>
        </div>
        <div className="flex rounded-lg border bg-card p-1">
          <button
            onClick={() => setMode("pl")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-md transition-colors",
              mode === "pl" ? "bg-gradient-emerald text-white shadow-glow-emerald" : "text-muted-foreground"
            )}
          >
            ₹ P/L
          </button>
          <button
            onClick={() => setMode("ret")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-md transition-colors",
              mode === "ret" ? "bg-gradient-emerald text-white shadow-glow-emerald" : "text-muted-foreground"
            )}
          >
            % Return
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
              tickFormatter={(v) => mode === "pl" ? `₹${(v/1000).toFixed(1)}k` : `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            {symbols.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
