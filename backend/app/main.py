from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.utils.config import settings
from app.api import analysis, screener, penny_storm
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os

load_dotenv()

print("🚀 Starting AV-Screener FastAPI...")

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
    return {"status": "ok", "message": "AV-SCREENER PULSE CHECK ✅"}

# ── AI STATUS ──
@app.get("/api/ai-status")
def ai_status():
    return {"status": "OK"}

# ── GOOGLE AUTH — reads real token, returns real user ──
@app.post("/api/auth/google")
async def google_auth(request: Request):
    try:
        body       = await request.json()
        credential = body.get("credential") or body.get("token")

        if not credential:
            raise HTTPException(status_code=400, detail="No credential provided")

        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        return {
            "success": True,
            "token": credential,
            "user": {
                "name":    idinfo.get("name",    "Trader"),
                "email":   idinfo.get("email",   ""),
                "picture": idinfo.get("picture", ""),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")

# ── ROUTERS ──
app.include_router(analysis.router,     prefix="/api/analyse-stock", tags=["Analysis"])
app.include_router(screener.router,     prefix="/api/multibagger",   tags=["Multibagger"])
app.include_router(penny_storm.router,                               tags=["Penny Storm"])

# ── ENTRY POINT ──
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)