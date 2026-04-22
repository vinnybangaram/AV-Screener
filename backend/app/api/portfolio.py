from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.portfolio import PortfolioHolding
from app.schemas.portfolio import HoldingCreate, HoldingUpdate, HoldingResponse, PortfolioSummary
from app.services.portfolio_service import portfolio_service
from typing import List

router = APIRouter()

@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Fetches the entire portfolio summary with live prices and metrics.
    """
    return await portfolio_service.get_portfolio_summary(db, user.id)

@router.get("/holdings", response_model=List[HoldingResponse])
async def get_holdings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get all active holdings for the user.
    """
    holdings = db.query(PortfolioHolding).filter(
        PortfolioHolding.user_id == user.id,
        PortfolioHolding.is_active == True
    ).all()
    # Note: These won't have current_price here unless we update them in a loop
    return holdings

@router.post("/holdings", response_model=HoldingResponse)
async def add_holding(
    holding_in: HoldingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Add a new stock holding to the portfolio.
    """
    holding = PortfolioHolding(
        **holding_in.dict(),
        user_id=user.id
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding

@router.patch("/holdings/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: int,
    holding_in: HoldingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Update an existing holding (quantity or avg price).
    """
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.id == holding_id,
        PortfolioHolding.user_id == user.id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
        
    update_data = holding_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(holding, field, value)
        
    db.commit()
    db.refresh(holding)
    return holding

@router.delete("/holdings/{holding_id}")
async def delete_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Soft-delete/Remove a holding from the active portfolio.
    """
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.id == holding_id,
        PortfolioHolding.user_id == user.id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
        
    holding.is_active = False
    db.commit()
    return {"success": True, "message": "Holding removed"}
