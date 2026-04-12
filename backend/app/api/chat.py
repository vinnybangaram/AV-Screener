from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ai_chat_service import process_chat_query, get_user_chat_history
from app.utils.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    symbol: Optional[str] = None
    question: str

router = APIRouter()

@router.post("/ask")
async def ask_analyst(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Normalize symbol: handle "null" string from JS or actual null
        symbol = request.symbol
        if symbol == "null" or symbol == "":
            symbol = None
            
        response = await process_chat_query(db, current_user.id, symbol, request.question)
        return response
    except Exception as e:
        print(f"Chat API Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(
    symbol: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if symbol == "null": symbol = None
    return get_user_chat_history(db, current_user.id, symbol)
