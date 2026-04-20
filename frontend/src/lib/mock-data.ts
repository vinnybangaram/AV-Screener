// Centralized mock data for AV Screener
export const marketTicker = [
  { symbol: "NIFTY 50", price: "24,318.45", change: "+0.62%", up: true },
  { symbol: "SENSEX", price: "80,124.10", change: "+0.48%", up: true },
  { symbol: "BANK NIFTY", price: "52,098.30", change: "-0.21%", up: false },
  { symbol: "NASDAQ", price: "19,872.55", change: "+1.12%", up: true },
  { symbol: "S&P 500", price: "5,918.20", change: "+0.34%", up: true },
  { symbol: "GOLD", price: "$2,684.10", change: "+0.18%", up: true },
  { symbol: "USD/INR", price: "84.32", change: "-0.05%", up: false },
  { symbol: "BRENT", price: "$78.45", change: "-0.74%", up: false },
];

// ---- Investment-mode KPIs (Dashboard) ----
export const kpisInvestment = [
  { label: "Portfolio Value", value: "₹6,066.4", delta: "+0.09%", tone: "success" as const, hint: "Tracked equity", trendUp: true },
  { label: "Investment P/L", value: "₹5.65", delta: "Today: +₹15.6 (+0.26%)", tone: "accent" as const, hint: undefined },
  { label: "Last 30 Days P/L", value: "₹11.66", delta: "L: ₹11.66 · S: ₹0", tone: "success" as const, hint: undefined },
  { label: "Alpha Performer", value: "TCS", delta: "+0.86%", tone: "warning" as const, hint: "Top of book", trendUp: true },
];

// ---- Intraday-mode KPIs (Dashboard) ----
export const kpisIntraday = [
  { label: "Today P/L", value: "₹+1,284", delta: "+1.42%", tone: "success" as const, hint: "Net of fees", trendUp: true },
  { label: "Open Positions", value: "6", delta: "4 long · 2 short", tone: "accent" as const, hint: "Live trades" },
  { label: "Win Rate (5D)", value: "62%", delta: "+3 pts", tone: "success" as const, hint: "Rolling avg", trendUp: true },
  { label: "Max Drawdown", value: "-1.8%", delta: "Within limits", tone: "warning" as const, hint: "Risk guard" },
];

// Legacy alias for backward compat
export const kpis = kpisInvestment;

export const sectors = [
  { name: "Banking", change: 1.4 },
  { name: "IT", change: 2.1 },
  { name: "Auto", change: -0.6 },
  { name: "Pharma", change: 0.9 },
  { name: "Energy", change: -1.2 },
  { name: "FMCG", change: 0.3 },
  { name: "Metals", change: -0.8 },
  { name: "Realty", change: 1.7 },
  { name: "Telecom", change: 0.5 },
  { name: "Capital Goods", change: 1.1 },
  { name: "Media", change: -0.4 },
  { name: "Infra", change: 0.7 },
];

export const opportunities = [
  { symbol: "RELIANCE", company: "Reliance Industries", price: 2918.4, change: 1.84, score: 92, setup: "Breakout" },
  { symbol: "TCS", company: "Tata Consultancy", price: 4214.1, change: 0.94, score: 88, setup: "Trend Cont." },
  { symbol: "HDFCBANK", company: "HDFC Bank", price: 1684.55, change: 1.21, score: 86, setup: "Pullback" },
  { symbol: "INFY", company: "Infosys", price: 1872.3, change: 2.15, score: 91, setup: "Breakout" },
  { symbol: "BHARTIARTL", company: "Bharti Airtel", price: 1592.7, change: -0.42, score: 79, setup: "Consolidation" },
  { symbol: "LT", company: "Larsen & Toubro", price: 3624.0, change: 1.05, score: 84, setup: "Trend Cont." },
  { symbol: "ITC", company: "ITC Limited", price: 478.9, change: 0.63, score: 76, setup: "Range" },
];

