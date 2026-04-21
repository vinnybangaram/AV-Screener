// Shared types for the Option Signals engine.

export type IndexSymbol = "NIFTY" | "BANKNIFTY";
export type Direction = "CALL" | "PUT";
export type RiskMode = "Conservative" | "Balanced" | "Aggressive";
export type TradeStatus = "OPEN" | "EXIT";
export type ExitReason =
  | "SL Hit"
  | "TSL Locked"
  | "Reversal Signal"
  | "Session End"
  | "Max Holding"
  | "Manual Stop";

export interface Candle {
  t: number; // epoch ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Indicators {
  ema9: number;
  ema21: number;
  ema50: number;
  rsi: number;
  atr: number;
  vwap: number;
  resistance: number;
  support: number;
  volSpike: number; // volume / avgVolume
  candleStrength: number; // -1..1
}

export interface MarketSnapshot {
  symbol: IndexSymbol;
  ltp: number;
  candles: Candle[];
  indicators: Indicators;
  ts: number;
}

export interface SignalResult {
  symbol: IndexSymbol;
  direction: Direction;
  confidenceScore: number;
  reasons: string[];
  entryPrice: number;
  sl: number;
  tsl1: number;
  tsl2: number;
  tsl3: number;
}

export interface PaperTrade {
  id: string;
  symbol: IndexSymbol;
  direction: Direction;
  status: TradeStatus;
  executionTime: number;
  exitTime?: number;
  entry: number;
  sl: number;
  tsl1: number;
  tsl2: number;
  tsl3: number;
  currentSL: number;
  tslStage: 0 | 1 | 2 | 3;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  reason: string;
  exitReason?: ExitReason;
  confidenceScore: number;
}

export interface IgniteSettings {
  slots: number; // 1-4
  trades: number; // max trades per index per day
  riskMode: RiskMode;
  enabled: boolean;
  symbols: IndexSymbol[];
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalPnl: number;
  wins: number;
  losses: number;
  trades: number;
  avgGain: number;
  avgLoss: number;
}

export const DEFAULT_SETTINGS: IgniteSettings = {
  slots: 2,
  trades: 6,
  riskMode: "Balanced",
  enabled: false,
  symbols: ["NIFTY", "BANKNIFTY"],
};