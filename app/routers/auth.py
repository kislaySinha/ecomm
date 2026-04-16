from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserProfileUpdate
from app.services.auth import (
    create_user,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    
    Args:
        user_data: User registration data (email and password)
        db: Database session
    
    Returns:
        JWT token and user information
    
    Raises:
        HTTPException 400: If email already registered
    """
    # Create new user
    user = create_user(db, email=user_data.email, password=user_data.password,
                       full_name=user_data.full_name, phone=user_data.phone)
    
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT token
    
    Args:
        user_credentials: User login credentials (email and password)
        db: Database session
    
    Returns:
        JWT token and user information
    
    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Authenticate user
    user = authenticate_user(db, email=user_credentials.email, password=user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    
    This is a protected route that requires a valid JWT token
    
    Args:
        current_user: Current authenticated user (from JWT token)
    
    Returns:
        Current user information
    
    Raises:
        HTTPException 401: If token is invalid or expired
    """
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/admin/seed", tags=["Admin"])
def seed_admin(db: Session = Depends(get_db)):
    admin_count = db.query(User).filter(User.is_admin == True).count()
    if admin_count > 0:
        raise HTTPException(status_code=400, detail="Admin already exists")
    admin = User(
        email="admin@amcart.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        is_admin=True
    )
    db.add(admin)
    db.commit()
    return {"message": "Admin user created", "email": "admin@amcart.com", "password": "admin123"}
