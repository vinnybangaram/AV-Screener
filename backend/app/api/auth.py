from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, ActivityEvent
from app.schemas.auth import SignupRequest, VerifyEmailRequest, AuthResponse, LoginRequest
from app.utils.auth import get_password_hash, verify_password, create_access_token
from app.services.notification_service import send_email_notification
from app.utils.config import settings
import uuid
from datetime import datetime
import os
import asyncio
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
def signup():
    raise HTTPException(status_code=403, detail="Registration is currently disabled. Access is invite-only via Terminal admin.")

@router.post("/verify-email", response_model=AuthResponse)
def verify_email():
    raise HTTPException(status_code=403, detail="Verification system is currently offline.")

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.email == req.username_or_email) | (User.name == req.username_or_email)).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")

    user.last_login_at = datetime.utcnow()
    user.login_count += 1
    db.commit()

    token = create_access_token(data={"user_id": str(user.id), "email": user.email, "role": user.role})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan
        }
    }

# --- Move existing Google/Manual login here for consistency ---

@router.post("/google")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    try:
        body       = await request.json()
        credential = body.get("credential") or body.get("token")

        if not credential:
            print("❌ [Google Auth] Missing credential in body")
            raise HTTPException(status_code=400, detail="No credential provided")

        print(f"🔵 [Google Auth] Received token, verifying...")
        # Clean the Client ID just in case it's wrapped in quotes from Render/env
        client_id = settings.GOOGLE_CLIENT_ID.strip().replace('"', '').replace("'", "")
        
        if not client_id:
            raise HTTPException(status_code=500, detail="Google Auth misconfigured on server: GOOGLE_CLIENT_ID is missing")

        try:
            # Run the synchronous verification in a thread with a 10s timeout
            idinfo = await asyncio.wait_for(
                asyncio.to_thread(
                    id_token.verify_oauth2_token,
                    credential,
                    google_requests.Request(),
                    client_id,
                    clock_skew_in_seconds=30
                ),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="Google Identity Service timed out. Please try again.")
        except ValueError as ve:
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(ve)}")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Google Auth failed: {str(e)}")

        email     = idinfo.get("email")
        name      = idinfo.get("name", "Trader")
        google_id = idinfo.get("sub")

        db_user = db.query(User).filter(User.email == email).first()
        if not db_user:
            db_user = User(
                email         = email,
                name          = name,
                avatar_url    = idinfo.get("picture", ""),
                google_id     = google_id,
                is_verified   = True, # Google users are pre-verified
                last_login_at = datetime.utcnow(),
                login_count   = 1,
            )
            if email == "vinny009@gmail.com":
                db_user.role = "admin"
            db.add(db_user)
        else:
            db_user.last_login_at = datetime.utcnow()
            db_user.login_count  += 1
            db_user.name          = name
            db_user.avatar_url    = idinfo.get("picture", "")
            if not db_user.google_id:
                db_user.google_id = google_id

        db.commit()
        db.refresh(db_user)

        db.add(ActivityEvent(user_id=db_user.id, event_type="login_google"))
        db.commit()

        token = create_access_token(data={"user_id": str(db_user.id), "email": db_user.email, "role": db_user.role})

        return {
            "success": True,
            "token":   token,
            "user": {
                "id":     db_user.id,
                "name":   db_user.name,
                "email":  db_user.email,
                "role":   db_user.role,
                "avatar": db_user.avatar_url,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google Auth failed: {e}")

@router.post("/manual")
async def manual_auth(request: Request, db: Session = Depends(get_db)):
    body  = await request.json()
    email = body.get("email")
    name  = body.get("name") or body.get("username")

    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        db_user = User(
            email         = email,
            name          = name,
            is_verified   = True, 
            last_login_at = datetime.utcnow(),
            login_count   = 1,
        )
        db.add(db_user)
    else:
        db_user.last_login_at = datetime.utcnow()
        db_user.login_count  += 1

    db.commit()
    db.refresh(db_user)

    token = create_access_token(data={"user_id": str(db_user.id), "email": db_user.email, "role": db_user.role})

    return {
        "success": True,
        "token":   token,
        "user": {
            "id":     db_user.id,
            "name":   db_user.name,
            "email":  db_user.email,
            "role":   db_user.role,
        },
    }
