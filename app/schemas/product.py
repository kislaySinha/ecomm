from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """
    Base schema for Product
    """
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    price: Decimal = Field(..., gt=0, description="Product price (must be positive)")
    description: Optional[str] = Field(None, description="Product description")


class ProductCreate(ProductBase):
    """
    Schema for creating a product
    """
    initial_quantity: int = Field(0, ge=0, description="Initial inventory quantity")


class ProductUpdate(BaseModel):
    """
    Schema for updating a product
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None


class InventoryResponse(BaseModel):
    """
    Schema for inventory information
    """
    product_id: int
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(ProductBase):
    """
    Schema for product response
    """
    id: int
    created_at: Optional[datetime] = None
    inventory: Optional[InventoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """
    Schema for product list response
    """
    products: list[ProductResponse]
    total: int
