import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { marketDataService } from "@/lib/options/marketDataService";
import { pnlCalculator } from "@/lib/options/pnlCalculator";
import { riskManager } from "@/lib/options/riskManager";
import { scheduler } from "@/lib/options/scheduler";
import { signalEngine } from "@/lib/options/signalEngine";
import { storageService } from "@/lib/options/storageService";
import { tradeManager } from "@/lib/options/tradeManager";
import { liveSignalEngine, type LiveSignalState } from "@/lib/options/liveSignalEngine";
import type { ExitReason, IgniteSettings, IndexSymbol, MarketSnapshot, PaperTrade } from "@/lib/options/types";

const TICK_MS = 2500;

function todayKey() {
  return pnlCalculator.todayKey();
}

export function useOptionSignalsEngine() {
  const [settings, setSettings] = useState<IgniteSettings>(() => storageService.loadSettings());
  const [active, setActive] = useState<PaperTrade[]>(() => storageService.loadActive());
  const [history, setHistory] = useState<PaperTrade[]>(() => storageService.loadHistory());
  const [marketOpen, setMarketOpen] = useState<boolean>(scheduler.isMarketOpen());
  const [livePrices, setLivePrices] = useState<Record<IndexSymbol, number>>({
    NIFTY: marketDataService.getLivePrice("NIFTY"),
    BANKNIFTY: marketDataService.getLivePrice("BANKNIFTY"),
  });
  const [liveSignals, setLiveSignals] = useState<Record<IndexSymbol, LiveSignalState | null>>({
    NIFTY: null,
    BANKNIFTY: null,
  });
  const justOpenedRef = useRef<Record<IndexSymbol, number | undefined>>({ NIFTY: undefined, BANKNIFTY: undefined });

  const activeRef = useRef(active);
  const historyRef = useRef(history);
  const settingsRef = useRef(settings);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Persist mutations
  useEffect(() => storageService.saveSettings(settings), [settings]);
  useEffect(() => storageService.saveActive(active), [active]);
  useEffect(() => storageService.saveHistory(history), [history]);

  const tick = useCallback(() => {
    const open = scheduler.isMarketOpen();
    setMarketOpen(open);
    const cfg = settingsRef.current;
    const symbols: IndexSymbol[] = cfg.symbols;
    const newPrices: Record<IndexSymbol, number> = { ...livePrices };

    let nextActive = [...activeRef.current];
    let nextHistory = [...historyRef.current];
    const snapshots: Partial<Record<IndexSymbol, MarketSnapshot>> = {};

    for (const sym of symbols) {
      const snap = marketDataService.snapshot(sym);
      snapshots[sym] = snap;
      newPrices[sym] = +snap.ltp.toFixed(2);

      // Manage existing trades for this symbol
      const idx = nextActive.findIndex((t) => t.symbol === sym && t.status === "OPEN");
      let candidate = cfg.enabled && open ? signalEngine.scan(snap, cfg.riskMode) : null;

      if (idx >= 0) {
        const opposite =
          !!candidate && candidate.direction !== nextActive[idx].direction;
        const updated = tradeManager.manage(nextActive[idx], snap, opposite);
        if (updated.status === "EXIT") {
          nextHistory = [updated, ...nextHistory].slice(0, 200);
          nextActive = nextActive.filter((t) => t.id !== updated.id);
        } else {
          nextActive[idx] = updated;
        }
        continue;
      }

      // No active trade — try to open if engine is on
      if (!cfg.enabled || !open || !candidate) continue;

      const todayTrades = nextHistory.filter(
        (t) => new Date(t.executionTime).toISOString().slice(0, 10) === todayKey(),
      );
      const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
      const allowed = riskManager.canOpenTrade({
        symbol: sym,
        settings: cfg,
        activeTrades: nextActive,
        todayTrades,
        todayPnl,
      });
      if (!allowed.ok) continue;

      const newTrade = tradeManager.open(candidate);
      nextActive = [newTrade, ...nextActive];
      justOpenedRef.current[sym] = Date.now();
      // Respect slot capacity (across both indices)
      if (nextActive.length > cfg.slots) {
        nextActive = nextActive.slice(0, cfg.slots);
      }
    }

    setLivePrices(newPrices);
    setActive(nextActive);
    setHistory(nextHistory);

    // ---- Build live-signal state per symbol (priority-resolved) ----
    const signalsNext: Record<IndexSymbol, LiveSignalState | null> = { NIFTY: null, BANKNIFTY: null };
    for (const sym of symbols) {
      const snap = snapshots[sym];
      if (!snap) continue;
      const activeTrade = nextActive.find((t) => t.symbol === sym && t.status === "OPEN");
      // Cooldown: most recent exit for this symbol within the risk-mode cooldown window
      const lastExit = nextHistory
        .filter((t) => t.symbol === sym && t.exitTime)
        .sort((a, b) => (b.exitTime ?? 0) - (a.exitTime ?? 0))[0];
      const cooldownActive = !!lastExit?.exitTime && Date.now() - lastExit.exitTime < riskManager.cooldownMs(cfg.riskMode);
      signalsNext[sym] = liveSignalEngine.build({
        snapshot: snap,
        riskMode: cfg.riskMode,
        activeTrade,
        cooldownActive,
        justOpenedAt: justOpenedRef.current[sym],
      });
    }
    setLiveSignals(signalsNext);
  }, [livePrices]);

  // Polling loop
  useEffect(() => {
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = useCallback((patch: Partial<IgniteSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const stopAll = useCallback((reason: ExitReason = "Manual Stop") => {
    const exited = activeRef.current.map((t) => tradeManager.forceExit(t, reason));
    setHistory((h) => [...exited, ...h].slice(0, 200));
    setActive([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    storageService.saveHistory([]);
  }, []);

  const todayHistory = useMemo(
    () =>
      history.filter(
        (t) => new Date(t.executionTime).toISOString().slice(0, 10) === todayKey(),
      ),
    [history],
  );

  const dailyStats = useMemo(() => pnlCalculator.buildDaily(todayHistory), [todayHistory]);
  const runningPnl = useMemo(
    () => active.reduce((s, t) => s + t.pnl, 0) + dailyStats.totalPnl,
    [active, dailyStats.totalPnl],
  );
  const winRate = dailyStats.trades
    ? Math.round((dailyStats.wins / dailyStats.trades) * 100)
    : 0;

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
  };
}