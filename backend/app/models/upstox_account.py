from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class UpstoxAccount(Base):
    __tablename__ = "upstox_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_type = Column(String, default="Bearer")
    expires_in = Column(Integer, nullable=True)
    
    client_id = Column(String, nullable=True) # Upstox User ID
    user_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Store full profile for caching
    profile_data = Column(JSON, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
