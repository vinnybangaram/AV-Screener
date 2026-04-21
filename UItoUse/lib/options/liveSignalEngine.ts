// Derives a real-time market-state signal for the Live Signals Panel.
// Reads market snapshot + active trade + cooldown info and returns the
// highest-priority status with sub-metrics. Pure function — easy to test.
import type {
  Direction,
  IndexSymbol,
  MarketSnapshot,
  PaperTrade,
  RiskMode,
} from "./types";
import { signalEngine } from "./signalEngine";

export type LiveSignalStatus =
  | "Weak"
  | "Low Momentum"
  | "Level Up"
  | "Waiting"
  | "Waiting for Retest"
  | "Almost Done"
  | "Breakout Ready"
  | "Strong Momentum"
  | "Reversal Watch"
  | "Entry Triggered"
  | "Trade Active"
  | "Cooldown";

export type LiveSignalTone = "green" | "yellow" | "orange" | "blue" | "red" | "muted";

export interface LiveSignalState {
  symbol: IndexSymbol;
  status: LiveSignalStatus;
  tone: LiveSignalTone;
  description: string;
  confidence: number;       // 0..100
  momentum: number;         // -100..100
  trend: "Up" | "Down" | "Flat";
  risk: "Low" | "Medium" | "High";
  direction: Direction | null;
  lastChangedAt: number;
}

interface BuildOpts {
  snapshot: MarketSnapshot;
  riskMode: RiskMode;
  activeTrade?: PaperTrade;
  cooldownActive?: boolean;
  justOpenedAt?: number;     // ms epoch — used for "Entry Triggered" pulse
}

const TONE: Record<LiveSignalStatus, LiveSignalTone> = {
  "Weak": "orange",
  "Low Momentum": "orange",
  "Level Up": "blue",
  "Waiting": "muted",
  "Waiting for Retest": "blue",
  "Almost Done": "yellow",
  "Breakout Ready": "green",
  "Strong Momentum": "green",
  "Reversal Watch": "red",
  "Entry Triggered": "green",
  "Trade Active": "green",
  "Cooldown": "yellow",
};

const PRIORITY: LiveSignalStatus[] = [
  "Entry Triggered",
  "Trade Active",
  "Breakout Ready",
  "Strong Momentum",
  "Reversal Watch",
  "Almost Done",
  "Waiting for Retest",
  "Level Up",
  "Cooldown",
  "Low Momentum",
  "Weak",
  "Waiting",
];

