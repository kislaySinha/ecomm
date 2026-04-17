from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import math

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.product import ProductCreate, ProductResponse, ProductListResponse
from app.services.inventory import inventory_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=ProductListResponse)
def get_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_new: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if search:
        term = f"%{search}%"
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


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/{product_id}/stock")
def get_stock(product_id: int, db: Session = Depends(get_db)):
    stock = inventory_service.get_stock(db, product_id)
    return {"product_id": product_id, "quantity": stock}
