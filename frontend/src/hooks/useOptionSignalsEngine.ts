import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  fetchOptionSignalsDashboard, 
  fetchOptionSignalsSettings, 
  updateOptionSignalsSettings,
  forceOptionSignalsSync
} from "@/services/api";
import { useAuthUser } from "@/lib/auth-store";
import { pnlCalculator } from "@/lib/options/pnlCalculator";
import { scheduler } from "@/lib/options/scheduler";
import { liveSignalEngine, type LiveSignalState } from "@/lib/options/liveSignalEngine";
import type { ExitReason, IgniteSettings, IndexSymbol, PaperTrade, DailyStats } from "@/lib/options/types";
import { toast } from "sonner";

const TICK_MS = 2000;

export function useOptionSignalsEngine() {
  const user = useAuthUser();
  const [settings, setSettings] = useState<IgniteSettings>({
    slots: 1,
    trades: 5,
    riskMode: "Balanced",
    enabled: false,
    symbols: ["NIFTY", "BANKNIFTY"]
  });
  
  const [active, setActive] = useState<PaperTrade[]>([]);
  const [history, setHistory] = useState<PaperTrade[]>([]);
  const [marketOpen, setMarketOpen] = useState<boolean>(scheduler.isMarketOpen());
  const [livePrices, setLivePrices] = useState<Record<IndexSymbol, number>>({
    NIFTY: 0,
    BANKNIFTY: 0,
  });
  
  const [dashboardRaw, setDashboardRaw] = useState<any>(null);
  const [liveSignals, setLiveSignals] = useState<Record<IndexSymbol, LiveSignalState | null>>({
    NIFTY: null,
    BANKNIFTY: null,
  });

  const [loading, setLoading] = useState(true);

  // Sync settings and dashboard on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [dashRes, settingsRes] = await Promise.all([
          fetchOptionSignalsDashboard(user?.id),
          fetchOptionSignalsSettings(user?.id)
        ]);
        
        setDashboardRaw(dashRes);
        // Map backend snake_case to frontend camelCase
        setSettings({
            slots: settingsRes.lots || 1,
            trades: settingsRes.max_trades_day || 5,
            riskMode: settingsRes.risk_mode || "Balanced",
            enabled: settingsRes.auto_execute || false,
            symbols: ["NIFTY", "BANKNIFTY"]
        });
      } catch (err) {
        console.error("OptionSignals init error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) init();
  }, [user?.id]);

  const tick = useCallback(async () => {
    try {
      const dashRes = await fetchOptionSignalsDashboard(user?.id);
      setDashboardRaw(dashRes);
      setMarketOpen(scheduler.isMarketOpen());
      
      const newPrices: Record<IndexSymbol, number> = {
        NIFTY: dashRes.nifty_live?.value || 0,
        BANKNIFTY: dashRes.banknifty_live?.value || 0
      };
      setLivePrices(newPrices);

      // Map trades
      const allTrades: any[] = dashRes.trades || [];
      const activeTrades: PaperTrade[] = allTrades
        .filter((t: any) => t.status === "OPEN")
        .map(mapBackendTrade);
      
      const historyTrades: PaperTrade[] = allTrades
        .filter((t: any) => t.status === "CLOSED")
        .map(mapBackendTrade);
      
      setActive(activeTrades);
      setHistory(historyTrades);

      // Build live signals from dashboard status
      const signalsNext: Record<IndexSymbol, LiveSignalState | null> = { NIFTY: null, BANKNIFTY: null };
      
      (["NIFTY", "BANKNIFTY"] as const).forEach(sym => {
          const activeTrade = activeTrades.find(t => t.symbol === sym);
          const status = dashRes.signal_status || "WAITING";
          const isScanning = status.includes("WAIT") || status.includes("SCAN");
          
          signalsNext[sym] = {
              symbol: sym,
              status: activeTrade ? "Trade Active" : isScanning ? "Waiting" : "Breakout Ready",
              tone: activeTrade ? "green" : isScanning ? "muted" : "blue",
              description: activeTrade ? `Managing ${activeTrade.direction} position.` : `Engine monitoring index for ${sym} setups.`,
              confidence: activeTrade ? activeTrade.confidenceScore : 85,
              momentum: sym === "NIFTY" ? (dashRes.nifty_live?.change_pct * 100 || 0) : (dashRes.banknifty_live?.change_pct * 100 || 0),
              trend: (dashRes.nifty_live?.change_pct || 0) >= 0 ? "Up" : "Down",
              risk: settings.riskMode === "Conservative" ? "Low" : settings.riskMode === "Balanced" ? "Medium" : "High",
              direction: activeTrade?.direction || null,
              lastChangedAt: Date.now()
          };
      });
      setLiveSignals(signalsNext);

    } catch (err) {
      console.error("OptionSignals polling error:", err);
    }
  }, [user?.id, settings.riskMode]);

  // Polling loop
  useEffect(() => {
    if (!user?.id) return;
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [user?.id, tick]);

  const updateSettings = useCallback(async (patch: Partial<IgniteSettings>) => {
    try {
        const newSettings = { ...settings, ...patch };
        setSettings(newSettings); // Optimistically update
        
        // Map back to backend format
        const backendSettings = {
            lots: newSettings.slots,
            max_trades_day: newSettings.trades,
            risk_mode: newSettings.riskMode,
            auto_execute: newSettings.enabled
        };
        
        await updateOptionSignalsSettings(backendSettings, user?.id);
        toast.success("Engine settings synchronized");
    } catch (err) {
        toast.error("Failed to sync settings");
    }
  }, [user?.id, settings]);

  const stopAll = useCallback(async () => {
    try {
        await updateOptionSignalsSettings({ ...settings, auto_execute: false }, user?.id);
        setSettings(s => ({ ...s, enabled: false }));
        toast.success("Engine halted");
    } catch (err) {
        toast.error("Stop command failed");
    }
  }, [user?.id, settings]);

  const clearHistory = useCallback(() => {
    // This might not be supported by backend but we can clear local state or call a specific reset if exists
    setHistory([]);
    toast.info("History cleared (Local)");
  }, []);

  const runningPnl = dashboardRaw?.today_pnl || 0;
  const winRate = dashboardRaw?.win_rate || 0;
  
  const dailyStats: DailyStats = {
      date: new Date().toISOString().split('T')[0],
      totalPnl: runningPnl,
      wins: dashboardRaw?.trades?.filter((t: any) => t.status === 'CLOSED' && t.pnl > 0).length || 0,
      losses: dashboardRaw?.trades?.filter((t: any) => t.status === 'CLOSED' && t.pnl <= 0).length || 0,
      trades: dashboardRaw?.trades?.filter((t: any) => t.status === 'CLOSED').length || 0,
      avgGain: 0,
      avgLoss: 0
  };

  return {
    settings,
    updateSettings,
    active,
    history,
    livePrices,
    marketOpen,
    dailyStats,
    runningPnl,
    winRate,
    stopAll,
    clearHistory,
    liveSignals,
    loading
  };
}