const DESCRIPTION: Record<LiveSignalStatus, string> = {
  "Weak": "No clear direction. Engine is staying flat.",
  "Low Momentum": "Trend exists but conviction is low.",
  "Level Up": "Price approaching a key intraday level.",
  "Waiting": "Scanning the tape for a valid setup.",
  "Waiting for Retest": "Breakout printed — waiting for a clean retest.",
  "Almost Done": "Conditions almost aligned. Trade may trigger soon.",
  "Breakout Ready": "All filters aligned — high-alert state.",
  "Strong Momentum": "Trend strong, continuation likely.",
  "Reversal Watch": "Possible trend reversal forming.",
  "Entry Triggered": "Trade just executed by the engine.",
  "Trade Active": "Trade is live — managing SL & trailing stops.",
  "Cooldown": "Engine is cooling down before the next entry.",
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Pick the higher-priority status when two co-exist
function pickHighest(...statuses: LiveSignalStatus[]): LiveSignalStatus {
  for (const p of PRIORITY) if (statuses.includes(p)) return p;
  return "Waiting";
}

export const liveSignalEngine = {
  build({ snapshot, riskMode, activeTrade, cooldownActive, justOpenedAt }: BuildOpts): LiveSignalState {
    const { ltp, indicators: ind } = snapshot;
    const threshold = signalEngine.threshold(riskMode);
    const candidate = signalEngine.scan(snapshot, riskMode);
    const now = Date.now();

    // -------- momentum & trend math --------
    const trendStack = ind.ema9 - ind.ema21;
    const trendStrong = ind.ema9 > ind.ema21 && ind.ema21 > ind.ema50;
    const trendBearStack = ind.ema9 < ind.ema21 && ind.ema21 < ind.ema50;
    const trend: LiveSignalState["trend"] =
      trendStrong ? "Up" : trendBearStack ? "Down" : "Flat";

    // momentum score: blend RSI, candle, vwap diff, ema slope
    const rsiBias = (ind.rsi - 50) * 1.4;       // -70..70
    const vwapBias = ((ltp - ind.vwap) / ind.vwap) * 6000; // small index swings
    const stackBias = (trendStack / ltp) * 8000;
    const candleBias = ind.candleStrength * 30;
    const momentumRaw = rsiBias + vwapBias + stackBias + candleBias;
    const momentum = Math.round(clamp(momentumRaw, -100, 100));

    // confidence: candidate score if any, else proportional to momentum strength
    const confidence = candidate
      ? candidate.confidenceScore
      : Math.round(clamp(Math.abs(momentum) * 0.8, 0, threshold - 1));

    // proximity to support/resistance (in ATR units)
    const atr = ind.atr || ltp * 0.002;
    const distToRes = (ind.resistance - ltp) / atr;
    const distToSup = (ltp - ind.support) / atr;
    const nearLevel = Math.min(distToRes, distToSup) < 0.6;
    const brokeRes = ltp > ind.resistance * 0.999;
    const brokeSup = ltp < ind.support * 1.001;
    const volSpike = ind.volSpike > 1.4;

    // risk level — wider ATR + low confidence = higher risk
    const atrPct = atr / ltp;
    const risk: LiveSignalState["risk"] =
      atrPct > 0.0035 || confidence < 40 ? "High"
      : atrPct > 0.0022 ? "Medium"
      : "Low";

    // direction guess for the panel
    let direction: Direction | null = candidate?.direction ?? null;
    if (!direction) {
      if (momentum > 18) direction = "CALL";
      else if (momentum < -18) direction = "PUT";
    }

    // -------- decide status --------
    // 1) Trade lifecycle states beat everything else
    if (justOpenedAt && now - justOpenedAt < 6000) {
      return finalize("Entry Triggered", { confidence: 100, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if (activeTrade && activeTrade.status === "OPEN") {
      return finalize("Trade Active", {
        confidence: Math.max(confidence, activeTrade.confidenceScore),
        momentum,
        trend,
        risk,
        direction: activeTrade.direction,
        snapshotTs: snapshot.ts,
        symbol: snapshot.symbol,
      });
    }
    if (cooldownActive) {
      return finalize("Cooldown", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }

    // 2) Reversal — strong momentum opposite to trend
    if ((trend === "Up" && momentum < -45) || (trend === "Down" && momentum > 45)) {
      return finalize("Reversal Watch", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }

    // 3) Breakout / retest family
    if (candidate && candidate.confidenceScore >= threshold) {
      return finalize("Breakout Ready", { confidence: candidate.confidenceScore, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if ((brokeRes || brokeSup) && !volSpike) {
      return finalize("Waiting for Retest", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if (confidence >= threshold - 10 && confidence < threshold) {
      return finalize("Almost Done", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if (nearLevel) {
      return finalize("Level Up", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }

    // 4) Momentum scaling
    if (Math.abs(momentum) > 55 && trend !== "Flat") {
      return finalize("Strong Momentum", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if (Math.abs(momentum) > 25) {
      return finalize("Low Momentum", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    if (Math.abs(momentum) < 10 && trend === "Flat") {
      return finalize("Weak", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
    }
    return finalize("Waiting", { confidence, momentum, trend, risk, direction, snapshotTs: snapshot.ts, symbol: snapshot.symbol });
  },

  // priority resolver exposed for tests / advanced callers
  pickHighest,
};

function finalize(
  status: LiveSignalStatus,
  partial: Omit<LiveSignalState, "status" | "tone" | "description" | "lastChangedAt"> & { snapshotTs: number },
): LiveSignalState {
  return {
    status,
    tone: TONE[status],
    description: DESCRIPTION[status],
    confidence: clamp(Math.round(partial.confidence), 0, 100),
    momentum: partial.momentum,
    trend: partial.trend,
    risk: partial.risk,
    direction: partial.direction,
    symbol: partial.symbol,
    lastChangedAt: partial.snapshotTs,
  };
}
