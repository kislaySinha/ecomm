from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.product import Product
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
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get list of all products with inventory information
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session
    
    Returns:
        List of products with total count
    """
    # Get total count
    total = db.query(Product).count()
    
    # Get products with inventory
    products = (
        db.query(Product)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return ProductListResponse(
        products=products,
        total=total
    )


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
