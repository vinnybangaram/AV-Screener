from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReportBase(BaseModel):
    title: str
    report_type: str
    metadata_json: Optional[dict] = None

class ReportGenerate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    user_id: int
    summary: Optional[str] = None
    file_path: Optional[str]
    size_bytes: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
