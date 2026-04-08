from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# In the future, we will import routers
# from app.api import screener, stocks, alerts

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)

# Set up CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROOT
@app.get("/")
def root():
    return {"message": "API WORKING ✅"}

# ✅ MULTIBAGGER
@app.get("/api/multibagger")
def multibagger():
    return {
        "success": True,
        "data": [],
        "message": "Multibagger working"
    }

# ✅ AI STATUS
@app.get("/api/ai-status")
def ai_status():
    return {"status": "ok"}

from app.api import screener, analysis
app.include_router(screener.router, prefix="/api/screener", tags=["screener"])
app.include_router(analysis.router, prefix="/api/analyse-stock", tags=["analysis"])
