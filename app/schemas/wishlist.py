from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal


class WishlistItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: Optional[datetime] = None
    product_name: Optional[str] = None
    product_price: Optional[Decimal] = None
    product_image_url: Optional[str] = None
    product_category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
