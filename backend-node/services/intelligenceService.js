const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../db/client');

class IntelligenceService {
    constructor() {
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
        }
    }

    /**
     * AI Stock Insights
     * Generates fundamental and sentiment analysis summary.
     */
    async generateStockInsight(symbol, marketData) {
        if (!this.model) return null;

        const prompt = `
            Act as a professional SEBI-registered research analyst. 
            Analyse the following data for stock: ${symbol}
            Data: ${JSON.stringify(marketData)}
            
            Provide a 3-point concise insight covering:
            1. Business Quality & Valuation
            2. Technical Trend Strength
            3. Sentiment & Risks
            
            Format as JSON: { "summary": "...", "score": 1-100, "sentiment": "Bullish/Bearish/Neutral" }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const insight = JSON.parse(text);

            await db.query(`
                INSERT INTO ai_stock_insights (symbol, insight_type, score, explanation)
                VALUES ($1, $2, $3, $4)
            `, [symbol, 'DEEP_DIVE', insight.score, insight.summary]);

            return insight;
        } catch (error) {
            console.error('❌ [AIInsight] Error:', error);
            return null;
        }
    }

    /**
     * AI Signal Explanation
     * Explains why a technical signal (e.g. Breakout) was triggered.
     */
    async explainSignal(symbol, signalType, metrics) {
        if (!this.model) return "AI Explanation currently unavailable.";

        const prompt = `
            Explain why ${symbol} triggered a ${signalType} signal.
            Technical Context: ${JSON.stringify(metrics)}
            Keep it professional, educational, and under 50 words.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) { return "Signal verification in progress."; }
    }
}

module.exports = new IntelligenceService();
