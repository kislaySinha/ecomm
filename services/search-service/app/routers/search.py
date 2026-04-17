from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import math

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.product import ProductListResponse

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=ProductListResponse)
def search_products(
    q: Optional[str] = Query(None, description="Full-text search across name and description"),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_new: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None, description="price_asc | price_desc | newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if q:
        term = f"%{q}%"
        query = query.filter(or_(Product.name.ilike(term), Product.description.ilike(term)))
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if in_stock is True:
        query = query.join(Product.inventory).filter(Inventory.quantity > 0)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)

    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.id.asc())

    total = query.count()
    pages = max(1, math.ceil(total / limit))
    products = query.offset((page - 1) * limit).limit(limit).all()
    return ProductListResponse(products=products, total=total, page=page, pages=pages)
