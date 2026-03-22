from pydantic import BaseModel, Field
from typing import Optional


class PaymentRequest(BaseModel):
    """
    Schema for payment request
    """
    order_id: int = Field(..., gt=0, description="Order ID to process payment for")


class PaymentResponse(BaseModel):
    """
    Schema for payment response
    """
    success: bool
    order_id: int
    transaction_id: Optional[str] = None
    error_code: Optional[str] = None
    amount: float
    message: str
