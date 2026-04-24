import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "High Accuracy Indian Stock Screener"
    DATABASE_URL: str = "sqlite:///./screener.db"
    DEBUG: bool = True
    CACHE_TIMEOUT: int = 3600 # seconds for cache validity (1 hour)
    GEMINI_API_KEY: str = ""
    FINNHUB_API_KEY: str = ""
    ALPHA_VANTAGE_API_KEY: str = ""
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"
    GOOGLE_CLIENT_ID: str = ""
    UPSTOX_API_KEY: str = "2a81cbb3-648c-4e71-8731-6bbdfbdc7e39"

    UPSTOX_API_SECRET: str = "hxdqx4ofkg"
    UPSTOX_REDIRECT_URI: str = "http://127.0.0.1:5173/upstox/callback"
    UPSTOX_BASE_URL: str = "https://api.upstox.com/v2"
    
    BASE_URL: str = "http://localhost:5000"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
