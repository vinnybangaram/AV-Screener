import React, { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Zap, Info, ChevronRight, TrendingUp, Loader2 } from "lucide-react";
import { fetchMarketRegime } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MarketRegime = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRegime = async () => {
            try {
                const result = await fetchMarketRegime();
                setData(result);
            } catch (err) {
                console.error("Regime fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        loadRegime();
    }, []);

    if (loading) return (
        <div className="premium-card h-[400px] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Initializing Regime Radar...</p>
        </div>
    );
    
    if (!data) return null;

    const radarData = [
        { subject: 'Trend', A: data.trend_score || 0 },
        { subject: 'Breadth', A: data.breadth_score || 0 },
        { subject: 'Volatility', A: data.volatility_score || 0 },
        { subject: 'Rotation', A: data.rotation_score || 0 },
        { subject: 'Liquidity', A: data.liquidity_score || 0 },
    ];

    const getRegimeColor = (code: string) => {
        if (!code) return 'var(--accent)';
        if (code.startsWith('R1') || code.startsWith('R2')) return 'hsl(var(--success))';
        if (code.startsWith('R3')) return 'hsl(var(--warning))';
        if (code.startsWith('R4')) return 'hsl(var(--accent))';
        if (code.startsWith('R6') || code.startsWith('R7')) return 'hsl(var(--danger))';
        return 'hsl(var(--accent))';
    };

    const color = getRegimeColor(data.regime_code);

    return (
        <div className="premium-card overflow-hidden h-full flex flex-col">
            <div className="p-5 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 border shadow-sm">
                        <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base tracking-tight">{data.regime}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Regime Code:</span>
                            <span className="text-[10px] font-black font-mono text-accent">{data.regime_code}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confidence</div>
                    <div className="text-xl font-black font-mono bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {data.confidence}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 flex-1">
                <div className="relative min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="hsla(var(--border) / 0.5)" />
                            <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} 
                            />
                            <Radar
                                name="Market Regime"
                                dataKey="A"
                                stroke={color}
                                fill={color}
                                fillOpacity={0.25}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-col justify-center gap-4">
                    <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Info className="h-10 w-10 text-accent" />
                        </div>
                        <p className="text-[11px] leading-relaxed text-foreground/80 font-medium italic relative z-10">
                            "{data.summary}"
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2 px-1">Institutional Leadership</span>
                            <div className="flex flex-wrap gap-1.5">
                                {(data.leaders || []).map((s: string) => (
                                    <span key={s} className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-bold border border-success/20 uppercase tracking-wider">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2 px-1">Institutional Laggards</span>
                            <div className="flex flex-wrap gap-1.5">
                                {(data.laggards || []).map((s: string) => (
                                    <span key={s} className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-[10px] font-bold border border-danger/20 uppercase tracking-wider">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto border-t bg-muted/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                        Focus: <span className="text-foreground">{data.regime_code === 'R2' ? 'Momentum Pullbacks' : 'Defensive Rotations'}</span>
                    </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-widest gap-1 hover:bg-accent/10 hover:text-accent">
                    Intelligence Details <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
};

export default MarketRegime;
