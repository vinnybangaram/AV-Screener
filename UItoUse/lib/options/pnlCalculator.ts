import type { DailyStats, PaperTrade } from "./types";

export const pnlCalculator = {
  computeTrade(trade: PaperTrade, ltp: number) {
    const move = trade.direction === "CALL" ? ltp - trade.entry : trade.entry - ltp;
    const pnl = +(move * 1).toFixed(2); // 1 lot proxy
    const pnlPct = +((move / trade.entry) * 100).toFixed(2);
    return { pnl, pnlPct, currentPrice: +ltp.toFixed(2) };
  },

  buildDaily(trades: PaperTrade[]): DailyStats {
    const date = new Date().toISOString().slice(0, 10);
    const closed = trades.filter((t) => t.status === "EXIT");
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl <= 0);
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    return {
      date,
      totalPnl: +totalPnl.toFixed(2),
      wins: wins.length,
      losses: losses.length,
      trades: closed.length,
      avgGain: wins.length ? +(wins.reduce((s, t) => s + t.pnl, 0) / wins.length).toFixed(2) : 0,
      avgLoss: losses.length
        ? +(losses.reduce((s, t) => s + t.pnl, 0) / losses.length).toFixed(2)
        : 0,
    };
  },

  todayKey() {
    return new Date().toISOString().slice(0, 10);
  },
};