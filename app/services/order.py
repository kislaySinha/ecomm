from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from typing import List
import logging

from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.inventory import inventory_service

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class OrderService:
    """
    Service for order management with atomic checkout
    
    The order service controls the entire transaction including:
    - Getting cart items
    - Reserving stock atomically
    - Rolling back on failure
    - Creating order
    """

    @staticmethod
    def place_order(db: Session, user_id: int) -> Order:
        """
        Place an order from user's cart with atomic stock reservation and payment processing
        
        Complete Flow:
        1. Get user's cart items
        2. Validate products and calculate total
        3. Reserve stock atomically (no commit)
        4. Create order with PENDING status
        5. Create order items
        6. Clear cart
        7. Commit transaction
        8. Process payment
        9. If payment succeeds: Update order to CONFIRMED
        10. If payment fails: Restore stock + Update order to FAILED
        
        Args:
            db: Database session (controls the transaction)
            user_id: User ID placing the order
            
        Returns:
            Order: Created order with final status (CONFIRMED or FAILED)
            
        Raises:
            HTTPException: If cart is empty, product not found, or insufficient stock
        """
        logger.info(f"📦 Starting checkout for user {user_id}")
        
        try:
            # 1. Get user's cart items
            cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
            
            if not cart_items:
                logger.warning(f"Checkout failed: Cart is empty for user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty"
                )
            
            logger.info(f"📋 Cart has {len(cart_items)} items")
            
            # 2. Validate products and calculate total
            total_amount = Decimal('0.00')
            order_items_data = []
            
            for cart_item in cart_items:
                product = db.query(Product).filter(Product.id == cart_item.product_id).first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with id {cart_item.product_id} not found"
                    )
                
                # Calculate item subtotal
                item_total = product.price * cart_item.quantity
                total_amount += item_total
                
                order_items_data.append({
                    'product_id': product.id,
                    'quantity': cart_item.quantity,
                    'price': product.price,
                    'product': product
                })
                
                logger.info(f"  • {cart_item.quantity}x {product.name} @ ${product.price} = ${item_total}")
            
            logger.info(f"💰 Order total: ${total_amount}")
            
            # 3. Reserve stock for all items (atomic, no commit yet)
            logger.info("🔒 Reserving stock...")
            for item_data in order_items_data:
                success = inventory_service.reserve_stock(
                    db=db,
                    product_id=item_data['product_id'],
                    quantity=item_data['quantity'],
                    commit=False  # DO NOT commit yet - order service controls transaction
                )
                
                if not success:
                    logger.error(f"❌ Stock reservation failed for {item_data['product'].name}")
                    # Rollback will happen automatically via exception
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for product: {item_data['product'].name}"
                    )
                
                logger.info(f"  ✓ Reserved {item_data['quantity']}x {item_data['product'].name}")
            
            # 4. Create order with PENDING status
            order = Order(
                user_id=user_id,
                status="PENDING",
                total_amount=total_amount
            )
            db.add(order)
            db.flush()  # Get order.id without committing
            
            logger.info(f"📝 Order #{order.id} created with status PENDING")
            
            # 5. Create order items
            for item_data in order_items_data:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data['product_id'],
                    quantity=item_data['quantity'],
                    price=item_data['price']
                )
                db.add(order_item)
            
            # 6. Clear cart
            for cart_item in cart_items:
                db.delete(cart_item)
            
            logger.info("🗑️ Cart cleared")
            
            # 7. Commit the order creation and stock reservation atomically
            db.commit()
            db.refresh(order)
            
            logger.info(f"✅ Order #{order.id} committed successfully")
            
            # 8. Process payment
            logger.info(f"💳 Processing payment for order #{order.id}...")
            from app.services.payment import payment_service
            payment_result = payment_service.process_payment(db, order.id)
            
            # 9. Handle payment result
            if payment_result["success"]:
                # Payment successful - update order to CONFIRMED
                order.status = "CONFIRMED"
                db.commit()
                db.refresh(order)
                logger.info(f"✅ ORDER #{order.id} CONFIRMED - Payment successful (Transaction: {payment_result['transaction_id']})")
            else:
                # Payment failed - restore stock and update order to FAILED
                logger.warning(f"❌ Payment failed for order #{order.id}: {payment_result['error_code']}")
                logger.info(f"🔄 Restoring stock for order #{order.id}...")
                
                # Restore stock for all items
                for item in order.items:
                    inventory_service.restore_stock(
                        db=db,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        commit=False
                    )
                    logger.info(f"  ✓ Restored {item.quantity}x {item.product.name}")
                
                # Update order status to FAILED
                order.status = "FAILED"
                db.commit()
                db.refresh(order)
                logger.info(f"❌ ORDER #{order.id} FAILED - Stock restored")
            
            return order
            
        except HTTPException:
            # Re-raise HTTP exceptions
            db.rollback()
            logger.error("Transaction rolled back due to error")
            raise
        except Exception as e:
            # Rollback on any error
            db.rollback()
            logger.error(f"Unexpected error during checkout: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to place order: {str(e)}"
            )

    @staticmethod
    def get_user_orders(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Get all orders for a user
        
        Args:
            db: Database session
            user_id: User ID
            skip: Pagination offset
            limit: Max records
            
        Returns:
            List[Order]: User's orders
        """
        orders = (
            db.query(Order)
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return orders

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, user_id: int) -> Order:
        """
        Get a specific order by ID
        
        Args:
            db: Database session
            order_id: Order ID
            user_id: User ID (for authorization)
            
        Returns:
            Order: Order details
            
        Raises:
            HTTPException: If order not found or unauthorized
        """
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == user_id
        ).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with id {order_id} not found"
            )
        
        return order

    @staticmethod
    def cancel_order(db: Session, order_id: int, user_id: int) -> Order:
        """
        Cancel an order and restore stock
        
        Args:
            db: Database session
            order_id: Order ID
            user_id: User ID (for authorization)
            
        Returns:
            Order: Updated order
            
        Raises:
            HTTPException: If order not found, unauthorized, or already completed
        """
        order = OrderService.get_order_by_id(db, order_id, user_id)
        
        if order.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is already cancelled"
            )
        
        if order.status == "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel completed order"
            )
        
        try:
            # Restore stock for all items
            for item in order.items:
                inventory_service.restore_stock(
                    db=db,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    commit=False
                )
            
            # Update order status
            order.status = "CANCELLED"
            db.commit()
            db.refresh(order)
            
            return order
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to cancel order: {str(e)}"
            )


# Create instance for easy import
order_service = OrderService()
