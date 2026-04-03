const API_BASE_URL = "http://localhost:8000/api";

export const fetchScreenerResults = async (refresh = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/screener?refresh=${refresh}`);
    if (!response.ok) {
      throw new Error("Failed to fetch screener data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in API:", error);
    return null;
  }
};

export const fetchStockAnalysis = async (symbol) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyse-stock?symbol=${symbol}`);
    if (!response.ok) {
        throw new Error("Failed to fetch analysis");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return null;
  }
};

export const searchTickers = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyse-stock/search?q=${query}`);
    if (!response.ok) {
        throw new Error("Failed to search tickers");
    }
    return await response.json();
  } catch (error) {
    console.error("Error searching tickers:", error);
    return [];
  }
};
