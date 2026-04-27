import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import user as user_model

SECRET_KEY = os.getenv("JWT_SECRET", "88282828282828282828282828282828") # High entropy default
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12 # 12 Hours

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

import hashlib

def get_password_hash(password):
    # Fixed 64-char input for the hasher
    pw_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(pw_hash)

def verify_password(plain_password, hashed_password):
    pw_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(pw_hash, hashed_password)

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

# Simple In-Memory User Cache to reduce DB load
_user_cache = {} # {user_id: (timestamp, user_object)}
USER_CACHE_TTL = 60 # 1 minute

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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Check Cache FIRST
    now = datetime.utcnow()
    if user_id in _user_cache:
        cached_time, cached_user = _user_cache[user_id]
        if (now - cached_time).total_seconds() < USER_CACHE_TTL:
            return cached_user

    # Cache Miss -> Query DB
    user = db.query(user_model.User).filter(user_model.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    
    # Update Cache
    _user_cache[user_id] = (now, user)
    return user

def require_admin(user: user_model.User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
