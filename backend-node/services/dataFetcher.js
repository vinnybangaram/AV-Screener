const axios = require("axios");

class DataFetcher {
  constructor() {
    this.session = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });
  }

  async fetchStockData(ticker) {
    const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    try {
      console.log(`🌐 [DataFetcher] Requesting ${symbol}...`);
      const res = await this.session.get(url, { params: { interval: '1d', range: '1y' } });
      
      const result = res.data?.chart?.result?.[0];
      if (!result) throw new Error("No chart result found");

      const quotes = result.indicators.quote[0];
      const prices = (quotes.close || []).filter(p => p !== null);
      
      if (prices.length === 0) throw new Error("Zero price points");

      const currentPrice = prices[prices.length - 1];
      const prevPrice = prices[prices.length - 2] || currentPrice;
      
      // Calculate 200 DMA
      const dmaPeriod = Math.min(200, prices.length);
      const dma200 = prices.slice(-dmaPeriod).reduce((a, b) => a + b, 0) / dmaPeriod;

      return {
        symbol,
        ticker,
        company_name: ticker, // Fallback for UI
        currentPrice: Number(currentPrice.toFixed(2)),
        dma200: Number(dma200.toFixed(2)),
        trendUp: currentPrice > dma200,
        volumeSpike: false, 
        near52WeekHigh: true, 
        higherHighs: true, 
        lowVolatility: true,
        noSharpSpikes: true
      };
    } catch (err) {
      console.error(`❌ [DataFetcher] Yahoo Error for ${symbol}:`, err.response?.status || err.message);
      return null;
    }
  }
}

module.exports = new DataFetcher();
