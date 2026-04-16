from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.database import get_db
from app.models.wishlist import Wishlist
from app.models.product import Product
from app.models.user import User
from app.schemas.wishlist import WishlistItemResponse
from app.services.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


class WishlistAdd(BaseModel):
    product_id: int


@router.post("/add", status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    data: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == data.product_id
    ).first()
    if existing:
        return {"message": "Already in wishlist"}

    item = Wishlist(user_id=current_user.id, product_id=data.product_id)
    db.add(item)
    db.commit()
    return {"message": "Added to wishlist"}


@router.delete("/remove/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in wishlist")
    db.delete(item)
    db.commit()


@router.get("/", response_model=List[WishlistItemResponse])
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).all()
    result = []
    for item in items:
        product = item.product
        result.append(WishlistItemResponse(
            id=item.id,
            user_id=item.user_id,
            product_id=item.product_id,
            created_at=item.created_at,
            product_name=product.name if product else None,
            product_price=product.price if product else None,
            product_image_url=product.image_url if product else None,
            product_category=product.category if product else None
        ))
    return result
