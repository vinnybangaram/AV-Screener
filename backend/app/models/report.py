from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String)
    report_type = Column(String) # 'daily', 'weekly', 'portfolio', 'sector', 'ai'
    summary = Column(String, nullable=True) # AI or system generated summary of the report
    file_path = Column(String, nullable=True) # Path to PDF or storage URL
    size_bytes = Column(Integer, default=0)
    status = Column(String, default="completed") # 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store settings used for generation if any
    metadata_json = Column(JSON, nullable=True)

    user = relationship("User", back_populates="reports")
