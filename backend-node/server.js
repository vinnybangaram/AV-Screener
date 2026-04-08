const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const dataFetcher = require("./services/dataFetcher");
const scoringEngine = require("./services/scoringEngine");
const aiService = require("./services/aiService");
require("dotenv").config();

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-av-screener-key";

// ✅ CORS MUST BE FIRST
app.use(cors({
  origin: "*"
}));

app.use(express.json());


// In-memory cache
const cache = {
  multibagger: null,
  timestamp: 0
};

const CACHE_TTL = 3600000; // 1 hour

const TICKERS = [
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", 
  "IREDA", "RVNL", "MAZDOCK", "TATASTEEL", "ZOMATO",
  "HAL", "BEL", "ADANIENT", "BHARTIARTL", "LT"
];

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("🚀 AV-SCREENER INTELLIGENCE SERVER V2 ACTIVE");
});

// ✅ MULTIBAGGER SCAN
app.get("/api/multibagger", async (req, res) => {
  const refresh = req.query.refresh === "true";
  const now = Date.now();

  if (!refresh && cache.multibagger && (now - cache.timestamp < CACHE_TTL)) {
    console.log("📦 [Server] Serving Multibagger from cache");
    return res.json({ success: true, data: cache.multibagger });
  }

  console.log("🔍 [Server] Starting Multibagger scan...");
  try {
    const results = [];
    for (const ticker of TICKERS) {
      const marketData = await dataFetcher.fetchStockData(ticker);
      if (marketData) {
        // For Multibagger list, we use a basic AI summary or default values
        // Detailed AI analysis is done in /api/analyse-stock
        const scoreData = scoringEngine.calculateScore(marketData, {
            business_quality: 7, // Defaults for list view
            growth_potential: 8,
            management_quality: 7
        });
        
        results.push({
          ...marketData,
          ...scoreData,
          confidence: "System"
        });
      }
    }

    cache.multibagger = results;
    cache.timestamp = now;

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("❌ [Server] Multibagger scan error:", error);
    res.status(500).json({ success: false, error: "Failed to run scan" });
  }
});

// ✅ AI STATUS
app.get("/api/ai-status", async (req, res) => {
  const status = await aiService.checkStatus();
  res.json(status);
});

// ✅ ANALYSE STOCK (Deep Dive)
app.get("/api/analyse-stock", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  try {
    const ticker = symbol.replace(".NS", "");
    const marketData = await dataFetcher.fetchStockData(ticker);
    if (!marketData) throw new Error("Could not fetch market data");

    const aiData = await aiService.analyzeStock(symbol, marketData);
    const scoreData = scoringEngine.calculateScore(marketData, aiData);

    res.json({
      success: true,
      data: {
        ...marketData,
        ...scoreData,
        aiAnalysis: aiData
      }
    });
  } catch (error) {
    console.error(`❌ [Server] Analysis error for ${symbol}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ SEARCH / AUTOCOMPLETE
app.get("/api/analyse-stock/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  try {
    const results = await dataFetcher.search(q);
    res.json(results);
  } catch (error) {
    console.error("❌ [Server] Search error:", error);
    res.json([]);
  }
});

// ✅ GOOGLE AUTH
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "Token is required" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Create session JWT
    const appToken = jwt.sign(
      { email, name, picture },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`👤 [Auth] User logged in: ${email}`);
    res.json({ success: true, token: appToken, user: { email, name, picture } });
  } catch (error) {
    console.error("❌ [Auth] Google verification failed:", error.message);
    res.status(401).json({ success: false, error: "Invalid Google token" });
  }
});

// ✅ PORT
const PORT = process.env.PORT || 10000;


app.listen(PORT, () => {
  console.log("🚀 Server started on port:", PORT);
});