// Intraday-specific opportunities
export const intradayScans = [
  { symbol: "HDFCBANK", company: "HDFC Bank", price: 1684.55, change: 1.21, score: 84, setup: "ORB Long" },
  { symbol: "TATAMOTORS", company: "Tata Motors", price: 824.10, change: 2.05, score: 81, setup: "VWAP Bounce" },
  { symbol: "ADANIENT", company: "Adani Enterprises", price: 2384.70, change: -1.42, score: 78, setup: "Break Down" },
  { symbol: "SBIN", company: "State Bank of India", price: 814.25, change: 0.86, score: 76, setup: "Flag" },
  { symbol: "ZOMATO", company: "Zomato", price: 248.90, change: 3.10, score: 88, setup: "Momentum" },
];

export const watchlistSnapshot = [
  { symbol: "RELIANCE", price: 2918.4, change: 1.84 },
  { symbol: "TCS", price: 4214.1, change: 0.94 },
  { symbol: "HDFCBANK", price: 1684.55, change: 1.21 },
  { symbol: "INFY", price: 1872.3, change: 2.15 },
  { symbol: "AXISBANK", price: 1148.9, change: -0.55 },
  { symbol: "BAJFINANCE", price: 6982.4, change: 0.87 },
];

export const alertsTimeline = [
  { time: "10:42", title: "INFY crossed RSI 70", tone: "warning" as const },
  { time: "10:18", title: "RELIANCE breakout confirmed", tone: "success" as const },
  { time: "09:55", title: "AXISBANK volume surge 3.2x", tone: "accent" as const },
  { time: "09:32", title: "ICICIBANK below 200 DMA", tone: "danger" as const },
  { time: "09:20", title: "Market opened gap up +0.4%", tone: "success" as const },
];

export const screenerResults = [
  { symbol: "RELIANCE", sector: "Energy", price: 2918.4, score: 92, momentum: 88, valuation: 72, risk: "Low" },
  { symbol: "TCS", sector: "IT", price: 4214.1, score: 88, momentum: 81, valuation: 68, risk: "Low" },
  { symbol: "HDFCBANK", sector: "Banking", price: 1684.55, score: 86, momentum: 79, valuation: 75, risk: "Low" },
  { symbol: "INFY", sector: "IT", price: 1872.3, score: 91, momentum: 90, valuation: 70, risk: "Medium" },
  { symbol: "BHARTIARTL", sector: "Telecom", price: 1592.7, score: 79, momentum: 65, valuation: 62, risk: "Medium" },
  { symbol: "LT", sector: "Capital Goods", price: 3624.0, score: 84, momentum: 76, valuation: 71, risk: "Low" },
  { symbol: "ITC", sector: "FMCG", price: 478.9, score: 76, momentum: 58, valuation: 80, risk: "Low" },
  { symbol: "ADANIPORTS", sector: "Infra", price: 1342.5, score: 82, momentum: 84, valuation: 60, risk: "High" },
  { symbol: "MARUTI", sector: "Auto", price: 11248.0, score: 80, momentum: 72, valuation: 66, risk: "Medium" },
  { symbol: "SUNPHARMA", sector: "Pharma", price: 1812.4, score: 83, momentum: 74, valuation: 69, risk: "Low" },
];

export const priceSeries = Array.from({ length: 60 }, (_, i) => ({
  t: i,
  p: 100 + Math.sin(i / 5) * 6 + i * 0.4 + (Math.random() - 0.5) * 2,
}));

// ---- System Positions (Dashboard + dedicated page) ----
export type Strategy = "MULTIBAGGER" | "PENNY";
export type Side = "LONG" | "SHORT";

export interface SystemPosition {
  symbol: string;
  strategy: Strategy;
  date: string;
  entry: number;
  current: number;
  side: Side;
  sl: number;
  target: number;
  exit?: number | null;
  pnl: number;
  alpha: number;
}

