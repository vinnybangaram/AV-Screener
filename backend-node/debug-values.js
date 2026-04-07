const dataFetcher = require('./services/dataFetcher');
const aiService = require('./services/aiService');
const scoringEngine = require('./services/scoringEngine');

async function debugScan() {
  const ticker = "RELIANCE";
  console.log(`🛠️ Debugging ${ticker}...`);
  
  const marketData = await dataFetcher.fetchStockData(ticker);
  if (!marketData) {
    console.error("❌ Failed to fetch market data.");
    return;
  }

  console.log('--- RAW DATA ---');
  console.log(`Current Price: ${marketData.currentPrice} (Type: ${typeof marketData.currentPrice})`);
  console.log(`200 DMA: ${marketData.dma200} (Type: ${typeof marketData.dma200})`);
  console.log(`Current > DMA: ${marketData.currentPrice > marketData.dma200}`);
  console.log(`Trend Up Key: ${marketData.trendUp}`);
  console.log(`Volume Spike: ${marketData.volumeSpike}`);
  console.log(`Near 52W High: ${marketData.near52WeekHigh}`);
  
  const aiData = await aiService.analyzeStock(ticker, marketData);
  console.log('--- AI DATA ---');
  console.log(JSON.stringify(aiData, null, 2));

  const scoring = scoringEngine.calculateScore(marketData, aiData);
  console.log('--- SCORING ---');
  console.log(JSON.stringify(scoring, null, 2));
}

debugScan();
