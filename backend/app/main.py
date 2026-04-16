from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    intraday, watchlist, market, notifications, news,
    dashboard, analysis, screener, penny_storm, chat,
    admin, forecast, confluence, trade_setup, price_target,
    alerts, community, activity,
    stock_chart,                       # ← NEW
)
from app.database import engine, Base
from app.models import (
    user,
    watchlist   as watchlist_model,
    notification as notification_model,
    screener_result,
    chat        as chat_model,
    daily_price,                       # ← NEW: ensures table is created
)
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
    "https://av-screener.vercel.app",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(o) for o in origins if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PULSE CHECK ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "AV-SCREENER PULSE CHECK OK"}

@app.get("/api/ai-status")
def ai_status():
    return {"status": "OK"}

# ── GOOGLE AUTH ───────────────────────────────────────────────────────────────
@app.post("/api/auth/google")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    try:
        body       = await request.json()
        credential = body.get("credential") or body.get("token")

        if not credential:
            raise HTTPException(status_code=400, detail="No credential provided")

        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip().replace('"', '').replace("'", "")
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google Auth misconfigured on server")

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=30,
            )
        except Exception as ve:
            raise HTTPException(status_code=401, detail=f"Google token verification failed: {ve}")

        email     = idinfo.get("email")
        name      = idinfo.get("name", "Trader")
        google_id = idinfo.get("sub")

        try:
            db_user = db.query(user.User).filter(user.User.email == email).first()
            if not db_user:
                db_user = user.User(
                    email         = email,
                    name          = name,
                    avatar_url    = idinfo.get("picture", ""),
                    google_id     = google_id,
                    last_login_at = datetime.utcnow(),
                    login_count   = 1,
                )
                if email == "vinny009@gmail.com":
                    db_user.role = "admin"
                db.add(db_user)
            else:
                db_user.last_login_at = datetime.utcnow()
                db_user.login_count  += 1
                db_user.name          = name
                db_user.avatar_url    = idinfo.get("picture", "")
                if not db_user.google_id:
                    db_user.google_id = google_id

            db.commit()
            db.refresh(db_user)

            db.add(user.ActivityEvent(user_id=db_user.id, event_type="login"))
            db.commit()

        except Exception as de:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database sync failed: {de}")

        from app.utils.auth import create_access_token
        access_token = create_access_token(data={
            "user_id": str(db_user.id),
            "email":   db_user.email,
            "role":    db_user.role,
        })

        return {
            "success": True,
            "token":   access_token,
            "user": {
                "id":     db_user.id,
                "name":   db_user.name,
                "email":  db_user.email,
                "role":   db_user.role,
                "plan":   db_user.plan,
                "avatar": db_user.avatar_url,
            },
        }
    except HTTPException:
        raise
    except Exception as ge:
        print(f"❌ [Global Auth Error] {ge}")
        raise HTTPException(status_code=401, detail="Authentication encountered a critical error")


# ── MANUAL AUTH (DEV) ─────────────────────────────────────────────────────────
@app.post("/api/auth/manual")
async def manual_auth(request: Request, db: Session = Depends(get_db)):
    try:
        body  = await request.json()
        email = body.get("email")
        name  = body.get("name") or body.get("username")

        if not email or not name:
            raise HTTPException(status_code=400, detail="Missing email or username")

        db_user = db.query(user.User).filter(user.User.email == email).first()
        if not db_user:
            db_user = user.User(
                email         = email,
                name          = name,
                last_login_at = datetime.utcnow(),
                login_count   = 1,
            )
            if email == "vinny009@gmail.com":
                db_user.role = "admin"
            db.add(db_user)
        else:
            db_user.last_login_at = datetime.utcnow()
            db_user.login_count  += 1
            db_user.name          = name

        db.commit()
        db.refresh(db_user)

        db.add(user.ActivityEvent(user_id=db_user.id, event_type="login_manual"))
        db.commit()

        from app.utils.auth import create_access_token
        access_token = create_access_token(data={
            "user_id": str(db_user.id),
            "email":   db_user.email,
            "role":    db_user.role,
        })

        return {
            "success": True,
            "token":   access_token,
            "user": {
                "id":     db_user.id,
                "name":   db_user.name,
                "email":  db_user.email,
                "role":   db_user.role,
                "plan":   db_user.plan,
                "avatar": "",
            },
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Manual Auth failed: {e}")


# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(analysis.router,      prefix="/api/analyse-stock",  tags=["Analysis"])
app.include_router(screener.router,      prefix="/api/multibagger",    tags=["Multibagger"])
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


# ── STARTUP ───────────────────────────────────────────────────────────────────
from app.services.alerts_scheduler import scheduler

@app.on_event("startup")
async def startup_event():
    try:
        scheduler.start()
        print("[Startup] Background scheduler active.")
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