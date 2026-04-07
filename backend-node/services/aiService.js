const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeStock(symbol, marketData) {
    const prompt = `
Analyze the following stock: ${symbol}

CONTEXT:
Price: ₹${marketData.currentPrice}
Trend: ${marketData.trendUp ? "Uptrend" : "Downtrend"}
Significant Volume Spike: ${marketData.volumeSpike ? "YES" : "NO"}

IMPORTANT INSTRUCTIONS:
- Do NOT guess or generate precise financial numbers (ROE, PE, Debt, etc.) to avoid hallucinations.
- Focus ONLY on qualitative insights based on your institutional knowledge.
- Evaluate Business Quality, Growth Potential, and Management Quality.

Return only a valid JSON object in the following format:
{
  "summary": "Crisp overview (1-2 sentences)",
  "business_quality": (integer 1-10),
  "growth_potential": (integer 1-10),
  "management_quality": (integer 1-10),
  "risks": "Key structural or market risks",
  "sector": "Primary growth sector (e.g., EV, AI, Infra, Energy)",
  "verdict": "Institutional outlook (Bullish / Neutral / Risky)"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         const analysis = JSON.parse(jsonMatch[0]);
         analysis.confidence = "High";
         return analysis;
      }
      throw new Error("Failed to parse qualitative AI response");
    } catch (error) {
      console.error(`[AIService] Gemini failed for ${symbol}:`, error.message);
      return {
        summary: "Institutional analysis currently unavailable. Momentum data remains live.",
        business_quality: 5,
        growth_potential: 5,
        management_quality: 5,
        risks: "Technical fallback active.",
        sector: "Unknown",
        verdict: "Neutral",
        confidence: "Fallback"
      };
    }
  }

  async checkStatus() {
    try {
      // Small test prompt
      await this.model.generateContent("test");
      return { status: "OK", model: "Gemini 1.5 Flash" };
    } catch (error) {
      return { status: "FAILED", error: error.message };
    }
  }
}

module.exports = new AIService();
