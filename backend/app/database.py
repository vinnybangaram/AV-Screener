from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# from app.config import settings
from app.utils.config import settings


# Handle SQLite vs Postgres/Cloud DBs
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Strip pgbouncer=true if user added it (psycopg2 doesn't like it)
if "?pgbouncer=true" in db_url:
    db_url = db_url.replace("?pgbouncer=true", "")
elif "&pgbouncer=true" in db_url:
    db_url = db_url.replace("&pgbouncer=true", "")

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Optimized engine configuration for pooled environments (like Render + Supabase)
if db_url.startswith("postgresql"):
    engine = create_engine(
        db_url,
        # NullPool is recommended for PgBouncer / Serverless DBs (Render/Supabase)
        # It ensures we don't hold onto stale connections that the server closes.
        poolclass=NullPool,
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
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
