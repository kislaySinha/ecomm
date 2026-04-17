from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import datetime


class InventoryResponse(BaseModel):
    product_id: int
    quantity: int
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: bool = False
    is_new: bool = False
    discount_percentage: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    inventory: Optional[InventoryResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int = 1
    pages: int = 1
