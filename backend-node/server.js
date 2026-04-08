console.log("🚀 SERVER FILE LOADED");

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT ERROR:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 PROMISE ERROR:", err);
});

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

let dataFetcher, aiService, scoringEngine;

try {
  dataFetcher = require("./services/dataFetcher");
  aiService = require("./services/aiService");
  scoringEngine = require("./services/scoringEngine");
} catch (err) {
  console.error("❌ Import failed:", err);
}

dotenv.config();

console.log("✅ Server starting...");
console.log("✅ Services loaded:", {
  dataFetcher: !!dataFetcher,
  aiService: !!aiService,
  scoringEngine: !!scoringEngine
});

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: "https://av-screener.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is LIVE 🚀");
});

const cache = new Map();
const CACHE_KEY = "multibagger_results";
const CACHE_TTL = 15 * 60 * 1000;

// High-conviction tickers (Refined Multi-Sector list)
const SCAN_TICKERS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ZOMATO", "TRENT", "DIXON", "MAZDOCK", "HAL", "BEL",
  "RVNL", "SUZLON", "IREDA", "HUDCO", "JIOFIN", "TATAELXSI", "KPITTECH", "TATAMOTORS", "ADANIENT",
  "TITAN", "BHARTIARTL", "SIEMENS", "ABB", "POLYCAB", "KEI", "VBL", "CHOLAHLDNG", "JINDALSTEL"
];

app.get("/api/multibagger", async (req, res) => {
  try {
    if (!dataFetcher || !aiService || !scoringEngine) {
      return res.json({
        fallback: true,
        message: "Services not loaded. Check server logs for import errors."
      });
    }

    const { refresh } = req.query;
    const cachedData = cache.get(CACHE_KEY);

    if (cachedData && refresh !== 'true' && (Date.now() - cachedData.time < CACHE_TTL)) {
      return res.json(cachedData);
    }

    console.log(`🔍 [API] Running full 3-Layer Scan for ${SCAN_TICKERS.length} tickers...`);
    
    const results = [];

    // Serial scan for stability against Yahoo rate limits
    for (const ticker of SCAN_TICKERS) {
      try {
        const market = await dataFetcher.fetchStockData(ticker);
        if (!market) continue;

        const ai = await aiService.analyzeStock(ticker, market);
        const scoring = scoringEngine.calculateScore(market, ai);

        console.log(`✅ [Scan] ${ticker} | Score: ${scoring.score}% | ${scoring.classification}`);

        results.push({
          ...market,
          ...ai,
          ...scoring,
          ticker,
          lastScanned: new Date().toISOString()
        });
      } catch (err) {
        console.error(`❌ [Scan] Failed ${ticker}:`, err.message);
      }
    }

    // Filter >= 15 for a populated discovery grid
    const finalResults = results
      .filter(s => s.score >= 15)
      .sort((a, b) => b.score - a.score);

    const response = {
      success: true,
      count: finalResults.length,
      data: finalResults,
      time: Date.now(),
      lastUpdated: new Date().toLocaleString()
    };

    cache.set(CACHE_KEY, response);
    res.json(response);
  } catch (error) {
    console.error("🔥 [API] Fatal Scan Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/analyze-stock", async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: "Symbol required" });

  try {
    const market = await dataFetcher.fetchStockData(symbol);
    if (!market) throw new Error("Data fetch failed");
    const analysis = await aiService.analyzeStock(symbol, market);
    res.json({ success: true, symbol, analysis, market });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/ai-status", async (req, res) => {
  if (!aiService) return res.json({ status: "Services offline" });
  const status = await aiService.checkStatus();
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`🚀 3-Layer Multibagger Engine | Port ${PORT}`);
});
