from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.backtest import BacktestRequest, BacktestResponse
from app.services.backtest_service import backtest_service
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/backtest", tags=["Backtesting Engine"])

@router.post("/run", response_model=BacktestResponse)
async def run_strategy_backtest(
    request: BacktestRequest,
    user: User = Depends(get_current_user)
):
    """
    Run a technical strategy backtest on historical OHLCV data.
    """
    results = await backtest_service.run_backtest(
        strategy_id     = request.strategy_id,
        symbol          = request.symbol,
        start_date      = request.start_date,
        end_date        = request.end_date,
        initial_capital = request.initial_capital,
        risk_pct        = request.risk_pct
    )
    
    if not results:
        raise HTTPException(status_code=400, detail="Insufficient historical data for this symbol/range.")
        
    return results
