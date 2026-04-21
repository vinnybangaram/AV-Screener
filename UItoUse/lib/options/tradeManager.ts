// Opens, manages, trails and exits paper trades.
import { pnlCalculator } from "./pnlCalculator";
import { scheduler } from "./scheduler";
import type { ExitReason, MarketSnapshot, PaperTrade, SignalResult } from "./types";

function uid() {
  return `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const tradeManager = {
  open(signal: SignalResult): PaperTrade {
    const reason = `${signal.direction} executed: ${signal.reasons.slice(0, 2).join(" • ")}`;
    return {
      id: uid(),
      symbol: signal.symbol,
      direction: signal.direction,
      status: "OPEN",
      executionTime: Date.now(),
      entry: signal.entryPrice,
      sl: signal.sl,
      tsl1: signal.tsl1,
      tsl2: signal.tsl2,
      tsl3: signal.tsl3,
      currentSL: signal.sl,
      tslStage: 0,
      currentPrice: signal.entryPrice,
      pnl: 0,
      pnlPct: 0,
      reason,
      confidenceScore: signal.confidenceScore,
    };
  },

  /** Returns updated trade and (optional) exit reason. */
  manage(trade: PaperTrade, snap: MarketSnapshot, opposite: boolean): PaperTrade {
    if (trade.status === "EXIT") return trade;
    const ltp = snap.ltp;
    const { pnl, pnlPct, currentPrice } = pnlCalculator.computeTrade(trade, ltp);
    const next: PaperTrade = { ...trade, pnl, pnlPct, currentPrice };

    // Trail stages
    if (next.direction === "CALL") {
      if (next.tslStage < 1 && ltp >= next.tsl1) {
        next.currentSL = next.entry; // breakeven
        next.tslStage = 1;
      }
      if (next.tslStage < 2 && ltp >= next.tsl2) {
        next.currentSL = next.tsl1;
        next.tslStage = 2;
      }
      if (next.tslStage < 3 && ltp >= next.tsl3) {
        next.currentSL = next.tsl2;
        next.tslStage = 3;
      }
    } else {
      if (next.tslStage < 1 && ltp <= next.tsl1) {
        next.currentSL = next.entry;
        next.tslStage = 1;
      }
      if (next.tslStage < 2 && ltp <= next.tsl2) {
        next.currentSL = next.tsl1;
        next.tslStage = 2;
      }
      if (next.tslStage < 3 && ltp <= next.tsl3) {
        next.currentSL = next.tsl2;
        next.tslStage = 3;
      }
    }

    // Exit checks
    let exitReason: ExitReason | undefined;
    const slHit =
      next.direction === "CALL" ? ltp <= next.currentSL : ltp >= next.currentSL;
    if (slHit) {
      exitReason = next.tslStage > 0 ? "TSL Locked" : "SL Hit";
    } else if (opposite) {
      exitReason = "Reversal Signal";
    } else if (Date.now() - next.executionTime > scheduler.maxHoldingMs()) {
      exitReason = "Max Holding";
    } else if (scheduler.isSessionEndingSoon()) {
      exitReason = "Session End";
    }

    if (exitReason) {
      next.status = "EXIT";
      next.exitTime = Date.now();
      next.exitReason = exitReason;
    }
    return next;
  },

  forceExit(trade: PaperTrade, reason: ExitReason = "Manual Stop"): PaperTrade {
    if (trade.status === "EXIT") return trade;
    return { ...trade, status: "EXIT", exitTime: Date.now(), exitReason: reason };
  },
};