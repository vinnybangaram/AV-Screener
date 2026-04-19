from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class VerifyEmailRequest(BaseModel):
    token: str

class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: Optional[str] = None
    user: Optional[dict] = None
