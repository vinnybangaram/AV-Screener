import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import { Loader2 } from "lucide-react";

interface Props {
  timeframe?: string;
  category?: string;
}

export function PortfolioPerformanceChart({ timeframe = "This Month", category = "Investment" }: Props) {
  const [mode, setMode] = useState<"pl" | "ret">("pl");
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioTrend = async () => {
      setLoading(true);
      try {
        const daysMap: Record<string, number> = { 'Today': 1, 'This Week': 7, 'This Month': 30, 'This Year': 365 };
        const days = daysMap[timeframe] || 30;
        
        const response = await axios.get(`${API_BASE_URL}/chart/portfolio`, {
          params: { days, category },
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        setRawData(response.data);
      } catch (error) {
        console.error("Performance Chart Error:", error);
        setRawData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioTrend();
  }, [timeframe, category]);

  const { data, symbols } = useMemo(() => {
    if (!rawData || Object.keys(rawData).length === 0) return { data: [], symbols: [] };
    
    // Convert Highcharts multi-series format to Recharts flat format
    const keys = Object.keys(rawData);
    // Find all unique dates across all symbols
    const allDates = new Set<string>();
    keys.forEach(k => rawData[k].forEach((d: any) => allDates.add(new Date(d.date).toLocaleDateString())));
    
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const formattedData = sortedDates.map(dateStr => {
      const row: any = { day: new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
      keys.forEach(k => {
        const point = rawData[k].find((d: any) => new Date(d.date).toLocaleDateString() === dateStr);
        if (point) {
          row[k] = mode === "ret" ? point.indexed : point.close;
        }
      });
      return row;
    });

    const colors = ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--danger))", "hsl(var(--primary))"];
    const symbolsMetadata = keys.map((k, i) => ({
      key: k,
      color: colors[i % colors.length]
    }));

    return { data: formattedData, symbols: symbolsMetadata };
  }, [rawData, mode]);

  if (loading) {
    return (
      <div className="premium-card h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="premium-card h-[400px] flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-medium">No snapshots available for this period.</p>
        <p className="text-xs">Terminal needs at least 2 points to generate trend.</p>
      </div>
    );
  }

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Portfolio Performance Intelligence
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'pl' ? 'Market value across tracked equities' : 'Growth percentage indexed to start'}
          </p>
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
              tickFormatter={(v) => mode === "pl" ? `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}` : `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(val: any) => [mode === 'pl' ? `₹${val.toLocaleString('en-IN')}` : `${val}%`, "Value"]}
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
