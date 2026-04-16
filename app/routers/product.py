from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import math

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.inventory import Inventory
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse
)
from app.services.inventory import inventory_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product with initial inventory
    
    Args:
        product_data: Product creation data including initial quantity
        db: Database session
    
    Returns:
        Created product with inventory information
    """
    # Create product
    new_product = Product(
        name=product_data.name,
        price=product_data.price,
        description=product_data.description
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Create inventory for the product
    inventory = Inventory(
        product_id=new_product.id,
        quantity=product_data.initial_quantity
    )
    db.add(inventory)
    db.commit()
    db.refresh(new_product)
    
    return new_product


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
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(Product.name.ilike(search_term), Product.description.ilike(search_term))
        )
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
    skip = (page - 1) * limit
    products = query.offset(skip).limit(limit).all()

    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single product by ID with inventory information
    
    Args:
        product_id: Product ID
        db: Database session
    
    Returns:
        Product details with inventory
    
    Raises:
        HTTPException 404: If product not found
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a product
    
    Args:
        product_id: Product ID
        product_data: Updated product data
        db: Database session
    
    Returns:
        Updated product
    
    Raises:
        HTTPException 404: If product not found
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    # Update only provided fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a product (also deletes associated inventory due to CASCADE)
    
    Args:
        product_id: Product ID
        db: Database session
    
    Raises:
        HTTPException 404: If product not found
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    db.delete(product)
    db.commit()


@router.post("/{product_id}/reserve", status_code=status.HTTP_200_OK)
def reserve_product_stock(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    """
    Reserve stock for a product (atomic operation)
    
    Args:
        product_id: Product ID
        quantity: Quantity to reserve
        db: Database session
    
    Returns:
        Success message or error
    
    Raises:
        HTTPException 400: If insufficient stock
        HTTPException 404: If product not found
    """
    success = inventory_service.reserve_stock(db, product_id, quantity)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock"
        )
    
    return {
        "message": "Stock reserved successfully",
        "product_id": product_id,
        "quantity_reserved": quantity
    }


@router.post("/{product_id}/restore", status_code=status.HTTP_200_OK)
def restore_product_stock(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    """
    Restore stock for a product (e.g., after order cancellation)
    
    Args:
        product_id: Product ID
        quantity: Quantity to restore
        db: Database session
    
    Returns:
        Success message
    
    Raises:
        HTTPException 404: If product not found
    """
    inventory_service.restore_stock(db, product_id, quantity)
    
    return {
        "message": "Stock restored successfully",
        "product_id": product_id,
        "quantity_restored": quantity
    }


@router.get("/{product_id}/stock", status_code=status.HTTP_200_OK)
def get_product_stock(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get current stock quantity for a product
    
    Args:
        product_id: Product ID
        db: Database session
    
    Returns:
        Current stock quantity
    
    Raises:
        HTTPException 404: If product or inventory not found
    """
    quantity = inventory_service.get_stock_quantity(db, product_id)
    
    return {
        "product_id": product_id,
        "quantity": quantity
    }
