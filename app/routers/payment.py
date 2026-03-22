from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentRequest, PaymentResponse
from app.services.auth import get_current_user
from app.services.payment import payment_service

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/pay", response_model=PaymentResponse)
def process_payment(
    payment_data: PaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process payment for an order
    
    Simulates payment gateway with:
    - 70% success rate
    - 30% failure rate
    
    Args:
        payment_data: Payment request with order_id
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Payment result with transaction ID (success) or error code (failure)
    
    Raises:
        HTTPException 404: If order not found
        HTTPException 400: If order not in PENDING status
    """
    # Note: In production, you would verify the order belongs to the current user
    # For now, the payment service handles this
    
    result = payment_service.process_payment(db, payment_data.order_id)
    
    return PaymentResponse(**result)
