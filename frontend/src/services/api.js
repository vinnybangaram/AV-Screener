// const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch multibagger discovery results
 */
export const fetchMultibaggers = async (refresh = false) => {
  try {
    const url = `${API_BASE_URL}/api/multibagger/${refresh ? '?refresh=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch multibaggers");
    const result = await response.json();
    if (result.success) {
      // Backend returns standardized snake_case fields.
      // We map them to the specific format expected by Multibagger.jsx and its StockCard.
      const mappedData = result.data.map(d => ({
        ...d,
        symbol: d.ticker, // Legacy support
        ticker: d.ticker ? d.ticker.replace('.NS', '').replace('.BO', '') : 'UNKNOWN',
        currentPrice: d.current_price,
        classification: d.signal_classification,
        confidence: d.confidence_level,
        breakdown: {
          momentum: { achieved: d.scores_breakdown.momentum_score || 0 },
          structure: { achieved: d.scores_breakdown.volume_score || 0 },
          aiQuality: { achieved: d.scores_breakdown.fundamental_score || 0 },
          risk: { achieved: d.scores_breakdown.risk_score || 0 }
        }
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
    const url = `${API_BASE_URL}/api/analyse-stock?symbol=${symbol}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch analysis");

    const result = await response.json();
    if (result.success) {
      const { analysis, ai_insights, scores } = result.data;
      
      // Map to structure expected by AnalyseStock.jsx and child components
      return {
        success: true,
        analysis: {
          ...analysis,
          ticker: analysis.ticker.replace('.NS', '').replace('.BO', ''),
          change_pct: analysis.change_pct || 0,
        },
        scores: scores,
        ai_insights: ai_insights
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
    const response = await fetch(`${API_BASE_URL}/api/ai-status`);
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
    const response = await fetch(`${API_BASE_URL}/api/analyse-stock/search?q=${query}`);
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


