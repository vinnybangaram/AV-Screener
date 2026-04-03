import traceback
from app.data.yahoo_fetcher import fetch_stock_data, fetch_fundamentals
from app.utils.indicators import calculate_rsi, calculate_macd, calculate_sma, calculate_atr
from app.services.scoring_service import evaluate_fundamental, evaluate_momentum, evaluate_volume, evaluate_risk, calculate_final_score

# Small list of demo indices/stocks for testing
TEST_TICKERS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "L&T", "KOTAKBANK", "ZOMATO"]

def run_screener_on_tickers(tickers=TEST_TICKERS):
    results = []
    
    for ticker in tickers:
        try:
            df = fetch_stock_data(ticker, period="6mo")
            if df is None or len(df) < 50:
                continue
                
            fund = fetch_fundamentals(ticker)
            
            close = df['Close']
            high = df['High']
            low = df['Low']
            volume = df['Volume']
            
            # Indicators
            rsi = calculate_rsi(close).iloc[-1]
            macd, signal = calculate_macd(close)
            macd_val = macd.iloc[-1]
            signal_val = signal.iloc[-1]
            
            sma50 = calculate_sma(close, 50).iloc[-1]
            sma200 = calculate_sma(close, 200).iloc[-1]
            atr = calculate_atr(high, low, close).iloc[-1]
            
            vol20 = calculate_sma(volume, 20).iloc[-1]
            current_price = close.iloc[-1]
            current_vol = volume.iloc[-1]
            
            # Sub-scores
            fund_score = evaluate_fundamental(fund)
            mom_score = evaluate_momentum(
                current_price, fund.get("52WeekHigh", 0), rsi, macd_val, signal_val, 
                current_price > sma50, current_price > sma200
            )
            vol_score = evaluate_volume(current_vol, vol20)
            risk_score = evaluate_risk(atr / current_price if current_price > 0 else 1)
            
            # Sector score mock (usually fetched from indices)
            # Will set to 50 as neutral baseline for now
            sector_score = 50.0 
            
            scores = {
                "fundamental_score": fund_score,
                "momentum_score": mom_score,
                "volume_score": vol_score,
                "sector_score": sector_score,
                "risk_score": risk_score
            }
            final_score = calculate_final_score(scores)
            scores["final_score"] = final_score
            
            # Logic for confidence/signal
            if final_score > 80:
                signal_cls = "Strong Buy"
                confidence = "High"
            elif final_score >= 65:
                signal_cls = "Buy"
                confidence = "Medium"
            elif final_score >= 50:
                signal_cls = "Watchlist"
                confidence = "Low"
            else:
                signal_cls = "Ignore"
                confidence = "None"
                
            # Basic AI Reason
            reasons = []
            if fund_score >= 70: reasons.append("strong fundamentals")
            if mom_score >= 70: reasons.append("bullish momentum")
            if vol_score >= 80: reasons.append("significant volume spike")
            
            reason_str = "This stock shows " + ", ".join(reasons) if reasons else "Average performance across metrics."
            
            res = {
                "ticker": ticker,
                "company_name": ticker, # To be improved with yf info
                "current_price": round(current_price, 2),
                "score": final_score,
                "confidence_level": confidence,
                "signal_classification": signal_cls,
                "reason": reason_str,
                "scores_breakdown": scores
            }
            results.append(res)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")
            traceback.print_exc()

    # Sort descending by score
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results
