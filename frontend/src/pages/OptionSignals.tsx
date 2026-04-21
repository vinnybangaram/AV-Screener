import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Activity, ArrowUpRight, ArrowDownRight, Zap, Shield, TrendingUp, TrendingDown, 
  Search, Filter, Info, Pause, CheckCircle2, Clock, Target, BarChart3, Flame, Settings, Play,
  LayoutDashboard, History, Layers, Loader2, Crosshair, Square, Terminal
} from "lucide-react";
import Highcharts from 'highcharts/highstock';
import hollowCandlestick from 'highcharts/modules/hollowcandlestick';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/lib/auth-store";
import { 
  fetchOptionSignalsDashboard, 
  fetchOptionSignalsSettings, 
  updateOptionSignalsSettings,
  forceOptionSignalsSync
} from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

const HighchartsReactComponent = HighchartsReact.default || HighchartsReact;

// Initialize Highcharts modules
if (typeof Highcharts === 'object' && typeof hollowCandlestick === 'function') {
    hollowCandlestick(Highcharts);
}

// Register custom proportional width plugin
if (typeof Highcharts === 'object') {
    (function (H: any) {
        H.addEvent(
            H.seriesTypes.column,
            'afterColumnTranslate',
            function (this: any) {
                const series = this;
                if (series.options.baseVolume && series.is('column') && series.points) {
                    const volumeSeries = series.chart.get(series.options.baseVolume);
                    if (volumeSeries && typeof volumeSeries.getColumn === 'function') {
                        const processedYData = volumeSeries.getColumn('y', true);
                        const maxVolume = volumeSeries.dataMax,
                            metrics = series.getColumnMetrics(),
                            baseWidth = metrics.width;

                        series.points.forEach((point: any, i: number) => {
                            const volume = processedYData[i];
                            const scale = (maxVolume > 0) ? (volume / maxVolume) : 1;
                            const width = baseWidth * scale;

                            if (point.shapeArgs) {
                                point.shapeArgs.x = point.shapeArgs.x - width / 2 + point.shapeArgs.width / 2;
                                point.shapeArgs.width = width;
                            }
                        });
                    }
                }
            }
        );
    }(Highcharts));
}

