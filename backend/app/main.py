from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.utils.config import settings
import os
from dotenv import load_dotenv
from app.api import analysis, screener

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

# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.environ.get("PORT", 10000))
#     uvicorn.run(app, host="0.0.0.0", port=port)


# 🔥 INCLUDE ROUTERS (THIS WAS MISSING)
# app.include_router(analysis.router, prefix="/api/analyse-stock")
# app.include_router(screener.router, prefix="/api")

app.include_router(analysis.router, prefix="/api/analyse-stock", tags=["analysis"])
app.include_router(screener.router, prefix="/api", tags=["screener"])