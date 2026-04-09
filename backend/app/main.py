from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.utils.config import settings
import os
from dotenv import load_dotenv
from app.api import analysis, screener
from app.api import penny_storm

load_dotenv()

print("🚀 Starting FastAPI app...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0"
)

# ✅ CORS Configuration (Allowing Vercel subdomains)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://av-screener.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for debugging, can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROOT (Minimal for Pulse Check)
@app.get("/")
def root():
    return {"status": "ok", "message": "AV-SCREENER PULSE CHECK ✅"}

# ✅ AI STATUS
@app.get("/api/ai-status")
def ai_status():
    return {"status": "OK"}

# 🔐 MOCK AUTH (Unblocks frontend login)
@app.post("/api/auth/google")
def google_auth(request: Request):
    return {
        "success": True,
        "token": "demo-token",
        "user": {"name": "Vinodh"}
    }

# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.environ.get("PORT", 10000))
#     uvicorn.run(app, host="0.0.0.0", port=port)


# 🔥 INCLUDE ROUTERS (THIS WAS MISSING)
# app.include_router(analysis.router, prefix="/api/analyse-stock")
# app.include_router(screener.router, prefix="/api")

app.include_router(analysis.router, prefix="/api/analyse-stock", tags=["analysis"])
# app.include_router(screener.router, prefix="/api", tags=["screener"])
app.include_router(screener.router, prefix="/api/multibagger")
app.include_router(penny_storm.router)

import os

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)