from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.database import Base
from datetime import datetime

class DashboardCache(Base):
    __tablename__ = "dashboard_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    tab = Column(String) # investment | intraday
    filter_type = Column(String) # today | week | month | year
    metrics_json = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