function mapBackendTrade(t: any): PaperTrade {
    return {
        id: String(t.id),
        symbol: (t.symbol || "NIFTY").toUpperCase() as any,
        direction: (t.type || "CALL").toUpperCase() as any,
        status: t.status === "OPEN" ? "OPEN" : "EXIT",
        executionTime: new Date(t.execution_time).getTime(),
        exitTime: t.exit_time ? new Date(t.exit_time).getTime() : undefined,
        entry: t.entry_price || 0,
        sl: t.sl_price || 0,
        tsl1: t.tsl_1 || 0,
        tsl2: t.tsl_2 || 0,
        tsl3: t.tsl_3 || 0,
        currentSL: t.current_tsl || t.sl_price || 0,
        tslStage: t.current_tsl === t.tsl_3 ? 3 : t.current_tsl === t.tsl_2 ? 2 : t.current_tsl === t.tsl_1 ? 1 : 0,
        currentPrice: t.current_price || t.entry_price || 0,
        pnl: t.pnl || 0,
        pnlPct: t.pnl_pct || 0, 
        pnlPts: t.pnl_pts || 0,
        lots: t.lots || 1,
        reason: t.reason || "Executed by AI",
        exitReason: (t.exit_reason || "Target Met") as any,
        confidenceScore: 85 
    };
}