export const systemPositions: SystemPosition[] = [
  { symbol: "ICICIBANK", strategy: "MULTIBAGGER", date: "15 Apr", entry: 1348.10, current: 1345.50, side: "LONG", sl: 1281.87, target: 1546.80, exit: null, pnl: -2.6, alpha: -0.19 },
  { symbol: "TCS",       strategy: "MULTIBAGGER", date: "15 Apr", entry: 2554.90, current: 2576.90, side: "LONG", sl: 2473.44, target: 2799.27, exit: null, pnl: 22.0, alpha: 0.86 },
  { symbol: "BHARTIARTL", strategy: "MULTIBAGGER", date: "15 Apr", entry: 1855.70, current: 1840.60, side: "LONG", sl: 1808.30, target: 1997.89, exit: null, pnl: -15.1, alpha: -0.81 },
  { symbol: "ITC",       strategy: "MULTIBAGGER", date: "15 Apr", entry: 302.05, current: 303.40, side: "LONG", sl: 297.40, target: 316.00, exit: null, pnl: 1.35, alpha: 0.45 },
  { symbol: "HFCL",      strategy: "PENNY",       date: "15 Apr", entry: 88.12, current: 91.48, side: "LONG", sl: 76.54, target: 111.28, exit: null, pnl: 3.36, alpha: 3.81 },
  { symbol: "JPPOWER",   strategy: "PENNY",       date: "15 Apr", entry: 18.85, current: 19.61, side: "LONG", sl: 16.42, target: 23.71, exit: null, pnl: 0.76, alpha: 4.03 },
  { symbol: "IFCI",      strategy: "PENNY",       date: "15 Apr", entry: 58.42, current: 60.73, side: "LONG", sl: 52.98, target: 69.31, exit: null, pnl: 2.31, alpha: 3.95 },
  { symbol: "RPOWER",    strategy: "PENNY",       date: "15 Apr", entry: 28.94, current: 28.89, side: "LONG", sl: 24.94, target: 36.94, exit: null, pnl: -0.05, alpha: -0.17 },
  { symbol: "CENTRALBK", strategy: "PENNY",       date: "15 Apr", entry: 35.73, current: 35.83, side: "LONG", sl: 34.04, target: 39.11, exit: null, pnl: 0.10, alpha: 0.28 },
  { symbol: "ZEEL",      strategy: "PENNY",       date: "15 Apr", entry: 82.72, current: 80.20, side: "LONG", sl: 73.86, target: 100.43, exit: null, pnl: -2.52, alpha: -3.05 },
  { symbol: "NBCC",      strategy: "PENNY",       date: "15 Apr", entry: 91.00, current: 93.05, side: "LONG", sl: 85.50, target: 101.99, exit: null, pnl: 2.05, alpha: 2.25 },
];

// ---- Multibagger Discovery Terminal ----
export interface MultibaggerCandidate {
  symbol: string;
  price: number;
  score: number;
  probability: number;
  structure: "Consolidating" | "Trending" | "Breakout" | "Distribution";
  momentum: "Bullish" | "Neutral" | "Bearish";
  aiEngine: "LOW" | "MED" | "HIGH";
}

