from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.cart import OrderResponse, OrderListResponse, OrderItemResponse
from app.services.auth import get_current_user
from app.services.order import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Place order from cart (Checkout)
    
    This endpoint:
    1. Gets all items from user's cart
    2. Atomically reserves stock for each item
    3. If any item has insufficient stock, rolls back entire transaction
    4. Creates order with PENDING status
    5. Creates order items
    6. Clears cart
    7. Returns created order
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created order with items
    
    Raises:
        HTTPException 400: If cart is empty or insufficient stock
        HTTPException 404: If product not found
    """
    order = order_service.place_order(db, current_user.id)
    
    # Build response with order items
    items_response = []
    for item in order.items:
        items_response.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            product_name=item.product.name if item.product else None
        ))
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_response
    )


@router.get("/", response_model=OrderListResponse)
def get_orders(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all orders for current user
    
    Args:
        skip: Pagination offset
        limit: Max records to return
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of orders with items
    """
    orders = order_service.get_user_orders(db, current_user.id, skip, limit)
    total = len(orders)
    
    orders_response = []
    for order in orders:
        items_response = []
        for item in order.items:
            items_response.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                product_name=item.product.name if item.product else None
            ))
        
        orders_response.append(OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=items_response
        ))
    
    return OrderListResponse(orders=orders_response, total=total)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific order by ID
    
    Args:
        order_id: Order ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Order details with items
    
    Raises:
        HTTPException 404: If order not found or unauthorized
    """
    order = order_service.get_order_by_id(db, order_id, current_user.id)
    
    items_response = []
    for item in order.items:
        items_response.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            product_name=item.product.name if item.product else None
        ))
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_response
    )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order and restore stock
    
    Args:
        order_id: Order ID to cancel
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated order with CANCELLED status
    
    Raises:
        HTTPException 400: If order already cancelled or completed
        HTTPException 404: If order not found or unauthorized
    """
    order = order_service.cancel_order(db, order_id, current_user.id)
    
    items_response = []
    for item in order.items:
        items_response.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            product_name=item.product.name if item.product else None
        ))
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_response
    )
