const dataFetcher = require('./services/dataFetcher');
const aiService = require('./services/aiService');
const scoringEngine = require('./services/scoringEngine');

async function testScan() {
  const tickers = ["ZOMATO", "TRENT", "MAZDOCK", "RELIANCE"];
  console.log(`🚀 Starting Diagnostic Scan for ${tickers.length} known high-momentum tickers...`);
  
  for (const ticker of tickers) {
    try {
      const marketData = await dataFetcher.fetchStockData(ticker);
      if (!marketData) {
        console.error(`❌ ${ticker} - Market data fetch failed.`);
        continue;
      }

      console.log(`📡 [${ticker}] Price: ₹${marketData.currentPrice} | Trend: ${marketData.trendUp ? 'Bullish' : 'Neutral'} | 52W High: ${marketData.near52WeekHigh ? 'YES' : 'NO'}`);

      const aiAnalysis = await aiService.analyzeStock(ticker, marketData);
      console.log(`🤖 [${ticker}] AI Context: ${aiAnalysis.confidence} | Business Quality: ${aiAnalysis.business_quality}/10`);

      const scoring = scoringEngine.calculateScore(marketData, aiAnalysis);
      console.log(`🔥 [${ticker}] FINAL SCORE: ${scoring.score}% | ${scoring.classification}`);
      console.log(`   Breakdown: Mom: ${scoring.breakdown.momentum.score}%, Struct: ${scoring.breakdown.structure.score}%, AI: ${scoring.breakdown.aiQuality.score}%, Risk: ${scoring.breakdown.risk.score}%`);
      console.log('-----------------------------------------');
    } catch (err) {
      console.error(`❌ Error on ${ticker}:`, err.message);
    }
  }
}

testScan();
