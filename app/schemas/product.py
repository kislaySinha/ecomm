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
    category: Optional[str] = Field(None, description="Product category")
    image_url: Optional[str] = Field(None, description="Product image URL")
    is_featured: bool = Field(False, description="Whether product is featured")
    is_new: bool = Field(False, description="Whether product is new")
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100, description="Discount percentage")


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
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


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
    page: int = 1
    pages: int = 1
