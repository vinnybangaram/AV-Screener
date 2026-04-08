const axios = require("axios");
const yahooFinance = require("yahoo-finance2").default;

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

  async search(query) {
    try {
      console.log(`🔍 [DataFetcher] Searching for: ${query}`);
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0`;
      const res = await this.session.get(url);
      
      const quotes = res.data?.quotes || [];

      return quotes
        .filter(q => q.exchange === 'NSI' || q.exchange === 'BSE' || q.symbol.endsWith('.NS'))
        .map(q => ({
          symbol: q.symbol.replace('.NS', ''),
          name: q.shortname || q.longname || q.symbol,
          exch: q.exchange
        }));
    } catch (err) {
      console.error("❌ [DataFetcher] Search error:", err.message);
      return [];
    }
  }

  async fetchStockData(ticker) {
    const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    try {
      console.log(`🌐 [DataFetcher] Requesting ${symbol}...`);
      const res = await this.session.get(url, { params: { interval: '1d', range: '1y' } });
      
      const result = res.data?.chart?.result?.[0];
      if (!result) throw new Error("No chart result found");

      const meta = result.meta;
      const quotes = result.indicators.quote[0];
      const prices = (quotes.close || []).filter(p => p !== null);
      const volumes = (quotes.volume || []).filter(v => v !== null);
      
      if (prices.length === 0) throw new Error("Zero price points");

      const currentPrice = meta.regularMarketPrice || prices[prices.length - 1];
      const prevPrice = meta.chartPreviousClose || prices[prices.length - 2] || currentPrice;
      const change = currentPrice - prevPrice;
      const changePct = (change / prevPrice) * 100;
      
      // Calculate 200 DMA
      const dmaPeriod = Math.min(200, prices.length);
      const dma200 = prices.slice(-dmaPeriod).reduce((a, b) => a + b, 0) / dmaPeriod;

      // Volume Analysis
      const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
      const currentVol = volumes[volumes.length - 1] || 0;

      return {
        symbol,
        ticker,
        company_name: ticker,
        currentPrice: Number(currentPrice.toFixed(2)),
        changePct: Number(changePct.toFixed(2)),
        volume: currentVol,
        avgVolume: Math.round(avgVol),
        dma200: Number(dma200.toFixed(2)),
        trendUp: currentPrice > dma200,
        volumeSpike: currentVol > (avgVol * 1.5),
        near52WeekHigh: true, // Simplified
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


