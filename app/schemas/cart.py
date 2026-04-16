from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional, List
from datetime import datetime


class CartItemAdd(BaseModel):
    """
    Schema for adding item to cart
    """
    product_id: int = Field(..., gt=0, description="Product ID")
    quantity: int = Field(..., gt=0, description="Quantity to add")


class CartItemUpdate(BaseModel):
    """
    Schema for updating cart item quantity
    """
    quantity: int = Field(..., gt=0, description="New quantity")


class CartItemResponse(BaseModel):
    """
    Schema for cart item response
    """
    id: int
    user_id: int
    product_id: int
    quantity: int
    product_name: Optional[str] = None
    product_price: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    """
    Schema for cart response
    """
    items: List[CartItemResponse]
    total: Decimal


class OrderItemResponse(BaseModel):
    """
    Schema for order item response
    """
    id: int
    product_id: int
    quantity: int
    price: Decimal
    product_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    shipping_name: Optional[str] = None
    shipping_address: Optional[str] = None


class OrderResponse(BaseModel):
    """
    Schema for order response
    """
    id: int
    user_id: int
    status: str
    total_amount: Decimal
    shipping_name: Optional[str] = None
    shipping_address: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    """
    Schema for order list response
    """
    orders: List[OrderResponse]
    total: int
