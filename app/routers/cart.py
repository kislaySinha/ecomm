from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List

from app.database import get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemResponse, CartResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/add", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item_data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add item to cart or update quantity if already exists
    
    Args:
        item_data: Product ID and quantity
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Added or updated cart item
    
    Raises:
        HTTPException 404: If product not found
    """
    # Check if product exists
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {item_data.product_id} not found"
        )
    
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item_data.product_id
    ).first()
    
    if existing_item:
        # Update quantity
        existing_item.quantity += item_data.quantity
        db.commit()
        db.refresh(existing_item)
        cart_item = existing_item
    else:
        # Create new cart item
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
    
    # Build response with product details
    response = CartItemResponse(
        id=cart_item.id,
        user_id=cart_item.user_id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        product_name=product.name,
        product_price=product.price,
        subtotal=product.price * cart_item.quantity
    )
    
    return response


@router.get("/", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's cart with all items
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Cart with items and total
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    items_response = []
    total = Decimal('0.00')
    
    for cart_item in cart_items:
        product = cart_item.product
        if product:
            subtotal = product.price * cart_item.quantity
            total += subtotal
            
            items_response.append(CartItemResponse(
                id=cart_item.id,
                user_id=cart_item.user_id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                product_name=product.name,
                product_price=product.price,
                subtotal=subtotal
            ))
    
    return CartResponse(items=items_response, total=total)


@router.delete("/remove/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove item from cart
    
    Args:
        product_id: Product ID to remove
        current_user: Current authenticated user
        db: Database session
    
    Raises:
        HTTPException 404: If item not in cart
    """
    cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == product_id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found in cart"
        )
    
    db.delete(cart_item)
    db.commit()


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()


@router.put("/update/{product_id}", response_model=CartItemResponse)
def update_cart_item(
    product_id: int,
    quantity: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == product_id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")

    if quantity <= 0:
        db.delete(cart_item)
        db.commit()
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)

    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)

    product = db.query(Product).filter(Product.id == product_id).first()
    return CartItemResponse(
        id=cart_item.id,
        user_id=cart_item.user_id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        product_name=product.name,
        product_price=product.price,
        subtotal=product.price * cart_item.quantity
    )