export const multibaggerCandidates: MultibaggerCandidate[] = [
  { symbol: "TCS", price: 2581.5, score: 63, probability: 63, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "BHARTIARTL", price: 1846.9, score: 61, probability: 61, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "ICICIBANK", price: 1346.8, score: 60, probability: 60, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "RELIANCE", price: 1365.0, score: 59, probability: 59, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "INFY", price: 1318.7, score: 59, probability: 59, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "ITC", price: 306.8, score: 58, probability: 58, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "SBIN", price: 1080.25, score: 57, probability: 57, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
  { symbol: "KOTAKBANK", price: 383.6, score: 57, probability: 57, structure: "Consolidating", momentum: "Neutral", aiEngine: "LOW" },
];

// ---- Penny Storm Radar ----
export type StormStage = "STORM_READY" | "BREWING" | "DRIZZLE" | "DRY";
export interface PennyStormCandidate {
  symbol: string;
  price: number;
  storm: StormStage;
  probability: number;
  risk: "Low" | "Medium" | "Medium-High" | "High";
  sector: string;
  change24h: number;
  radar: "Tailwind" | "Headwind" | "Neutral";
  note: string;
}

export const pennyStormCandidates: PennyStormCandidate[] = [
  { symbol: "HFCL", price: 95.9, storm: "BREWING", probability: 65, risk: "Medium-High", sector: "EQ", change24h: 4.83, radar: "Tailwind", note: "HFCL scores 65/100 — BREWING" },
  { symbol: "MMTC", price: 68.5, storm: "BREWING", probability: 63, risk: "Medium-High", sector: "EQ", change24h: 10.64, radar: "Tailwind", note: "MMTC scores 63/100 — BREWING" },
  { symbol: "NIVABUPA", price: 80.1, storm: "DRIZZLE", probability: 58, risk: "High", sector: "EQ", change24h: 2.04, radar: "Tailwind", note: "NIVABUPA scores 58/100 — DRIZZLE" },
  { symbol: "OLAELEC", price: 40.85, storm: "DRIZZLE", probability: 55, risk: "High", sector: "EQ", change24h: 5.61, radar: "Tailwind", note: "OLAELEC scores 55/100 — DRIZZLE" },
  { symbol: "IFCI", price: 61.15, storm: "DRIZZLE", probability: 53, risk: "High", sector: "EQ", change24h: 1.22, radar: "Neutral", note: "IFCI scores 53/100 — DRIZZLE" },
  { symbol: "NSLNISP", price: 42.7, storm: "DRIZZLE", probability: 53, risk: "High", sector: "EQ", change24h: 2.15, radar: "Tailwind", note: "NSLNISP scores 53/100 — DRIZZLE" },
  { symbol: "CENTRALBK", price: 36.05, storm: "DRIZZLE", probability: 53, risk: "High", sector: "EQ", change24h: 0.85, radar: "Neutral", note: "CENTRALBK scores 53/100 — DRIZZLE" },
  { symbol: "INOXWIND", price: 98.2, storm: "DRIZZLE", probability: 52, risk: "High", sector: "EQ", change24h: -0.61, radar: "Headwind", note: "INOXWIND scores 52/100 — DRIZZLE" },
];

// ---- Stock Analysis: Quantitative Intelligence ----
export const probabilityForecast = {
  bullish: { range: [396.42, 427.48] as [number, number], probability: 63 },
  neutral: { range: [387.95, 399.25] as [number, number], probability: 23 },
  bearish: { range: [359.72, 390.78] as [number, number], probability: 13 },
  confidence: "High" as const,
  reasoning: [
    "Strong bullish momentum in NTPC",
    "Stable volatility levels provide higher forecast reliability",
  ],
};

export const confluenceAlignment = {
  score: 80,
  verdict: "STRONG BULLISH" as const,
  drivers: [
    "Strong multi-timeframe uptrend",
    "Bullish momentum crossover confirmed",
    "Stable price structure / Low risk profile",
  ],
  risks: [] as string[],
};

export const tradeSetup = {
  bias: "PULLBACK" as const,
  watchlist: true,
  conviction: "HIGH" as const,
  entryZone: [389.66, 397.54] as [number, number],
  stopLoss: 371.59,
  target1: 396.10,
  target2: 407.91,
  riskReward: "1:0.1",
  rationale: [
    "Price retraced to key support zone in an uptrend",
    "Trend remains structurally intact",
  ],
  riskOverlay: "Risk/Reward ratio is suboptimal at current levels",
};

// ---- Stock Analysis: Price Targets & Context ----
export const priceTargets = {
  "7d": {
    bullish: { range: [410.5, 425.2] as [number, number], probable: 422.1 },
    base: { range: [395.0, 405.5] as [number, number], probable: 397.35 },
    bearish: { range: [370.2, 385.0] as [number, number], probable: 372.9 },
  },
  "30d": {
    bullish: { range: [455.76, 476.48] as [number, number], probable: 476.48 },
    base: { range: [391.01, 411.73] as [number, number], probable: 401.37 },
    bearish: { range: [336.62, 357.34] as [number, number], probable: 336.62 },
  },
  "90d": {
    bullish: { range: [510.0, 548.2] as [number, number], probable: 538.6 },
    base: { range: [395.5, 425.4] as [number, number], probable: 407.06 },
    bearish: { range: [310.8, 340.5] as [number, number], probable: 312.4 },
  },
};

export const expectedPath = [
  { label: "NOW", price: null as number | null },
  { label: "7D", price: 397.35 },
  { label: "30D", price: 401.37 },
  { label: "90D", price: 407.06 },
];

// ---- Stock Analysis: Historical Sessions ----
export interface HistoricalSession {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
  change: number;
  signal: "Long" | "Short" | "Hold" | "Exit";
}

export const historicalSessions: HistoricalSession[] = [
  { date: "15 Apr 2025", open: 392.10, high: 398.50, low: 388.20, close: 396.80, volume: "12.4M", change: 1.21, signal: "Long" },
  { date: "14 Apr 2025", open: 388.00, high: 394.20, low: 386.10, close: 392.05, volume: "10.8M", change: 1.05, signal: "Hold" },
  { date: "11 Apr 2025", open: 385.50, high: 390.40, low: 383.80, close: 387.90, volume: "9.6M",  change: 0.62, signal: "Hold" },
  { date: "10 Apr 2025", open: 390.20, high: 391.10, low: 384.50, close: 385.50, volume: "11.2M", change: -1.20, signal: "Exit" },
  { date: "09 Apr 2025", open: 388.40, high: 393.00, low: 387.20, close: 390.20, volume: "8.9M",  change: 0.46, signal: "Hold" },
  { date: "08 Apr 2025", open: 384.20, high: 389.80, low: 383.00, close: 388.40, volume: "10.1M", change: 1.10, signal: "Long" },
  { date: "07 Apr 2025", open: 380.90, high: 385.50, low: 378.40, close: 384.20, volume: "9.4M",  change: 0.86, signal: "Long" },
];

// ---- Watchlist categories (Tracking Portfolio Memory) ----
export interface WatchlistMemory {
  symbol: string;
  category: "MULTIBAGGER" | "INTRADAY" | "PENNY" | "MANUAL";
  side: "LONG" | "SHORT";
  date: string;
  memoryEntry: number;
  pulsePrice: number;
  stopLoss: number;
  profitTarget: number;
  change: number;
  delta: number;
}

export const watchlistMemory: WatchlistMemory[] = [
  { symbol: "ICICIBANK", category: "MULTIBAGGER", side: "LONG", date: "15 Apr", memoryEntry: 1348.10, pulsePrice: 1345.50, stopLoss: 1281.87, profitTarget: 1546.80, change: -0.19, delta: -2.60 },
  { symbol: "TCS",       category: "MULTIBAGGER", side: "LONG", date: "15 Apr", memoryEntry: 2554.90, pulsePrice: 2576.90, stopLoss: 2473.44, profitTarget: 2799.27, change: 0.86,  delta: 22.00 },
  { symbol: "BHARTIARTL", category: "MULTIBAGGER", side: "LONG", date: "15 Apr", memoryEntry: 1855.70, pulsePrice: 1840.60, stopLoss: 1808.30, profitTarget: 1997.89, change: -0.81, delta: -15.10 },
  { symbol: "ITC",       category: "MULTIBAGGER", side: "LONG", date: "15 Apr", memoryEntry: 302.05, pulsePrice: 303.40, stopLoss: 297.40, profitTarget: 316.00, change: 0.45, delta: 1.35 },
  { symbol: "HFCL",      category: "PENNY",       side: "LONG", date: "15 Apr", memoryEntry: 88.12, pulsePrice: 91.48, stopLoss: 76.54, profitTarget: 111.28, change: 3.81, delta: 3.36 },
  { symbol: "JPPOWER",   category: "PENNY",       side: "LONG", date: "15 Apr", memoryEntry: 18.85, pulsePrice: 19.61, stopLoss: 16.42, profitTarget: 23.71, change: 4.03, delta: 0.76 },
  { symbol: "IFCI",      category: "PENNY",       side: "LONG", date: "15 Apr", memoryEntry: 58.42, pulsePrice: 60.73, stopLoss: 52.98, profitTarget: 69.31, change: 3.95, delta: 2.31 },
  { symbol: "RPOWER",    category: "PENNY",       side: "LONG", date: "15 Apr", memoryEntry: 28.94, pulsePrice: 28.89, stopLoss: 24.94, profitTarget: 36.94, change: -0.17, delta: -0.05 },
];
