from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """
    Schema for user registration
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (minimum 6 characters)")


class UserLogin(BaseModel):
    """
    Schema for user login
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """
    Schema for user response (without password)
    """
    id: int
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Schema for JWT token response
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """
    Schema for token data stored in JWT
    """
    email: Optional[str] = None