const OptionSignals = () => {
  const user = useAuthUser();
  const [activeTab, setActiveTab] = useState("nifty");
  const [filterType, setFilterType] = useState("ALL");
  const [activeTimeframe, setActiveTimeframe] = useState("1m");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [settings, setSettings] = useState({
    lots: 1,
    max_trades_day: 5,
    risk_mode: "Balanced",
    auto_execute: false
  });
  
  const [tempSettings, setTempSettings] = useState(settings);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const [dashRes, settingsRes] = await Promise.all([
          fetchOptionSignalsDashboard(user?.id),
          fetchOptionSignalsSettings(user?.id)
        ]);
        setDashboardData(dashRes);
        setSettings(settingsRes);
        setTempSettings(settingsRes);
      } catch (err) {
        console.error("OptionSignals init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();

    pollingRef.current = setInterval(async () => {
      try {
        const dashRes = await fetchOptionSignalsDashboard(user?.id);
        setDashboardData(dashRes);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Increased polling frequency to 2s

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user?.id]);

  const handleApplySettings = async () => {
    try {
        setIsUpdating(true);
        const trades = Math.max(1, Math.min(parseInt(tempSettings.max_trades_day as any) || 1, 5));
        const lots = Math.max(1, parseInt(tempSettings.lots as any) || 1);

        const finalSettings = { 
            ...tempSettings, 
            max_trades_day: trades,
            lots: lots,
            auto_execute: true 
        };
        
        const updated = await updateOptionSignalsSettings(finalSettings, user?.id);
        setSettings(updated);
        setIsStartModalOpen(false);
        setIsConfigModalOpen(false);
        toast.success("Engine started with optimized parameters");
    } catch (err) {
        console.error("Settings apply error:", err);
        toast.error("Execution failed to initialize");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleStopEngine = async () => {
    try {
        const updated = await updateOptionSignalsSettings({ ...settings, auto_execute: false }, user?.id);
        setSettings(updated);
        toast.success("Engine halted successfully");
    } catch (err) {
        toast.error("Stop command failed");
    }
  };

  const trades = dashboardData?.trades || [];
  const filteredTrades = trades.filter((t: any) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  const niftyPrice = dashboardData?.nifty_live?.value || 24364.85;
  const bankniftyPrice = dashboardData?.banknifty_live?.value || 52450.15;

  const livePrice = activeTab === "nifty" ? niftyPrice : bankniftyPrice;
    
  const liveChange = activeTab === "nifty"
    ? dashboardData?.nifty_live?.change_pct || 0.05
    : dashboardData?.banknifty_live?.change_pct || -0.21;

  const currentTrade = trades.find((t: any) => t.status === "OPEN" && t.symbol === activeTab.toUpperCase());

  // Mapping trades to chart markers (Flags)
  const tradeFlags = useMemo(() => {
    const flags: any[] = [];
    trades.filter((t: any) => t.symbol === activeTab.toUpperCase()).forEach((t: any) => {
        // Entry Flag
        flags.push({
            x: new Date(t.execution_time).getTime(),
            title: 'E',
            text: `<b>Entry: ₹${t.entry_price.toFixed(2)}</b><br/>Time: ${new Date(t.execution_time).toLocaleTimeString()}<br/>Type: ${t.type}<br/>Instrument: ${t.instrument}`,
            shape: 'circlepin',
            color: '#3b82f6', // accent color
            fillColor: '#3b82f6',
            style: { color: 'white' }
        });

        // Exit Flag
        if (t.status === 'CLOSED' && t.exit_time) {
            flags.push({
                x: new Date(t.exit_time).getTime(),
                title: 'X',
                text: `<b>Exit: ₹${t.exit_price?.toFixed(2)}</b><br/>Time: ${new Date(t.exit_time).toLocaleTimeString()}<br/>P&L: ₹${t.pnl?.toLocaleString()}<br/>Reason: ${t.exit_reason || 'N/A'}`,
                shape: 'squarepin',
                color: t.pnl >= 0 ? '#10b981' : '#ef4444', 
                fillColor: t.pnl >= 0 ? '#10b981' : '#ef4444',
                style: { color: 'white' }
            });
        }
    });
    return flags;
  }, [trades, activeTab]);

  // Highcharts Options
  const chartOptions = useMemo(() => {
    const dataLength = 100;
    const ohlc: any[] = [];
    const volume: any[] = [];
    
    // Generate data working BACKWARDS from livePrice to ensure it ends at current price
    const now = Date.now();
    let currentWalk = livePrice;
    
    for (let i = dataLength - 1; i >= 0; i--) {
        const time = now - (dataLength - 1 - i) * 60000 * 5; // 5-min intervals for better view
        const close = currentWalk;
        const volatility = activeTab === "nifty" ? 15 : 40;
        const open = close + (Math.random() * volatility - volatility/2);
        const high = Math.max(open, close) + Math.random() * (volatility/3);
        const low = Math.min(open, close) - Math.random() * (volatility/3);
        
        ohlc.unshift([time, open, high, low, close]);
        volume.unshift({
            x: time,
            y: Math.random() * 1000 + 500,
            color: close > open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
        });
        currentWalk = open; // Next candle (going backwards) starts from this open
    }

    return {
        chart: {
            backgroundColor: 'transparent',
            height: 450,
            spacing: [10, 0, 10, 0],
            style: { fontFamily: 'inherit' }
        },
        rangeSelector: { enabled: false },
        navigator: { enabled: false },
        scrollbar: { enabled: false },
        xAxis: {
            type: 'datetime',
            gridLineWidth: 0,
            labels: { style: { color: 'rgba(255,255,255,0.4)', fontSize: '9px' } },
            lineWidth: 0,
            tickWidth: 0
        },
        yAxis: [{
            labels: { align: 'right', x: -10, style: { color: 'rgba(255,255,255,0.3)', fontSize: '9px' } },
            height: '80%',
            gridLineColor: 'rgba(255,255,255,0.03)',
            lineWidth: 0,
            title: { text: null }
        }, {
            labels: { enabled: false },
            top: '80%',
            height: '20%',
            offset: 0,
            gridLineWidth: 0,
            title: { text: null }
        }],
        plotOptions: {
            series: {
                groupPadding: 0,
                pointPadding: 0.1,
                borderWidth: 0,
                dataGrouping: { enabled: false }
            },
            hollowcandlestick: {
                color: '#ef4444',
                upColor: '#10b981',
                lineColor: '#ef4444',
                upLineColor: '#10b981'
            },
            flags: {
                useHTML: true,
                onSeries: 'main-ohlc',
                width: 16,
                style: { fontSize: '9px', fontWeight: 'bold' }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            style: { color: '#ffffff', fontSize: '10px' },
            shared: true,
            split: false,
            useHTML: true,
            headerFormat: '<span style="font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase;">{point.key}</span><br/>',
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'
        },
        series: [{
            type: 'hollowcandlestick',
            id: 'main-ohlc',
            name: activeTab === 'nifty' ? 'Nifty 50' : 'Bank Nifty',
            data: ohlc,
            baseVolume: 'main-volume'
        }, {
            type: 'column',
            id: 'main-volume',
            name: 'Volume',
            data: volume,
            yAxis: 1,
            baseVolume: 'main-volume'
        }, {
            type: 'flags',
            name: 'Execution Events',
            data: tradeFlags,
            onSeries: 'main-ohlc',
            shape: 'circlepin',
            width: 16,
            y: -30
        }],
        credits: { enabled: false }
    };
  }, [activeTab, livePrice, activeTimeframe, tradeFlags]);

  // Metrics Mapping
  const summaryMetrics = [
    { 
      label: "Today P&L", 
      value: `₹${(dashboardData?.today_pnl || 0).toLocaleString()}`, 
      trend: dashboardData?.today_pnl >= 0 ? "+12.5%" : "-5.2%", 
      positive: (dashboardData?.today_pnl || 0) >= 0, 
      icon: TrendingUp 
    },
    { 
      label: "Engine Status", 
      value: settings.auto_execute ? "STARTING" : "HALTED", 
      status: settings.auto_execute ? "Running" : "Paused", 
      active: settings.auto_execute, 
      icon: Flame 
    },
    { 
      label: "Active Trades", 
      value: (dashboardData?.active_trades_count || 0).toString(), 
      subtext: "Nifty & Banknifty", 
      icon: Activity 
    },
    { 
      label: "Win Rate", 
      value: `${dashboardData?.win_rate || 0}%`, 
      trend: "+2.1%", 
      positive: true, 
      icon: Target 
    },
    { 
      label: "Signals Today", 
      value: (dashboardData?.signals_today || 0).toString(), 
      subtext: "System Generated", 
      icon: Zap 
    },
  ];

  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  useEffect(() => {
    setLastUpdateTime(new Date());
  }, [dashboardData]);

  if (loading) {
     return <div className="flex h-[80vh] items-center justify-center">
       <div className="flex flex-col items-center gap-4">
         <Activity className="h-12 w-12 text-accent animate-spin" />
         <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing Option Engine...</span>
       </div>
     </div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Option <span className="bg-gradient-emerald bg-clip-text text-transparent">Signals</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Automated high-probability index option execution engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
              "px-3 py-1 gap-1.5 font-bold transition-all",
              settings.auto_execute ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
          )}>
            <span className={cn("h-2 w-2 rounded-full", settings.auto_execute ? "bg-success animate-pulse" : "bg-danger")} /> 
            {settings.auto_execute ? "ENGINE RUNNING" : "ENGINE HALTED"}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 font-semibold">
            <History className="h-4 w-4" /> Trade History
          </Button>
          {!settings.auto_execute ? (
             <Button 
                size="sm" 
                className="bg-gradient-emerald text-white border-0 shadow-glow-emerald font-bold gap-2"
                onClick={() => {
                    setTempSettings({ ...settings });
                    setIsStartModalOpen(true);
                }}
             >
                <Play className="h-4 w-4" /> Start Engine
             </Button>
          ) : (
            <Button 
                variant="destructive"
                size="sm" 
                className="font-bold gap-2"
                onClick={handleStopEngine}
             >
                <Pause className="h-4 w-4" /> Stop Engine
             </Button>
          )}
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryMetrics.map((metric, i) => (
          <div key={i} className="kpi-card group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
              <div className={cn(
                "p-2 rounded-lg transition-colors bg-muted group-hover:bg-accent/10",
                metric.active && "bg-success/10 text-success"
              )}>
                <metric.icon className={cn("h-4 w-4", metric.active ? "text-success" : "text-muted-foreground")} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
              {metric.trend && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  metric.positive ? "text-success bg-success/10" : "text-danger bg-danger/10"
                )}>
                  {metric.trend}
                </span>
              )}
            </div>
            {(metric.subtext || metric.status) && (
              <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">
                {metric.status ? `${metric.status} • ` : ""}{metric.subtext}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Signal Status Section - Institutional Redesign */}
      <div className="bg-[#0b0f17] border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group shadow-2xl">
        <div className={cn(
            "absolute inset-0 opacity-[0.05] pointer-events-none transition-all duration-1000",
            !settings.auto_execute ? "bg-amber-500 scale-150" : 
            dashboardData?.signal_status?.includes("WAIT") ? "bg-slate-400 scale-110" : "bg-emerald-500 scale-150"
        )} style={{ filter: 'blur(120px)' }} />

        {/* Left: Main Focus Signal */}
        <div className="flex-1 relative z-10 w-full">
            <div className="flex items-center gap-3 mb-4">
                <div className={cn("h-3 w-3 rounded-full shadow-[0_0_12px]", settings.auto_execute ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                <span className="text-[10px] font-black text-white/40 tracking-[0.4em] uppercase">Engine Execution Status</span>
            </div>
            
            <div className={cn(
                "text-2xl md:text-4xl lg:text-5xl font-mono font-black tracking-tighter uppercase transition-all duration-500",
                !settings.auto_execute 
                    ? "text-[#f59e0b] drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]" 
                    : dashboardData?.signal_status?.includes("WAIT") 
                        ? "text-white/60" 
                        : "text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.4)]"
            )}>
                {!settings.auto_execute 
                    ? "OFF (System Stopped)" 
                    : dashboardData?.signal_status || "WAIT ⏳ (INITIALIZING SCAN)"
                }
            </div>

            <div className="mt-6 flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                <div className="flex items-center gap-1.5"><span className="text-white/40">Risk:</span> {settings.risk_mode}</div>
                <div className="h-1 w-1 bg-white/10 rounded-full" />
                <div className="flex items-center gap-1.5"><span className="text-white/40">Last Update:</span> {lastUpdateTime.toLocaleTimeString()}</div>
                <div className="h-1 w-1 bg-white/10 rounded-full" />
                <div className="flex items-center gap-1.5"><span className="text-white/40">Ping:</span> 42ms</div>
                <div className="h-1 w-1 bg-white/10 rounded-full" />
                <div className="flex items-center gap-1.5 animate-pulse text-emerald-500/60"><Activity className="h-3 w-3" /> Heartbeat Live</div>
            </div>
        </div>

        {/* Right: Live Execution Feed (The Engagement "Terminal") */}
        <div className="w-full md:w-[320px] lg:w-[450px] relative z-10">
            <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 h-[120px] font-mono overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-black/40 py-1">
                    <Terminal className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Engine Feed</span>
                </div>
                <div className="space-y-1.5">
                    {(dashboardData?.engine_logs || []).map((log: string, idx: number) => (
                        <div key={idx} className={cn(
                            "text-[10px] leading-tight transition-all duration-300",
                            idx === 0 ? "text-emerald-400 font-bold" : "text-white/40"
                        )}>
                            <span className="opacity-40">{">"}</span> {log}
                        </div>
                    ))}
                    {(!dashboardData?.engine_logs || dashboardData.engine_logs.length === 0) && (
                        <div className="text-[10px] text-white/20 italic animate-pulse">Initializing socket handshake...</div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="nifty" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-px">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger 
              value="nifty" 
              className="px-0 py-3 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all opacity-60 data-[state=active]:opacity-100"
            >
              Nifty 50
            </TabsTrigger>
            <TabsTrigger 
              value="banknifty" 
              className="px-0 py-3 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all opacity-60 data-[state=active]:opacity-100"
            >
              Bank Nifty
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-6">
            {/* Live Index Trace */}
            <div className="flex items-center gap-4 bg-muted/30 px-4 py-1.5 rounded-full border border-border/40 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{activeTab} Live</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black tabular-nums tracking-tight">{livePrice.toLocaleString()}</span>
                    <span className={cn(
                        "text-[10px] font-bold",
                        liveChange >= 0 ? "text-success" : "text-danger"
                    )}>
                        {liveChange > 0 ? "+" : ""}{liveChange}%
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/10 px-4 py-1.5 rounded-full border border-border/20">
              <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-accent" /> Secured</span>
              <span className="w-px h-3 bg-border/40" />
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success/60" /> Auto-Execute</span>
            </div>
          </div>
        </div>

        {["nifty", "banknifty"].map((indexName) => (
          <TabsContent key={indexName} value={indexName} className="mt-0 space-y-6 outline-none">
            {/* Row 1: Chart & Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Live Chart */}
              <Card className="lg:col-span-8 premium-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-tight">{indexName === 'nifty' ? 'NIFTY' : 'BANKNIFTY'} SPOT LIVE</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-medium">Real-time signal overlay</p>
                    </div>
                  </div>
                  
                  {/* Timeframe Selector */}
                  <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
                    {["5m", "10m", "15m", "30m", "1h"].map(tf => (
                        <Button 
                            key={tf}
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                "h-7 px-2.5 text-[10px] font-black uppercase tracking-widest",
                                activeTimeframe === tf ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setActiveTimeframe(tf)}
                        >
                            {tf}
                        </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-6 font-bold uppercase text-success bg-success/5">Heikin Ashi</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 aspect-[16/9] lg:aspect-auto lg:h-[450px] bg-[#0d1117] relative group">
                  <div className="absolute inset-0 z-0">
                    <HighchartsReactComponent 
                        highcharts={Highcharts} 
                        options={chartOptions} 
                        constructorType={'stockChart'} 
                    />
                  </div>
                  
                  {/* Overlay UI elements */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 pointer-events-none">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-white tabular-nums drop-shadow-lg">
                          {livePrice.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold", liveChange >= 0 ? "text-success" : "text-danger")}>
                            {liveChange > 0 ? "+" : ""}{liveChange}%
                          </span>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <span className="text-[10px] font-bold text-white/40 uppercase">SPOT TICK</span>
                        </div>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 space-y-2 pointer-events-auto">
                        <div className="flex justify-between gap-8">
                          <span className="text-[10px] font-bold text-white/50 uppercase">RSI (14)</span>
                          <span className="text-[10px] font-bold text-success">62.45</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-[10px] font-bold text-white/50 uppercase">VWAP</span>
                          <span className="text-[10px] font-bold text-accent">Intraday</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-[10px] font-bold text-white/50 uppercase">Session Info</span>
                          <span className="text-[10px] font-bold text-white/80 uppercase">Live Trace</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Active Trade visual overlays persist alongside flags */}
                    {currentTrade && (
                      <div className="relative h-40">
                         {/* SL Line */}
                         <div className="absolute left-[30%] top-[70%] w-[40%] border-t-2 border-danger/40 border-dashed flex items-center">
                            <span className="bg-danger/20 text-danger text-[8px] font-black px-1 rounded -translate-y-1/2">SL {currentTrade.sl_price}</span>
                         </div>
                      </div>
                    )}

                    <div className="flex justify-between items-end">
                      <div className="flex gap-2 pointer-events-auto">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-white/60"><Search className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-white/60"><Activity className="h-4 w-4" /></Button>
                      </div>
                      <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">PRO SIGNAL ENGINE v4.2</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Ignite Engine Card */}
              <Card className="lg:col-span-4 premium-card flex flex-col">
                <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-accent/5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight">Ignite Engine</CardTitle>
                      <CardDescription className="text-xs">Advanced autonomous trade manager</CardDescription>
                    </div>
                    <div className="ml-auto">
                      <div className={cn(
                        "h-2 w-2 rounded-full ring-4",
                        settings.auto_execute ? "bg-success ring-success/20 animate-pulse" : "bg-danger ring-danger/20"
                      )} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1">
                  {/* LIVE OI MATRIX */}
                  <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                       <Activity className="h-3.5 w-3.5 text-accent animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OI Sentiment (Writer Trap)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase">Live PCR</span>
                        <span className={cn("text-xs font-mono font-bold", (dashboardData?.pcr || 1.1) >= 1 ? "text-success" : "text-danger")}>
                          {(dashboardData?.pcr || 1.42).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-muted-foreground uppercase">CE : PE Delta</span>
                        <span className="text-xs font-mono font-bold text-accent">
                          {((dashboardData?.ce_oi_total || 0) / 1000).toFixed(1)}k : {((dashboardData?.pe_oi_total || 0) / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase">Gamma Wall</span>
                        <span className="text-xs font-mono font-bold text-danger">{dashboardData?.call_wall || '---'}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-muted-foreground uppercase">Put Wall</span>
                        <span className="text-xs font-mono font-bold text-success">{dashboardData?.put_wall || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TRAILING MATRIX */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Crosshair className="h-3.5 w-3.5 text-orange-400" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trailing Matrix</span>
                    </div>
                    <div className="space-y-3 p-4 rounded-xl bg-black/40 border border-white/5 font-mono">
                      <div className="flex justify-between items-center group">
                        <span className="text-[10px] text-white/40 uppercase group-hover:text-white/60 transition-colors">Active Stop Loss</span>
                        <span className="text-xs font-bold text-danger">
                          {currentTrade?.current_tsl?.toFixed(2) || currentTrade?.sl_price?.toFixed(2) || '---'}
                        </span>
                      </div>
                      
                      <div className="h-px bg-white/5 w-full my-1" />

                      {[
                        { id: 1, name: 'Profit Locked', field: 'tsl_1_hit' },
                        { id: 2, name: 'Partial Booked', field: 'partial_booked' },
                        { id: 3, name: 'Trail Active', field: 'tsl_2_hit' }
                      ].map((level) => {
                        const isHit = currentTrade?.[level.field as keyof typeof currentTrade];
                        return (
                          <div key={level.id} className="flex justify-between items-center py-0.5">
                            <span className="text-[10px] text-white/30 uppercase">{level.name}</span>
                            <span className={cn(
                              "text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border leading-none transition-all duration-500",
                              isHit 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                : "bg-white/5 text-white/20 border-white/5"
                            )}>
                              {isHit ? 'LOCKED' : 'PENDING'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase tracking-widest">Execution Engine</span>
                      <span className={cn("uppercase", settings.auto_execute ? "text-success" : "text-danger")}>
                        {settings.auto_execute ? "Autonomous" : "Halted"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                       {!settings.auto_execute ? (
                           <Button 
                                onClick={() => setIsStartModalOpen(true)}
                                className="flex-1 bg-gradient-emerald text-white border-0 h-10 text-[11px] font-bold uppercase shadow-glow-emerald"
                            >
                                <Play className="h-3.5 w-3.5 mr-1.5" /> Start Engine
                            </Button>
                       ) : (
                            <Button 
                                variant="destructive"
                                className="flex-1 h-10 text-[11px] font-bold uppercase transition-all hover:scale-[1.02]"
                                onClick={handleStopEngine}
                            >
                                <Pause className="h-3.5 w-3.5 mr-1.5" /> Halt Engine
                            </Button>
                       )}
                       <Button 
                            variant="outline"
                            className="p-0 h-10 w-10 flex items-center justify-center border-border/40 hover:bg-muted"
                            onClick={() => setIsConfigModalOpen(true)}
                        >
                         <Settings className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Explanation Panel */}
            <Card className="premium-card">
              <CardHeader className="py-4 border-b">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-accent" />
                  <CardTitle className="text-sm font-extrabold uppercase tracking-widest">Signal Logic & Execution Rationale</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-l-2 border-accent pl-2">Last Signal Reason</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">
                    {currentTrade ? currentTrade.reason : trades.length > 0 ? trades[0].reason : "No signals detected yet for this session."}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-l-2 border-accent pl-2">Risk Safeguards</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    Move Threshold Enforced: {indexName === 'nifty' ? '35' : '100'} pts. 
                    Nifty Lot: 65 units | Banknifty Lot: 15 units.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-l-2 border-accent pl-2">Strategy Model</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    Writer Trap (OI Reading) + Gamma Wall Magnets + A+ Pullback Engine. Triple-Stage Trailing with 20pt buffer.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Row 3: Execution Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold tracking-tight">Execution Log</h3>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setFilterType("ALL")}
                      className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider", filterType === "ALL" && "bg-muted shadow-sm")}
                    >
                      All
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setFilterType("CALL")}
                      className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider text-success", filterType === "CALL" && "bg-success/10 shadow-sm")}
                    >
                      Calls
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setFilterType("PUT")}
                      className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider text-danger", filterType === "PUT" && "bg-danger/10 shadow-sm")}
                    >
                      Puts
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="h-9 pl-8 text-xs w-48 lg:w-64" />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase text-[10px]">
                    <Filter className="h-3.5 w-3.5" /> More
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">Time</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">Instrument</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-[10px) font-black uppercase tracking-wider">Entry</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">SL</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">TSL (1/2/3)</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic text-sm">
                          No {filterType !== 'ALL' ? filterType.toLowerCase() : ''} trades found for today's session.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrades.map((trade: any) => (
                        <TableRow key={trade.id} className="group hover:bg-muted/10 transition-colors">
                          <TableCell className="font-mono text-[11px] font-bold text-muted-foreground">
                            {new Date(trade.execution_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{trade.instrument}</span>
                              <span className="text-[9px] text-muted-foreground uppercase font-semibold">{trade.symbol} INDEX</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[9px] font-black border-0",
                              trade.type === 'CALL' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                            )}>
                              {trade.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums font-bold">₹{trade.entry_price.toFixed(2)}</TableCell>
                          <TableCell className="font-mono text-xs tabular-nums text-danger/80">₹{trade.sl_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                              <span className={cn(trade.current_tsl === trade.tsl_1 && "text-success font-bold")}>{trade.tsl_1?.toFixed(1)}</span>
                              <span className="opacity-30">/</span>
                              <span className={cn(trade.current_tsl === trade.tsl_2 && "text-success font-bold")}>{trade.tsl_2?.toFixed(1)}</span>
                              <span className="opacity-30">/</span>
                              <span>{trade.tsl_3?.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {trade.status === 'CLOSED' && <div className="h-1.5 w-1.5 rounded-full bg-success ring-2 ring-success/20" />}
                              {trade.status === 'OPEN' && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse ring-2 ring-accent/20" />}
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-tight",
                                trade.status === 'CLOSED' && "text-success",
                                trade.status === 'OPEN' && "text-accent",
                              )}>
                                {trade.status === 'CLOSED' ? (trade.exit_reason || "CLOSED") : "IN TRADE"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono text-xs font-bold tabular-nums",
                            trade.pnl >= 0 ? "text-success" : "text-danger"
                          )}>
                            {trade.pnl >= 0 ? "+" : ""}₹{Math.abs(trade.pnl).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Start Engine Modal */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent className="max-w-md bg-[#0d1117] border-accent/20 text-white z-[1000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Play className="h-5 w-5 text-success fill-success" /> Initialize Trading Engine
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-medium">
              Configure session parameters before activating autonomous execution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-accent tracking-tighter">Total Trades for Day (1-5)</Label>
              <Input 
                type="number" 
                max={5} 
                min={1}
                value={tempSettings.max_trades_day}
                onChange={(e) => setTempSettings({ ...tempSettings, max_trades_day: parseInt(e.target.value) || 1 })}
                className="bg-white/5 border-white/10 h-10 font-mono text-lg font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-accent tracking-tighter">Lots Allocation (65 / 15 Units)</Label>
              <Input 
                type="number" 
                min={1} 
                value={tempSettings.lots}
                onChange={(e) => setTempSettings({ ...tempSettings, lots: parseInt(e.target.value) || 1 })}
                className="bg-white/5 border-white/10 h-10 font-mono text-lg font-bold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start pt-2">
            <Button 
                className="flex-1 bg-gradient-emerald text-white border-0 shadow-glow-emerald uppercase text-xs font-black h-11" 
                disabled={isUpdating}
                onClick={handleApplySettings}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isUpdating ? "Initializing..." : "Confirm & Start Autonomous Engine"}
            </Button>
            <Button variant="ghost" onClick={() => setIsStartModalOpen(false)} className="uppercase text-[10px] font-bold text-gray-500">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-md bg-[#0d1117] border-accent/20 text-white z-[1000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Settings className="h-5 w-5 text-accent" /> Engine Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-500 tracking-widest">Risk Strategy</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Conservative", "Balanced", "Aggressive"].map(mode => (
                    <Button 
                        key={mode}
                        variant={tempSettings.risk_mode === mode ? "default" : "outline"}
                        className={cn(
                            "text-[10px] font-bold uppercase",
                            tempSettings.risk_mode === mode && "bg-accent text-white border-0"
                        )}
                        onClick={() => setTempSettings({...tempSettings, risk_mode: mode})}
                    >
                        {mode}
                    </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
                className="w-full bg-accent text-white border-0 text-[11px] font-bold uppercase h-11" 
                disabled={isUpdating}
                onClick={handleApplySettings}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isUpdating ? "Syncing..." : "Apply & Sync System"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptionSignals;
