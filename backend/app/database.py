from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# from app.config import settings
from app.utils.config import settings


# Handle SQLite vs Postgres/Cloud DBs
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Optimized engine configuration for pooled environments (like Render + Supabase)
if db_url.startswith("postgresql"):
    engine = create_engine(
        db_url,
        # Extremeley low pool size for Supabase Session Mode compatibility
        # Total connections per instance = pool_size + max_overflow
        pool_size=2,
        max_overflow=0, 
        pool_pre_ping=True,
        pool_recycle=1800,
    )
else:
    engine = create_engine(
        db_url, connect_args=connect_args
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
