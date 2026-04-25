const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");

// Elite & V4 Services
const masterDataService = require("./services/masterDataService");
const importEngine = require("./services/importEngine");
const financialService = require("./services/financialService");
const intelligenceService = require("./services/intelligenceService");
const qualityEngine = require("./services/qualityEngine");
const marketingService = require("./services/marketingService");

require("dotenv").config();

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ AUTH GUARDS
const authGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: "Invalid Session" }); }
};

const premiumGuard = async (req, res, next) => {
    const status = await financialService.getPremiumStatus(req.user.email);
    if (status.name !== 'FREE') return next();
    res.status(403).json({ error: "Premium Subscription Required", upgradeUrl: "/billing" });
};

// ✅ V4: FINANCIAL & BILLING
app.post("/api/billing/subscribe", authGuard, async (req, res) => {
    try {
        const sub = await financialService.createSubscription(req.user.email, req.body.planId, req.body.coupon);
        res.json({ success: true, subscription: sub });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/billing/webhook", async (req, res) => {
    try {
        await financialService.verifyWebhook(req.body, req.headers['x-razorpay-signature']);
        res.status(200).send("ok");
    } catch (e) { res.status(400).send("error"); }
});

// ✅ V4: AI INTELLIGENCE
app.get("/api/intelligence/stock-deep-dive", authGuard, premiumGuard, async (req, res) => {
    const { symbol } = req.query;
    try {
        const insight = await intelligenceService.generateStockInsight(symbol, req.body.marketData);
        res.json({ success: true, insight });
    } catch (e) { res.status(500).json({ error: "AI Insight Engine busy" }); }
});

// ✅ V4: PORTFOLIO TRACKER
app.get("/api/portfolio", authGuard, async (req, res) => {
    const { rows } = await db.query("SELECT * FROM portfolios WHERE user_id = $1", [req.user.email]);
    res.json({ success: true, data: rows });
});

// ✅ SEARCH & CORE
app.get("/api/symbols/search", async (req, res) => {
    const results = await masterDataService.search(req.query.q);
    res.json({ success: true, data: results });
});

// ✅ ADMIN & OPS
app.get("/api/admin/metrics", authGuard, async (req, res) => {
    if (req.user.email !== process.env.ADMIN_EMAIL) return res.status(403).send("Denied");
    const stats = await masterDataService.getDashboardStats();
    res.json({ success: true, stats });
});

// ✅ HEALTH & CRON
app.get("/api/health", (req, res) => res.json({ status: "healthy", v: "4.0.0-Commercial" }));

cron.schedule("0 8 * * *", () => importEngine.syncAll().catch(e => console.error(e)));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 AV SCREENER V4 COMMERCIAL ACTIVE on ${PORT}`));
