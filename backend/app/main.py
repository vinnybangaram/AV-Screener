from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api import intraday, watchlist, market, notifications, news, dashboard, analysis, screener, penny_storm, chat, admin
from app.database import engine, Base
from app.models import user, watchlist as watchlist_model, notification as notification_model, screener_result, chat as chat_model
from sqlalchemy.orm import Session
from app.database import get_db
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.utils.config import settings
from datetime import datetime
import os

# Create tables
Base.metadata.create_all(bind=engine)


load_dotenv()

print("Starting AV-Screener FastAPI...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0"
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PULSE CHECK ──
@app.get("/")
def root():
    return {"status": "ok", "message": "AV-SCREENER PULSE CHECK OK"}

# ── AI STATUS ──
@app.get("/api/ai-status")
def ai_status():
    return {"status": "OK"}

# ── GOOGLE AUTH — reads real token, returns real user ──
@app.post("/api/auth/google")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    try:
        body       = await request.json()
        credential = body.get("credential") or body.get("token")

        if not credential:
            raise HTTPException(status_code=400, detail="No credential provided")

        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        email = idinfo.get("email")
        name = idinfo.get("name", "Trader")
        google_id = idinfo.get("sub")
        
        db_user = db.query(user.User).filter(user.User.email == email).first()
        if not db_user:
            db_user = user.User(
                email=email, 
                name=name, 
                google_id=google_id,
                last_login=datetime.utcnow()
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            # Update last login and google_id if not present
            db_user.last_login = datetime.utcnow()
            if not db_user.google_id:
                db_user.google_id = google_id
            db.commit()

        from app.utils.auth import create_access_token
        access_token = create_access_token(data={
            "user_id": str(db_user.id), 
            "email": db_user.email,
            "role": db_user.role
        })

        return {
            "success": True,
            "token": access_token,
            "user": {
                "id":      db_user.id,
                "name":    db_user.name,
                "email":   db_user.email,
                "role":    db_user.role,
                "picture": idinfo.get("picture", ""),
            }
        }
    except Exception as e:
        print(f"[Auth Error] {str(e)}")
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")

# ── MANUAL AUTH (DEV) ──
@app.post("/api/auth/manual")
async def manual_auth(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        email = body.get("email")
        name = body.get("name") or body.get("username")
        
        if not email or not name:
            raise HTTPException(status_code=400, detail="Missing email or username")

        db_user = db.query(user.User).filter(user.User.email == email).first()
        if not db_user:
            db_user = user.User(
                email=email, 
                name=name, 
                last_login=datetime.utcnow()
            )
            if email == "vinny009@gmail.com":
                db_user.role = "admin"
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            db_user.last_login = datetime.utcnow()
            db.commit()

        from app.utils.auth import create_access_token
        access_token = create_access_token(data={
            "user_id": str(db_user.id), 
            "email": db_user.email,
            "role": db_user.role
        })

        return {
            "success": True,
            "token": access_token,
            "user": {
                "id":      db_user.id,
                "name":    db_user.name,
                "email":   db_user.email,
                "role":    db_user.role,
                "picture": "",
            }
        }
    except Exception as e:
        print(f"[Manual Auth Error] {str(e)}")
        raise HTTPException(status_code=401, detail=f"Manual Auth failed: {str(e)}")

# ── ROUTERS ──
app.include_router(analysis.router,     prefix="/api/analyse-stock", tags=["Analysis"])
app.include_router(screener.router,     prefix="/api/multibagger",   tags=["Multibagger"])
app.include_router(penny_storm.router,                               tags=["Penny Storm"])
app.include_router(intraday.router) 
app.include_router(watchlist.router,    prefix="/api/watchlist",     tags=["Watchlist"])
app.include_router(market.router,       prefix="/api/market",        tags=["Market"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(news.router,         prefix="/api/news",          tags=["News"])
app.include_router(dashboard.router,    prefix="/api/dashboard",     tags=["Dashboard"])
app.include_router(chat.router,         prefix="/api/chat",          tags=["AI Chat"])
app.include_router(admin.router,        prefix="/api/admin",         tags=["Admin"])

# ── ENTRY POINT ──
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)