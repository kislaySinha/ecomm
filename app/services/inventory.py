from sqlalchemy.orm import Session
from sqlalchemy import update
from fastapi import HTTPException, status
from app.models.inventory import Inventory
from app.models.product import Product


class InventoryService:
    """
    Service for atomic inventory operations
    Uses database-level atomic updates without locks or Redis
    """

    @staticmethod
    def reserve_stock(db: Session, product_id: int, quantity: int, commit: bool = True) -> bool:
        """
        Atomically reserve stock for a product
        
        Uses database UPDATE with WHERE condition to ensure atomicity:
        - Only updates if current quantity >= requested quantity
        - Returns True if reservation successful, False if insufficient stock
        
        Args:
            db: Database session
            product_id: Product ID to reserve stock for
            quantity: Quantity to reserve
            commit: Whether to commit the transaction (default: True)
            
        Returns:
            bool: True if stock reserved successfully, False if insufficient stock
            
        Raises:
            HTTPException: If product not found or quantity invalid
        """
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive"
            )
        
        # Check if product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )
        
        # Atomic UPDATE: Reduce quantity only if sufficient stock available
        # This is the key atomic operation - no locks needed!
        stmt = (
            update(Inventory)
            .where(Inventory.product_id == product_id)
            .where(Inventory.quantity >= quantity)
            .values(quantity=Inventory.quantity - quantity)
        )
        
        result = db.execute(stmt)
        if commit:
            db.commit()
        
        # If no rows were updated, it means insufficient stock
        if result.rowcount == 0:
            # Check if inventory exists or just insufficient quantity
            inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
            if not inventory:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inventory not found for product {product_id}"
                )
            return False  # Insufficient stock
        
        return True  # Stock reserved successfully

    @staticmethod
    def restore_stock(db: Session, product_id: int, quantity: int, commit: bool = True) -> bool:
        """
        Atomically restore stock for a product (e.g., after order cancellation)
        
        Args:
            db: Database session
            product_id: Product ID to restore stock for
            quantity: Quantity to restore
            commit: Whether to commit the transaction (default: True)
            
        Returns:
            bool: True if stock restored successfully
            
        Raises:
            HTTPException: If product not found or quantity invalid
        """
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive"
            )
        
        # Check if product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )
        
        # Atomic UPDATE: Add quantity back
        stmt = (
            update(Inventory)
            .where(Inventory.product_id == product_id)
            .values(quantity=Inventory.quantity + quantity)
        )
        
        result = db.execute(stmt)
        if commit:
            db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory not found for product {product_id}"
            )
        
        return True

    @staticmethod
    def get_stock_quantity(db: Session, product_id: int) -> int:
        """
        Get current stock quantity for a product
        
        Args:
            db: Database session
            product_id: Product ID
            
        Returns:
            int: Current stock quantity
            
        Raises:
            HTTPException: If inventory not found
        """
        inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory not found for product {product_id}"
            )
        return inventory.quantity

    @staticmethod
    def update_stock_quantity(db: Session, product_id: int, new_quantity: int) -> Inventory:
        """
        Update stock quantity to a specific value (admin operation)
        
        Args:
            db: Database session
            product_id: Product ID
            new_quantity: New quantity value
            
        Returns:
            Inventory: Updated inventory record
            
        Raises:
            HTTPException: If inventory not found or quantity invalid
        """
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity cannot be negative"
            )
        
        inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory not found for product {product_id}"
            )
        
        inventory.quantity = new_quantity
        db.commit()
        db.refresh(inventory)
        return inventory


# Create instance for easy import
inventory_service = InventoryService()
