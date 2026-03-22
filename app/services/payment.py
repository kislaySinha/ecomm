import random
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.order import Order

# Configure logging
logger = logging.getLogger(__name__)


class PaymentService:
    """
    Payment service with simulated payment processing
    
    Simulates real payment gateway behavior:
    - 70% success rate
    - 30% failure rate
    """

    @staticmethod
    def process_payment(db: Session, order_id: int) -> dict:
        """
        Process payment for an order (simulated)
        
        Simulates payment gateway with:
        - 70% success rate
        - 30% failure rate
        
        Args:
            db: Database session
            order_id: Order ID to process payment for
            
        Returns:
            dict: Payment result with status and transaction_id
            
        Raises:
            HTTPException: If order not found
        """
        # Get order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            logger.error(f"Payment failed: Order {order_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with id {order_id} not found"
            )
        
        # Cannot process payment for non-PENDING orders
        if order.status != "PENDING":
            logger.warning(f"Payment attempted for order {order_id} with status {order.status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot process payment for order with status {order.status}"
            )
        
        # Simulate payment processing (70% success, 30% failure)
        success = random.random() < 0.7
        
        if success:
            transaction_id = f"TXN{random.randint(100000, 999999)}"
            logger.info(f"💳 Payment SUCCESS for order {order_id} - Amount: ${order.total_amount} - Transaction: {transaction_id}")
            
            return {
                "success": True,
                "order_id": order_id,
                "transaction_id": transaction_id,
                "amount": float(order.total_amount),
                "message": "Payment processed successfully"
            }
        else:
            error_code = random.choice(["INSUFFICIENT_FUNDS", "CARD_DECLINED", "PROCESSING_ERROR"])
            logger.warning(f"💳 Payment FAILED for order {order_id} - Amount: ${order.total_amount} - Error: {error_code}")
            
            return {
                "success": False,
                "order_id": order_id,
                "error_code": error_code,
                "amount": float(order.total_amount),
                "message": f"Payment failed: {error_code}"
            }


# Create instance for easy import
payment_service = PaymentService()
