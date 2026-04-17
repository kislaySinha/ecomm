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
    get_current_admin_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _issue_token(user: User) -> TokenResponse:
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # is_admin included in payload so other services can verify admin status
    # without a database call
    token = create_access_token(
        data={"sub": user.email, "is_admin": user.is_admin},
        expires_delta=expires,
    )
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db, email=user_data.email, password=user_data.password,
                       full_name=user_data.full_name, phone=user_data.phone)
    return _issue_token(user)


@router.post("/login", response_model=TokenResponse)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=user_credentials.email, password=user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_token(user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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
        is_admin=True,
    )
    db.add(admin)
    db.commit()
    return {"message": "Admin user created", "email": "admin@amcart.com", "password": "admin123"}
