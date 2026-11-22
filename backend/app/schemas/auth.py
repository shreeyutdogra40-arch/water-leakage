from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.user import UserRole

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[UserRole] = UserRole.RESIDENT
    household_id: Optional[int] = None
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    household_id: Optional[int] = None
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
