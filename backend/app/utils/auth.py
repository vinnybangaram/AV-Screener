import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import user as user_model

SECRET_KEY = os.getenv("JWT_SECRET", "88282828282828282828282828282828") # High entropy default
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12 # 12 Hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/google", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        print("[Auth Error] No token received in Authorization header")
        raise credentials_exception
        
    try:
        print(f"[Auth Info] Validating token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        print(f"[Auth Success] Decoded User ID: {user_id}")
        if user_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        print("[Auth Error] Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        print(f"[Auth Error] JWT Decode Error: {str(e)}")
        raise credentials_exception
        
    user = db.query(user_model.User).filter(user_model.User.id == int(user_id)).first()
    if user is None:
        print(f"[Auth Error] User {user_id} not found in database")
        raise credentials_exception
    return user

def require_admin(user: user_model.User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
