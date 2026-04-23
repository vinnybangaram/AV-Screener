from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..services.option_signals_service import option_signals_service, run_option_signals_job
from ..schemas.option_signal import (
    OptionTradeResponse, 
    OptionSettingsResponse, 
    OptionSettingsUpdate,
    OptionSignalsDashboard
)
from ..models.option_signal import OptionSettings, OptionTrade
from ..models.user import User
# Import auth dependencies if needed, for now using a simple approach
# from ..utils.auth import get_current_user

router = APIRouter(prefix="/option-signals", tags=["Option Signals"])

@router.get("/dashboard", response_model=OptionSignalsDashboard)
async def get_dashboard(db: Session = Depends(get_db), user_id: Optional[int] = None):
    """Returns the current state of the Option Signals engine and recent trades."""
    return await option_signals_service.get_dashboard_summary(db, user_id)

@router.get("/history", response_model=List[OptionTradeResponse])
async def get_history(
    from_date: Optional[str] = None, 
    to_date: Optional[str] = None, 
    db: Session = Depends(get_db), 
    user_id: Optional[int] = None
):
    """Returns the trade history with date range filtering."""
    query = db.query(OptionTrade).filter(OptionTrade.status == "CLOSED")
    
    if from_date:
        query = query.filter(OptionTrade.execution_time >= datetime.fromisoformat(from_date))
    if to_date:
        # Add 1 day to to_date to include the full day
        end = datetime.fromisoformat(to_date) + timedelta(days=1)
        query = query.filter(OptionTrade.execution_time < end)
        
    if user_id:
        query = query.filter(OptionTrade.user_id == user_id)
    return query.order_by(OptionTrade.execution_time.desc()).all()

@router.get("/stats")
async def get_stats(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    days: int = 30, 
    db: Session = Depends(get_db), 
    user_id: Optional[int] = None
):
    """Returns historical stats and equity curve data."""
    # If explicit dates provided, use them, otherwise use 'days'
    if from_date and to_date:
        start = datetime.fromisoformat(from_date)
        end = datetime.fromisoformat(to_date) + timedelta(days=1)
        return await option_signals_service.get_historical_stats(db, user_id, start_date=start, end_date=end)
    
    return await option_signals_service.get_historical_stats(db, user_id, days=days)

@router.get("/export")
async def export_trades(db: Session = Depends(get_db), user_id: Optional[int] = None):
    """Exports trade history to an Excel file."""
    excel_file = await option_signals_service.export_trades_to_excel(db, user_id)
    headers = {
        'Content-Disposition': 'attachment; filename="trade_history.xlsx"'
    }
    return Response(
        content=excel_file.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@router.get("/settings", response_model=OptionSettingsResponse)
async def get_settings(db: Session = Depends(get_db), user_id: Optional[int] = None):
    """Fetches user settings for the Ignite Engine."""
    settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
    if not settings:
        # Create default settings
        settings = OptionSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.post("/settings", response_model=OptionSettingsResponse)
async def update_settings(
    settings_update: OptionSettingsUpdate, 
    db: Session = Depends(get_db), 
    user_id: Optional[int] = None
):
    """Updates user settings for the Ignite Engine."""
    settings = db.query(OptionSettings).filter(OptionSettings.user_id == user_id).first()
    if not settings:
        settings = OptionSettings(user_id=user_id)
        db.add(settings)
    
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings

@router.post("/force-sync")
async def force_sync(background_tasks: BackgroundTasks):
    """Manually triggers a signal scan (handy for testing)."""
    background_tasks.add_task(run_option_signals_job)
    return {"message": "Sync job started in background"}
