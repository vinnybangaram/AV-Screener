import os
import google.generativeai as genai
import json
from typing import Dict, Any
from app.utils.config import settings

# Load API key from settings
GEMINI_API_KEY = settings.GEMINI_API_KEY

def get_ai_analysis(tech_data: Dict[str, Any]) -> Dict[str, str]:
    """Generates AI analysis based on technical indicators using Google Gemini."""
    
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY missing - using static fallback for analysis")
        return get_fallback_analysis(tech_data)

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        prompt = f"""
        Analyze the following institutional stock data for {tech_data['ticker']} and provide a professional-grade synthesis:
        
        1. STRATEGIC SUMMARY (Max 3 lines): High-level outlook based on fundamental/technical alignment.
        2. BUSINESS QUALITY (1-10): Score based on ROE and fundamentally solid metrics.
        3. GROWTH POTENTIAL (1-10): Score based on trend and volume momentum.
        4. MANAGEMENT QUALITY (1-10): Estimate between 5-10 based on debt levels (low debt = high management score).
        5. VERDICT: Single word (Bullish / Neutral / Bearish).
        6. RISKS: Short sentence describing key potential risks based on valuation/debt.
        7. CONFIDENCE: "High" or "Moderate" based on data clarity.

        KEY DATA PAYLOAD:
        * PRICE: ₹{tech_data['price']} ({tech_data['change_pct']:.2f}% change)
        * MASTER SCORE: {tech_data.get('scores', {}).get('final_score', 'N/A')} ({tech_data.get('scores', {}).get('classification', 'N/A')})
        * DURABILITY: {tech_data.get('scores', {}).get('durability', {}).get('score', 'N/A')}/100
        * VALUATION: {tech_data.get('scores', {}).get('valuation', {}).get('score', 'N/A')}/100 ({tech_data.get('scores', {}).get('valuation', {}).get('label', 'N/A')})
        * RSI: {tech_data['technical']['rsi']:.1f} | MFI: {tech_data['technical']['mfi']:.1f}
        * TREND: {tech_data['technical']['trend']} vs 50/200 DMA
        * 1Y PERFORMANCE: {tech_data['technical']['performance']['1y']:.1f}%
        * VOLUME STATUS: {tech_data['volume']['status']} ({tech_data['volume']['ratio']:.1f}x vs 20d avg)
        * FUNDAMENTALS: ROE: {tech_data['fundamentals']['roe']*100:.1f}%, Debt/Equity: {tech_data['fundamentals']['debt_to_equity']:.2f}

        Return only a valid JSON object:
        {{
          "summary": "...",
          "business_quality": 8,
          "growth_potential": 7,
          "management_quality": 8,
          "verdict": "Bullish",
          "risks": "...",
          "confidence": "High"
        }}
        """
        
        print("🔥 [DEBUG] Calling Gemini with model parameter: models/gemini-2.5-flash")
        response = model.generate_content(prompt)
        text = response.text
        
        # Simple extraction in case the model returns code blocks
        if "```json" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[-1].split("```")[0].strip()

        return json.loads(text)
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return get_fallback_analysis(tech_data)

def get_fallback_analysis(tech_data: Dict[str, Any]) -> Dict[str, str]:
    """Standardized rule-based fallback if LLM is unavailable."""
    # Use safer access for the new technical structure
    technical = tech_data.get('technical', {})
    trend = technical.get('trend', 'Neutral')
    rsi = technical.get('rsi', 50)
    macd = technical.get('macd', {"status": "Neutral"})
    
    summary = f"This stock is currently in a {trend.lower()} phase."
    if rsi > 70:
        summary += " Caution is advised as RSI indicates overbought conditions."
    elif rsi < 30:
        summary += " Potential reversal zone as RSI indicates oversold conditions."
    
    if macd.get('status') == "Bullish":
        summary += " MACD shows a bullish crossover supporting momentum."
        
    outlook = "Bullish" if trend == "Uptrend" else "Bearish" if trend == "Downtrend" else "Neutral"
    
    return {
        "summary": summary,
        "business_quality": 6,
        "growth_potential": 8 if trend == "Uptrend" else 4,
        "management_quality": 6,
        "verdict": outlook,
        "risks": "General market volatility and macroeconomic uncertainties.",
        "confidence": "Low"
    }
