import type { IgniteSettings, PaperTrade, RiskMode } from "./types";

const COOLDOWN_MS: Record<RiskMode, number> = {
  Conservative: 5 * 60_000,
  Balanced: 2 * 60_000,
  Aggressive: 45_000,
};

const MAX_DAILY_LOSS: Record<RiskMode, number> = {
  Conservative: -150,
  Balanced: -250,
  Aggressive: -400,
};

export const riskManager = {
  cooldownMs(mode: RiskMode) {
    return COOLDOWN_MS[mode];
  },

  canOpenTrade(opts: {
    symbol: PaperTrade["symbol"];
    settings: IgniteSettings;
    activeTrades: PaperTrade[];
    todayTrades: PaperTrade[];
    todayPnl: number;
  }): { ok: boolean; reason?: string } {
    const { symbol, settings, activeTrades, todayTrades, todayPnl } = opts;
    if (activeTrades.some((t) => t.symbol === symbol)) {
      return { ok: false, reason: `Active trade exists for ${symbol}` };
    }
    const sameSymbolToday = todayTrades.filter((t) => t.symbol === symbol).length;
    if (sameSymbolToday >= settings.trades) {
      return { ok: false, reason: `Daily trade limit reached for ${symbol}` };
    }
    if (todayPnl <= MAX_DAILY_LOSS[settings.riskMode]) {
      return { ok: false, reason: `Daily loss cap (${MAX_DAILY_LOSS[settings.riskMode]}) reached` };
    }
    const lastForSymbol = todayTrades
      .filter((t) => t.symbol === symbol && t.exitTime)
      .sort((a, b) => (b.exitTime ?? 0) - (a.exitTime ?? 0))[0];
    if (lastForSymbol?.exitTime && Date.now() - lastForSymbol.exitTime < COOLDOWN_MS[settings.riskMode]) {
      return { ok: false, reason: "Cooldown active" };
    }
    return { ok: true };
  },
};