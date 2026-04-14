from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.community import Feedback, StockComment, ShareTrack
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.moderation import moderation
from app.services.share_card_service import share_card_service
from fastapi.responses import Response, HTMLResponse
from typing import List, Optional

router = APIRouter()

# --- FEEDBACK ---

@router.post("/feedback")
async def submit_feedback(
    category: str = Body(...),
    rating: int = Body(...),
    message: str = Body(...),
    page_context: str = Body(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_f = Feedback(
        user_id=current_user.id,
        category=category,
        rating=rating,
        message=moderation.sanitize(message),
        page_context=page_context
    )
    db.add(new_f)
    db.commit()
    return {"status": "success"}

# --- COMMENTS ---

@router.get("/comments/{symbol}")
async def get_comments(symbol: str, db: Session = Depends(get_db)):
    comments = db.query(StockComment).filter(
        StockComment.symbol == symbol.upper(),
        StockComment.is_flagged == False
    ).order_by(StockComment.created_at.desc()).all()
    
    # Enrich with user info
    results = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        results.append({
            "id": c.id,
            "user": {"name": user.name if user else "Trader", "picture": user.picture if user else None},
            "message": c.message,
            "likes": c.likes,
            "createdAt": c.created_at,
            "userId": c.user_id
        })
    return results

@router.post("/comments/{symbol}")
async def post_comment(
    symbol: str,
    message: str = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if moderation.is_spam(message):
        raise HTTPException(status_code=400, detail="Comment flagged as spam")
        
    new_c = StockComment(
        user_id=current_user.id,
        symbol=symbol.upper(),
        message=moderation.sanitize(message)
    )
    db.add(new_c)
    db.commit()
    return {"status": "success"}

@router.post("/comments/{comment_id}/like")
async def like_comment(comment_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    comment = db.query(StockComment).filter(StockComment.id == comment_id).first()
    if not comment: raise HTTPException(status_code=404)
    comment.likes += 1
    db.commit()
    return {"likes": comment.likes}

# --- SHARE TRACK ---

@router.post("/share/track")
async def track_share(
    symbol: str = Body(...),
    platform: str = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_track = ShareTrack(symbol=symbol.upper(), platform=platform, user_id=current_user.id)
    db.add(new_track)
    db.commit()
    return {"status": "success"}

@router.get("/share/thumbnail/{symbol}")
async def get_share_thumbnail(symbol: str):
    """
    Generates and returns a dynamic OG image for a specific stock.
    Used for social media link previews.
    """
    img_data = share_card_service.generate_stock_card(symbol)
    return Response(content=img_data, media_type="image/png")

@router.get("/share/v/{symbol}", response_class=HTMLResponse)
async def share_proxy_page(symbol: str):
    """
    Open Graph Proxy Page.
    Returns meta tags for crawlers (WhatsApp, Twitter) and redirects users to the app.
    """
    # In production, this would be your actual domain
    base_url = "http://localhost:8000" 
    frontend_url = f"http://localhost:5173/analyse-stock?symbol={symbol}" # Vite default port
    thumbnail_url = f"{base_url}/api/share/thumbnail/{symbol}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{symbol} | AV Screener Analysis</title>
        <meta name="description" content="Institutional terminal analysis for {symbol} on AV Screener.">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{base_url}/api/share/v/{symbol}">
        <meta property="og:title" content="{symbol} Quantitative Analysis - AV Screener">
        <meta property="og:description" content="View real-time confluence scores, trade setups, and price targets.">
        <meta property="og:image" content="{thumbnail_url}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{base_url}/api/share/v/{symbol}">
        <meta property="twitter:title" content="{symbol} Analysis | AV Screener">
        <meta property="twitter:description" content="Quant-driven institutional decision terminal for Indian equities.">
        <meta property="twitter:image" content="{thumbnail_url}">

        <script>
            // Instant redirect to frontend
            window.location.href = "{frontend_url}";
        </script>
    </head>
    <body style="background: #0f172a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
            <h2 style="color: #6366f1;">Entering Institutional Terminal...</h2>
            <p style="opacity: 0.6;">Loading {symbol} analysis module</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
