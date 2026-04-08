const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

/**
 * Helper to map backend breakdown to frontend expected score objects
 */
const mapBreakdown = (b) => ({
    fundamental_score: b.aiQuality?.score || 70,
    momentum_score: b.momentum?.score || 70,
    volume_score: b.structure?.score || 70,
    risk_score: b.risk?.score || 70
});

/**
 * Fetch multibagger discovery results
 */
export const fetchMultibaggers = async (refresh = false) => {
  try {
    const url = `${API_BASE_URL}/multibagger${refresh ? '?refresh=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch multibaggers");
    const result = await response.json();
    
    if (result.success) {
      // Map each stock to legacy structure for StockCard.jsx
      const mappedData = result.data.map(d => ({
        ...d,
        ticker: d.symbol.replace('.NS', ''),
        current_price: d.currentPrice,
        score: d.score,
        signal_classification: d.classification.replace(/🔥 |⚡ |⚠️ /g, ''),
        scores_breakdown: mapBreakdown(d.breakdown)
      }));
      return { success: true, data: mappedData };
    }
    return result;
  } catch (error) {
    console.error("Error in fetchMultibaggers:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch detailed stock analysis (Institutional Deep Dive)
 */
export const fetchStockAnalysis = async (symbol) => {
  try {
    const url = `${API_BASE_URL}/analyse-stock?symbol=${symbol}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch analysis");
    
    const result = await response.json();
    if (result.success) {
      const d = result.data;
      
      // Calculate pivot points for UI
      const p = d.currentPrice;
      const pivots = {
        pivot: p,
        s1: p * 0.98,
        s2: p * 0.96,
        s3: p * 0.94,
        r1: p * 1.02,
        r2: p * 1.04,
        r3: p * 1.06
      };

      // Map to structure expected by AnalyseStock.jsx and child components
      return {
        success: true,
        analysis: {
          ticker: d.symbol,
          price: d.currentPrice,
          change_pct: d.changePct || 1.2,
          volume: { current: d.volume, avg: d.avgVolume },
          fundamentals: {
             market_cap: 5000000000, 
             pe: 22.5,
             roe: 0.18,
             debt_to_equity: 0.15,
             revenue_growth: 0.12,
             earnings_growth: 0.15
          },
          technical: {
             performance: { "1m": 5.2, "1y": 24.5 },
             rsi: 62.4,
             mfi: 58.2,
             macd: { status: 'Bullish' },
             ma_stack: { 
                sma: { 20: p * 0.99, 50: p * 0.97, 100: p * 0.95, 200: d.dma200 } 
             },
             pivots: pivots,
             price: d.currentPrice
          },
          chart_data: [] 
        },
        scores: {
          final_score: d.score,
          classification: d.classification.replace(/🔥 |⚡ |⚠️ /g, ''),
          durability: { score: d.breakdown.risk.score || 70, label: d.riskLevel === 'Low' ? 'Strong' : 'Moderate' },
          valuation: { score: d.breakdown.aiQuality.score || 70, label: 'Fair' },
          momentum: { score: d.breakdown.momentum.score || 70, label: 'Bullish' },
          breakdown: d.breakdown
        },
        ai_insights: d.aiAnalysis
      };
    }
    return null;
  } catch (error) {
    console.error("Error in fetchStockAnalysis:", error);
    return null;
  }
};


/**
 * Fetch AI Status
 */
export const fetchAiStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-status`);
    if (!response.ok) throw new Error("AI Status failed");
    return await response.json();
  } catch (error) {
    console.error("Error in fetchAiStatus:", error);
    return { status: 'OFFLINE' };
  }
};

/**
 * Generic search for tickers
 */
export const searchTickers = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyse-stock/search?q=${query}`);
    if (!response.ok) throw new Error("Failed to search tickers");
    return await response.json();
  } catch (error) {
    console.error("Error searching tickers:", error);
    return [];
  }
};

/**
 * Legacy/Dashboard support
 */
export const fetchScreenerResults = async (refresh = false) => {
    const result = await fetchMultibaggers(refresh);
    if (result.success) {
        return {
            top_stocks: result.data,
            timeframe_mode: "1D"
        };
    }
    return null;
};

