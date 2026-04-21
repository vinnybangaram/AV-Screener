// Builds confidence-scored CALL/PUT signals from a market snapshot.
import type { MarketSnapshot, RiskMode, SignalResult } from "./types";

const RISK_THRESHOLD: Record<RiskMode, number> = {
  Conservative: 75,
  Balanced: 60,
  Aggressive: 48,
};

interface Check {
  pass: boolean;
  weight: number;
  reason: string;
  bias: 1 | -1; // 1 = bullish, -1 = bearish
}

function evaluate(snap: MarketSnapshot): Check[] {
  const { ltp, indicators: ind } = snap;
  return [
    {
      pass: ltp > ind.resistance * 0.999,
      weight: 18,
      reason: "Breakout above intraday resistance",
      bias: 1,
    },
    {
      pass: ltp < ind.support * 1.001,
      weight: 18,
      reason: "Breakdown below intraday support",
      bias: -1,
    },
    {
      pass: ind.rsi > 58 && ind.rsi < 75,
      weight: 12,
      reason: `RSI ${ind.rsi.toFixed(0)} confirms bullish momentum`,
      bias: 1,
    },
    {
      pass: ind.rsi < 42 && ind.rsi > 25,
      weight: 12,
      reason: `RSI ${ind.rsi.toFixed(0)} confirms bearish momentum`,
      bias: -1,
    },
    {
      pass: ind.ema9 > ind.ema21 && ind.ema21 > ind.ema50,
      weight: 14,
      reason: "EMA 9 > 21 > 50 trend alignment",
      bias: 1,
    },
    {
      pass: ind.ema9 < ind.ema21 && ind.ema21 < ind.ema50,
      weight: 14,
      reason: "EMA 9 < 21 < 50 bearish stack",
      bias: -1,
    },
    {
      pass: ind.volSpike > 1.4,
      weight: 10,
      reason: `Volume spike ${ind.volSpike.toFixed(1)}× average`,
      bias: ltp >= ind.vwap ? 1 : -1,
    },
    {
      pass: ind.candleStrength > 0.55,
      weight: 8,
      reason: "Strong bullish candle body",
      bias: 1,
    },
    {
      pass: ind.candleStrength < -0.55,
      weight: 8,
      reason: "Strong bearish candle body",
      bias: -1,
    },
    {
      pass: ltp > ind.vwap && ltp < ind.ema9 * 1.002 && ind.ema9 > ind.ema21,
      weight: 9,
      reason: "Pullback to EMA9 in uptrend",
      bias: 1,
    },
    {
      pass: ltp < ind.vwap && ltp > ind.ema9 * 0.998 && ind.ema9 < ind.ema21,
      weight: 9,
      reason: "Pullback to EMA9 in downtrend",
      bias: -1,
    },
    {
      pass: ind.atr / ltp > 0.0025,
      weight: 6,
      reason: "Volatility expansion (ATR widening)",
      bias: ind.candleStrength >= 0 ? 1 : -1,
    },
  ];
}

export const signalEngine = {
  threshold(mode: RiskMode) {
    return RISK_THRESHOLD[mode];
  },

  scan(snap: MarketSnapshot, riskMode: RiskMode): SignalResult | null {
    const checks = evaluate(snap);
    const passed = checks.filter((c) => c.pass);
    if (!passed.length) return null;

    const bull = passed.filter((c) => c.bias === 1).reduce((s, c) => s + c.weight, 0);
    const bear = passed.filter((c) => c.bias === -1).reduce((s, c) => s + c.weight, 0);
    const direction = bull >= bear ? "CALL" : "PUT";
    const confidenceScore = Math.min(100, Math.round(Math.max(bull, bear) * 1.05));
    const threshold = RISK_THRESHOLD[riskMode];
    if (confidenceScore < threshold) return null;

    const reasons = passed
      .filter((c) => c.bias === (direction === "CALL" ? 1 : -1))
      .map((c) => c.reason);
    if (!reasons.length) return null;

    const atr = snap.indicators.atr || snap.ltp * 0.002;
    const entryPrice = +snap.ltp.toFixed(2);
    if (direction === "CALL") {
      return {
        symbol: snap.symbol,
        direction,
        confidenceScore,
        reasons,
        entryPrice,
        sl: +(entryPrice - atr * 1.4).toFixed(2),
        tsl1: +(entryPrice + atr * 1.0).toFixed(2),
        tsl2: +(entryPrice + atr * 2.0).toFixed(2),
        tsl3: +(entryPrice + atr * 3.2).toFixed(2),
      };
    }
    return {
      symbol: snap.symbol,
      direction,
      confidenceScore,
      reasons,
      entryPrice,
      sl: +(entryPrice + atr * 1.4).toFixed(2),
      tsl1: +(entryPrice - atr * 1.0).toFixed(2),
      tsl2: +(entryPrice - atr * 2.0).toFixed(2),
      tsl3: +(entryPrice - atr * 3.2).toFixed(2),
    };
  },
};