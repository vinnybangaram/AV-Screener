import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models.chat import ChatHistory
from app.services.stock_analysis_service import get_full_analysis
from app.services.news_service import get_stock_news
from app.utils.config import settings
from datetime import datetime

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

async def process_chat_query(db: Session, user_id: int, symbol: str, question: str):
    # 1. Fetch Real Context Data
    if symbol:
        stock_data = get_full_analysis(symbol)
        if not stock_data:
            return {
                "answer": f"I couldn't retrieve institutional data for {symbol}. Please verify the ticker.",
                "targetRange": "N/A",
                "confidence": "None",
                "reasoning": ["Invalid ticker or data service unavailable"]
            }
        
        news_items = get_stock_news(symbol)
        news_summary = "\n".join([f"- {n['headline']} ({n['sentiment']})" for n in news_items[:5]])

        # Build Stock Specific Prompt
        prompt = f"""
        ROLE: Senior Equity Research Analyst & AI Quant
        CONTEXT: You are analyzing {symbol} for an institutional client.
        DATA FEED: Price: ₹{stock_data['price']} | Master Score: {stock_data.get('scores', {}).get('final_score', 'N/A')} | RSI: {stock_data['technical']['rsi']:.1f}
        RECENT NEWS: {news_summary}
        USER QUESTION: {question}
        RESPONSE FORMAT: JSON ONLY per the specified schema.
        """
    else:
        # General Market Intelligence mode
        from app.services.news_service import get_market_news
        market_news = get_market_news()
        news_summary = "\n".join([f"- {n['title']} (Impact: {n['impact']})" for n in market_news[:5]])
        
        prompt = f"""
        ROLE: Global Macro Strategy Analyst
        CONTEXT: Providing broad market intelligence for the Indian Equity Market.
        RECENT MARKET NEWS:
        {news_summary}
        USER QUESTION: {question}
        STRICT RULES: Focus on macro trends, sector performance, and broad indices like Nifty/Sensex.
        RESPONSE FORMAT: JSON ONLY.
        """

    # 2. OUTPUT SCHEMA REINFORCEMENT
    prompt += """
    OUTPUT SCHEMA (JSON):
    {
      "answer": "Clear, data-backed direct response",
      "targetRange": "Expected range or index level (e.g. 'Nifty: 22100 - 22400')",
      "confidence": "AI confidence level",
      "reasoning": ["Macro point 1", "Macro point 2", "Macro point 3"]
    }
    """

    try:
        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON
        if "```json" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[-1].split("```")[0].strip()
        
        ai_response = json.loads(text)
        
        # 3. Save to History
        history_entry = ChatHistory(
            user_id=user_id,
            symbol=symbol,
            question=question,
            response=ai_response
        )
        db.add(history_entry)
        db.commit()
        
        return ai_response

    except Exception as e:
        print(f"Chat AI Error: {e}")
        return {
            "answer": "My intelligence layers are temporarily decoupled. Please try again in a few moments.",
            "targetRange": "N/A",
            "confidence": "None",
            "reasoning": [f"Error: {str(e)}"]
        }

def get_user_chat_history(db: Session, user_id: int, symbol: str = None):
    query = db.query(ChatHistory).filter(ChatHistory.user_id == user_id)
    if symbol:
        query = query.filter(ChatHistory.symbol == symbol)
    
    history = query.order_by(ChatHistory.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": h.id,
            "symbol": h.symbol,
            "question": h.question,
            "response": h.response,
            "timestamp": h.created_at.isoformat()
        } for h in history
    ]
