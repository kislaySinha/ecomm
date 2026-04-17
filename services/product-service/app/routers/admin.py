from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import math

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services.jwt_middleware import get_current_admin_user, TokenUser

router = APIRouter(prefix="/admin", tags=["Admin"])


class StockUpdate(BaseModel):
    quantity: int


@router.get("/products/", response_model=ProductListResponse)
def admin_list_products(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(get_current_admin_user),
):
    total = db.query(Product).count()
    pages = max(1, math.ceil(total / limit))
    products = db.query(Product).offset((page - 1) * limit).limit(limit).all()
    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.post("/products/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(get_current_admin_user),
):
    new_product = Product(
        name=product_data.name,
        price=product_data.price,
        description=product_data.description,
        category=product_data.category,
        image_url=product_data.image_url,
        is_featured=product_data.is_featured,
        is_new=product_data.is_new,
        discount_percentage=product_data.discount_percentage,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    inventory = Inventory(product_id=new_product.id, quantity=product_data.initial_quantity)
    db.add(inventory)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(get_current_admin_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(get_current_admin_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()


@router.put("/products/{product_id}/stock")
def admin_update_stock(
    product_id: int,
    stock_data: StockUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(get_current_admin_user),
):
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product inventory not found")
    inventory.quantity = stock_data.quantity
    db.commit()
    return {"product_id": product_id, "quantity": stock_data.quantity}
