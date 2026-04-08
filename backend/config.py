import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "High Accuracy Indian Stock Screener"
    DATABASE_URL: str = "sqlite:///./screener.db"
    DEBUG: bool = True
    CACHE_TIMEOUT: int = 3600 # seconds for cache validity (1 hour)
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
