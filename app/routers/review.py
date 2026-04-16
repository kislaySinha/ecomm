from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.review import Review
from app.models.product import Product
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewListResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == review_data.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    review = Review(
        user_id=current_user.id,
        product_id=review_data.product_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        reviewer_email=current_user.email,
        product_name=product.name
    )


@router.get("/product/{product_id}", response_model=ReviewListResponse)
def get_product_reviews(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Review).filter(Review.product_id == product_id)
    total = query.count()
    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for r in reviews:
        result.append(ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            product_id=r.product_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            reviewer_email=r.user.email if r.user else None,
            product_name=r.product.name if r.product else None
        ))
    return ReviewListResponse(reviews=result, total=total)


@router.get("/", response_model=ReviewListResponse)
def get_all_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total = db.query(Review).count()
    reviews = db.query(Review).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for r in reviews:
        result.append(ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            product_id=r.product_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            reviewer_email=r.user.email if r.user else None,
            product_name=r.product.name if r.product else None
        ))
    return ReviewListResponse(reviews=result, total=total)
