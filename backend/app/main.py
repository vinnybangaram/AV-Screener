from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    intraday, watchlist, market, notifications, news,
    dashboard, analysis, screener, penny_storm, chat,
    admin, forecast, confluence, trade_setup, price_target,
    alerts, community, activity, auth,
    stock_chart,                       # ← NEW
    stocks,                            # ← NEW
    portfolio_health,                  # ← NEW
    multibagger,                       # ← NEW
    option_signals,                    # ← NEW
    portfolio,                         # ← NEW
    backtest,                          # ← NEW
    reports,                           # ← NEW
    upstox,                            # ← NEW
)
from app.database import engine, Base, SessionLocal
from app.models import (
    user,
    watchlist   as watchlist_model,
    notification as notification_model,
    screener_result,
    chat        as chat_model,
    daily_price,                       # ← NEW: ensures table is created
    market_regime,                     # ← NEW
    conviction,                        # ← NEW
    portfolio_health as portfolio_health_model, # ← NEW: aliased to avoid collision
    portfolio as portfolio_model,      # ← NEW
    backtest as backtest_model,        # ← NEW
    report as report_model,            # ← NEW
    news as news_model,              # ← NEW
    intraday_history,                  # ← NEW
    dashboard_cache,                   # ← NEW
    option_signal,                     # ← NEW
    upstox_account,                    # ← NEW
)
from app.jobs.daily_intraday_scan import job_daily_intraday_scan
from app.jobs.cleanup_expired import job_cleanup_expired
from sqlalchemy.orm import Session
from app.database import get_db
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.utils.config import settings
from datetime import datetime
import os
from app.startup_migrations import run_migrations

# 1. Run idempotent column migrations FIRST
run_migrations()

# 2. Create any brand-new tables (including stock_daily_prices)
Base.metadata.create_all(bind=engine)

load_dotenv()

print("Starting AV-Screener FastAPI…")

app = FastAPI(title=settings.PROJECT_NAME, version="2.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://av-screener.vercel.app",
    "https://av-screener-vinnybangaram.vercel.app", # Potential alternative
    "https://av-screener.onrender.com",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception: {exc}")
    traceback.print_exc()
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers=headers
    )

# ── PULSE CHECK ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "AV-SCREENER PULSE CHECK OK"}

@app.get("/api/ai-status")
def ai_status():
    return {"status": "OK"}

# Auth logic moved to app.api.auth


# Manual auth moved to app.api.auth


# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",           tags=["Auth"])
app.include_router(analysis.router,      prefix="/api/analyse-stock",  tags=["Analysis"])
app.include_router(screener.router,      prefix="/api/market/screener", tags=["AI Screener"])
app.include_router(penny_storm.router,                                  tags=["Penny Storm"])
app.include_router(intraday.router)
app.include_router(watchlist.router,     prefix="/api/watchlist",      tags=["Watchlist"])
app.include_router(market.router,        prefix="/api/market",         tags=["Market"])
app.include_router(notifications.router, prefix="/api/notifications",  tags=["Notifications"])
app.include_router(news.router,          prefix="/api/news",           tags=["News"])
app.include_router(dashboard.router,     prefix="/api/dashboard",      tags=["Dashboard"])
app.include_router(chat.router,          prefix="/api/chat",           tags=["AI Chat"])
app.include_router(admin.router,         prefix="/api/admin",          tags=["Admin"])
app.include_router(forecast.router,      prefix="/api",                tags=["Forecast"])
app.include_router(confluence.router,    prefix="/api",                tags=["Decision Score"])
app.include_router(trade_setup.router,   prefix="/api",                tags=["Trade Planning"])
app.include_router(price_target.router,  prefix="/api",                tags=["Market Forecasts"])
app.include_router(alerts.router,        prefix="/api",                tags=["Market Surveillance"])
app.include_router(community.router,     prefix="/api",                tags=["Community & Growth"])
app.include_router(activity.router,      prefix="/api/activity",       tags=["Intelligence"])
app.include_router(stock_chart.router,   prefix="/api",                tags=["Charts"])   # ← NEW
app.include_router(stocks.router,        prefix="/api/stocks",         tags=["Conviction"]) # ← NEW
app.include_router(portfolio_health.router, prefix="/api/portfolio",    tags=["Portfolio Health"]) # ← NEW
app.include_router(multibagger.router) # ← NEW
app.include_router(option_signals.router, prefix="/api") # ← NEW
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"]) # ← NEW
app.include_router(backtest.router, tags=["Backtesting"]) # ← NEW
app.include_router(reports.router) # ← NEW
app.include_router(upstox.router, prefix="/api") # ← NEW


# ── STARTUP ───────────────────────────────────────────────────────────────────
from app.services.alerts_scheduler import scheduler

@app.on_event("startup")
async def startup_event():
    try:
        scheduler.start()
        print("[Startup] Background scheduler active.")
        
        # Check for missed intraday scan if market is open or past scan time
        from datetime import time
        from sqlalchemy import func
        now = datetime.now()
        if now.weekday() < 5 and now.time() > time(9, 15):
            db = SessionLocal()
            try:
                # Check if scan already run today
                today_picks = db.query(watchlist_model.WatchlistPosition).filter(
                    watchlist_model.WatchlistPosition.category == "intraday",
                    func.date(watchlist_model.WatchlistPosition.added_at) == now.date(),
                    watchlist_model.WatchlistPosition.is_auto_generated == True
                ).first()
                
                if not today_picks:
                    print("[Startup] Missed intraday scan detected. Running immediate scan...")
                    await job_cleanup_expired()
                    await job_daily_intraday_scan()
            finally:
                db.close()

        print("[Startup] Scheduled jobs:")
        for job in scheduler.get_jobs():
            print(f"          • {job.name} — next: {job.next_run_time}")
    except Exception as e:
        print(f"[Startup] Scheduler failed to start: {e}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)