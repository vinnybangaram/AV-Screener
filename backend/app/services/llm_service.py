import os
import google.generativeai as genai
import json
from typing import Dict, Any
# from app.config import settings
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
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Analyze the following institutional stock data for {tech_data['ticker']} and provide a professional-grade synthesis:
        
        1. STRATEGIC SUMMARY (Max 3 lines): High-level outlook based on fundamental/technical alignment.
        2. STRENGTH (Strong / Moderate / Weak): Based on the Master Score of {tech_data.get('scores', {}).get('final_score', 'N/A')}.
        3. RISK LEVEL (High / Moderate / Low): Based on Valuation and Debt status.
        4. OUTLOOK (Bullish / Neutral / Bearish): Short-to-medium term projection.

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
          "strength": "...",
          "risk": "...",
          "outlook": "..."
        }}
        """
        
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
        
    outlook = "Bullish" if trend == "Uptrend" else "Bearish" if trend == "Downtrend" else "Sideways"
    
    return {
        "summary": summary,
        "strength": "Moderate" if trend == "Uptrend" else "Weak",
        "risk": "Moderate",
        "outlook": outlook
    }
