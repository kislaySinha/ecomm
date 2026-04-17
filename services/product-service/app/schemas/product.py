from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., gt=0)
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: bool = False
    is_new: bool = False
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


class ProductCreate(ProductBase):
    initial_quantity: int = Field(0, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


class InventoryResponse(BaseModel):
    product_id: int
    quantity: int
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    inventory: Optional[InventoryResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int = 1
    pages: int = 1
