/**
 * Multibagger Probability Engine (MPE) - Hybrid Intelligence Model
 * Institutional-grade scoring for identifying high-conviction growth stocks.
 */

class ScoringEngine {
  constructor() {
    this.WEIGHTS = {
      realTimeMomentum: 0.35,
      priceStructure: 0.20,
      aiQuality: 0.25,
      risk: 0.20
    };
  }

  /**
   * Main scoring function
   * @param {Object} marketData - Price/Volume data from Yahoo v8
   * @param {Object} aiData - Qualitative insights from Gemini
   * @returns {Object} { score, breakdown, classification, riskLevel }
   */
  calculateScore(marketData, aiData) {
    const {
      currentPrice,
      dma200,
      volumeSpike,
      trendUp,
      near52WeekHigh,
      higherHighs,
      lowVolatility,
      noSharpSpikes
    } = marketData;

    const {
       business_quality,
       growth_potential,
       management_quality
    } = aiData;

    // 1. Real-Time Momentum (35%)
    let momentumScore = 0;
    if (currentPrice > dma200) momentumScore += 40;
    if (volumeSpike) momentumScore += 30;
    if (trendUp) momentumScore += 30;

    // 2. Price Structure (20%)
    let structureScore = 0;
    if (near52WeekHigh) structureScore += 50;
    if (higherHighs) structureScore += 50;

    // 3. AI Quality Score (25%)
    const avgQuality = (business_quality + growth_potential + management_quality) / 3;
    const aiQualityScore = Math.min(100, Math.round(avgQuality * 10));

    // 4. Risk Score (20%)
    let riskScore = 0;
    if (lowVolatility) riskScore += 50;
    if (noSharpSpikes) riskScore += 50;

    // 5. FINAL WEIGHTED CALCULATION
    const finalScore = (
      (momentumScore * this.WEIGHTS.realTimeMomentum) +
      (structureScore * this.WEIGHTS.priceStructure) +
      (aiQualityScore * this.WEIGHTS.aiQuality) +
      (riskScore * this.WEIGHTS.risk)
    );

    // 6. Classification & Risk Level
    let classification = "❌ Avoid";
    let riskLevel = "High";

    if (finalScore >= 80) {
      classification = "🔥 High Probability Multibagger";
      riskLevel = "Low";
    } else if (finalScore >= 60) {
      classification = "⚡ Emerging Growth";
      riskLevel = "Medium";
    } else if (finalScore >= 40) {
      classification = "⚠️ Watchlist";
      riskLevel = "Medium";
    }

    return {
      score: Math.round(finalScore),
      breakdown: {
        momentum: { score: momentumScore, weight: 35, achieved: Math.round(momentumScore * 0.35) },
        structure: { score: structureScore, weight: 20, achieved: Math.round(structureScore * 0.20) },
        aiQuality: { score: aiQualityScore, weight: 25, achieved: Math.round(aiQualityScore * 0.25) },
        risk: { score: riskScore, weight: 20, achieved: Math.round(riskScore * 0.20) }
      },
      classification,
      riskLevel
    };
  }
}

module.exports = new ScoringEngine();
