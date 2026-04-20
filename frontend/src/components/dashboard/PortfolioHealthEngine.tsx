import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import { Shield, AlertTriangle, Lightbulb, Zap, Loader2, Target, BarChart3 } from 'lucide-react';
import { fetchPortfolioHealth } from "@/services/api";
import { cn } from "@/lib/utils";

// Initialize highcharts modules
if (typeof Highcharts === 'object') {
    if (typeof highchartsMore === 'function') highchartsMore(Highcharts);
    if (typeof solidGauge === 'function') solidGauge(Highcharts);
}

const HighchartsReactComponent = HighchartsReact.default || HighchartsReact;

const PortfolioHealthEngine = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHealth = async () => {
            try {
                const healthData = await fetchPortfolioHealth();
                setData(healthData);
            } catch (err) {
                console.error("Failed to fetch portfolio health:", err);
            } finally {
                setLoading(false);
            }
        };
        loadHealth();
    }, []);

    if (loading) return (
        <div className="premium-card h-[500px] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Scanning Risk DNA...</p>
        </div>
    );

    if (!data || data.health_score === 0) return null;

    const { health_score, risk_level, warning, recommendation, factors, allocation } = data;

    const gaugeOptions = {
        chart: { type: 'solidgauge', backgroundColor: 'transparent', height: '240px' },
        title: null,
        pane: {
            center: ['50%', '60%'],
            size: '100%',
            startAngle: -120,
            endAngle: 120,
            background: {
                backgroundColor: 'rgba(255,255,255,0.03)',
                innerRadius: '85%',
                outerRadius: '100%',
                shape: 'arc',
                borderWidth: 0
            }
        },
        tooltip: { enabled: false },
        yAxis: {
            min: 0, max: 100,
            stops: [
                [0.4, 'hsl(var(--danger))'],
                [0.7, 'hsl(var(--warning))'],
                [0.9, 'hsl(var(--success))']
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 0,
            labels: { enabled: false }
        },
        plotOptions: {
            solidgauge: {
                dataLabels: {
                    y: -35,
                    borderWidth: 0,
                    useHTML: true,
                    format: `<div style="text-align:center"><span style="font-size:42px; color:hsl(var(--foreground)); font-weight:900; font-family:var(--font-mono)">{y}</span><br/>` +
                           `<span style="font-size:10px; color:hsl(var(--muted-foreground)); font-weight:800; opacity: 0.6; letter-spacing: 0.1em; text-transform: uppercase">Health Score</span></div>`
                }
            }
        },
        series: [{
            name: 'Health',
            data: [health_score],
            innerRadius: '85%',
            radius: '100%',
            rounded: true
        }],
        credits: { enabled: false }
    };

    const radarOptions = {
        chart: { 
            polar: true, 
            type: 'area', 
            backgroundColor: 'transparent', 
            height: '280px',
            style: { fontFamily: 'inherit' }
        },
        title: null,
        xAxis: {
            categories: ['Diversification', 'Concentration', 'Volatility', 'Correlation', 'Drawdown', 'Cash'],
            tickmarkPlacement: 'on',
            lineWidth: 0,
            labels: { style: { color: 'hsl(var(--muted-foreground))', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' } }
        },
        yAxis: {
            gridLineInterpolation: 'polygon',
            gridLineColor: 'hsl(var(--border))',
            lineWidth: 0, min: 0, max: 100,
            labels: { enabled: false }
        },
        tooltip: { shared: true, pointFormat: '{series.name}: <b>{point.y}</b>' },
        legend: { enabled: false },
        series: [{
            name: 'Risk Score',
            data: [
                factors.diversification, 
                factors.concentration, 
                factors.volatility, 
                factors.correlation, 
                factors.drawdown, 
                factors.cash
            ],
            pointPlacement: 'on',
            color: 'hsl(var(--accent))',
            fillColor: {
                radialGradient: { cx: 0.5, cy: 0.5, r: 0.5 },
                stops: [
                    [0, 'hsla(var(--accent) / 0.05)'],
                    [1, 'hsla(var(--accent) / 0.3)']
                ]
            },
            lineWidth: 2
        }],
        credits: { enabled: false }
    };

    return (
        <div className="premium-card overflow-hidden">
            <div className="p-6 border-b bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-accent" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Portfolio Health Engine</span>
                    </div>
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                        risk_level === 'Low' ? "bg-success/10 text-success border-success/20" : 
                        risk_level === 'Medium' ? "bg-warning/10 text-warning border-warning/20" : 
                        "bg-danger/10 text-danger border-danger/20"
                    )}>
                        {risk_level} Risk Profile
                    </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Institutional Risk Assessment</h3>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x divide-border">
                <div className="space-y-6">
                    <div className="relative -mt-8">
                        <HighchartsReactComponent highcharts={Highcharts} options={gaugeOptions} />
                    </div>
                    
                    <div className="space-y-4 px-2">
                        <div className={cn(
                            "rounded-xl p-4 relative overflow-hidden group border",
                            risk_level === 'Low' ? "bg-success/5 border-success/10" : "bg-card border-border"
                        )}>
                           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                               <Shield className={cn("h-12 w-12", risk_level === 'Low' ? "text-success" : "text-warning")} />
                           </div>
                           <div className="flex items-center gap-2 mb-2">
                               {risk_level === 'Low' ? <Shield className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
                               <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest",
                                   risk_level === 'Low' ? "text-success" : "text-warning"
                               )}>
                                   {risk_level === 'Low' ? 'System Validated' : 'Critical Alert'}
                               </span>
                           </div>
                           <p className="text-xs leading-relaxed text-muted-foreground font-medium relative z-10">{warning}</p>
                        </div>

                        <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                               <Lightbulb className="h-12 w-12 text-accent" />
                           </div>
                           <div className="flex items-center gap-2 mb-2">
                               <Lightbulb className="h-4 w-4 text-accent" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-accent">Strategic Intelligence</span>
                           </div>
                           <p className="text-xs leading-relaxed text-muted-foreground font-medium relative z-10">{recommendation}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:pl-8 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-accent" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">Risk DNA Radar</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground leading-none">V-SCORE 2.0</span>
                        </div>
                        <HighchartsReactComponent highcharts={Highcharts} options={radarOptions} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                         {[
                             { label: 'Volatility', val: factors.volatility, icon: Zap },
                             { label: 'Correlation', val: factors.correlation, icon: BarChart3 },
                             { label: 'Cash Eff.', val: factors.cash, icon: Target },
                         ].map(f => (
                             <div key={f.label} className="premium-card p-3 bg-muted/10 border-0 flex flex-col items-center text-center gap-1.5 grayscale hover:grayscale-0 transition-all duration-300">
                                 <f.icon className="h-4 w-4 text-accent/70" />
                                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{f.label}</span>
                                 <span className="text-sm font-black font-mono">{f.val}%</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            <div className="bg-muted/10 border-t p-3 flex items-center justify-center gap-4 opacity-50 grayscale hover:opacity-100 transition-opacity">
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
                     <Shield className="h-3 w-3" /> System Integrity Validated
                 </div>
                 <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
                     <Zap className="h-3 w-3" /> Real-time Node Tracking
                 </div>
            </div>
        </div>
    );
};

export default PortfolioHealthEngine;
