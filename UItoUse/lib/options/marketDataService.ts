// Mock market data feed — produces realistic Nifty/Banknifty candles + indicators.
// Adapter shape lets us swap in a real broker API later.
import type { Candle, IndexSymbol, Indicators, MarketSnapshot } from "./types";

interface SymbolState {
  base: number;
  drift: number;
  vol: number;
  candles: Candle[];
  lastTickTs: number;
}

const STATE: Record<IndexSymbol, SymbolState> = {
  NIFTY: { base: 24300, drift: 0, vol: 0.0009, candles: [], lastTickTs: 0 },
  BANKNIFTY: { base: 52100, drift: 0, vol: 0.0012, candles: [], lastTickTs: 0 },
};

const CANDLE_MS = 60_000; // 1-minute candles
const MAX_CANDLES = 120;

function seedCandles(symbol: IndexSymbol) {
  const s = STATE[symbol];
  if (s.candles.length) return;
  let price = s.base;
  const now = Date.now();
  for (let i = MAX_CANDLES; i > 0; i--) {
    const t = now - i * CANDLE_MS;
    const o = price;
    const move = (Math.random() - 0.5) * s.vol * price * 4;
    const c = +(o + move).toFixed(2);
    const h = +Math.max(o, c, o + Math.random() * s.vol * price * 2).toFixed(2);
    const l = +Math.min(o, c, o - Math.random() * s.vol * price * 2).toFixed(2);
    const v = Math.round(80_000 + Math.random() * 60_000);
    s.candles.push({ t, o, h, l, c, v });
    price = c;
  }
  s.base = price;
}

function tick(symbol: IndexSymbol) {
  const s = STATE[symbol];
  seedCandles(symbol);
  const now = Date.now();
  const last = s.candles[s.candles.length - 1];
  // micro drift adds trend phases
  s.drift = s.drift * 0.92 + (Math.random() - 0.5) * 0.4;
  const move = (Math.random() - 0.5 + s.drift * 0.15) * s.vol * s.base * 1.5;
  const newPrice = +(last.c + move).toFixed(2);
  if (now - last.t >= CANDLE_MS) {
    s.candles.push({
      t: last.t + CANDLE_MS,
      o: last.c,
      h: Math.max(last.c, newPrice),
      l: Math.min(last.c, newPrice),
      c: newPrice,
      v: Math.round(80_000 + Math.random() * 60_000),
    });
    if (s.candles.length > MAX_CANDLES) s.candles.shift();
  } else {
    last.c = newPrice;
    last.h = Math.max(last.h, newPrice);
    last.l = Math.min(last.l, newPrice);
    last.v += Math.round(800 + Math.random() * 1200);
  }
  s.base = newPrice;
  s.lastTickTs = now;
  return newPrice;
}

// ----------- indicators -----------
function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function atr(candles: Candle[], period = 14) {
  if (candles.length < period + 1) return 0;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const prev = candles[i - 1].c;
    const tr = Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - prev),
      Math.abs(candles[i].l - prev),
    );
    sum += tr;
  }
  return sum / period;
}

function vwap(candles: Candle[]) {
  let pv = 0;
  let v = 0;
  for (const c of candles.slice(-30)) {
    const tp = (c.h + c.l + c.c) / 3;
    pv += tp * c.v;
    v += c.v;
  }
  return v ? pv / v : candles[candles.length - 1].c;
}

function computeIndicators(candles: Candle[]): Indicators {
  const closes = candles.map((c) => c.c);
  const recent = candles.slice(-30);
  const resistance = Math.max(...recent.map((c) => c.h));
  const support = Math.min(...recent.map((c) => c.l));
  const avgVol = recent.reduce((s, c) => s + c.v, 0) / recent.length;
  const lastVol = candles[candles.length - 1].v;
  const lastCandle = candles[candles.length - 1];
  const range = lastCandle.h - lastCandle.l || 1;
  const bodyDir = lastCandle.c >= lastCandle.o ? 1 : -1;
  const candleStrength = (Math.abs(lastCandle.c - lastCandle.o) / range) * bodyDir;
  return {
    ema9: ema(closes.slice(-30), 9),
    ema21: ema(closes.slice(-50), 21),
    ema50: ema(closes.slice(-80), 50),
    rsi: rsi(closes),
    atr: atr(candles),
    vwap: vwap(candles),
    resistance,
    support,
    volSpike: avgVol ? lastVol / avgVol : 1,
    candleStrength,
  };
}

// ----------- public API (adapter surface) -----------
export const marketDataService = {
  getLivePrice(symbol: IndexSymbol): number {
    return tick(symbol);
  },
  getCandles(symbol: IndexSymbol): Candle[] {
    seedCandles(symbol);
    return STATE[symbol].candles;
  },
  getVolume(symbol: IndexSymbol): number {
    seedCandles(symbol);
    const c = STATE[symbol].candles;
    return c[c.length - 1].v;
  },
  getIndicators(symbol: IndexSymbol): Indicators {
    seedCandles(symbol);
    return computeIndicators(STATE[symbol].candles);
  },
  snapshot(symbol: IndexSymbol): MarketSnapshot {
    const ltp = tick(symbol);
    return {
      symbol,
      ltp,
      candles: STATE[symbol].candles,
      indicators: computeIndicators(STATE[symbol].candles),
      ts: Date.now(),
    };
  },
};