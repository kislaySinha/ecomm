from sqlalchemy.orm import Session
from sqlalchemy import update
from fastapi import HTTPException, status
from app.models.inventory import Inventory
from app.models.product import Product


class InventoryService:
    @staticmethod
    def reserve_stock(db: Session, product_id: int, quantity: int, commit: bool = True) -> bool:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found")
        stmt = (
            update(Inventory)
            .where(Inventory.product_id == product_id)
            .where(Inventory.quantity >= quantity)
            .values(quantity=Inventory.quantity - quantity)
        )
        result = db.execute(stmt)
        if commit:
            db.commit()
        if result.rowcount == 0:
            inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
            if not inventory:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory not found for product {product_id}")
            return False
        return True

    @staticmethod
    def restore_stock(db: Session, product_id: int, quantity: int, commit: bool = True) -> bool:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")
        stmt = (
            update(Inventory)
            .where(Inventory.product_id == product_id)
            .values(quantity=Inventory.quantity + quantity)
        )
        result = db.execute(stmt)
        if commit:
            db.commit()
        return result.rowcount > 0

    @staticmethod
    def get_stock(db: Session, product_id: int) -> int:
        inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
        if not inventory:
            return 0
        return inventory.quantity


inventory_service = InventoryService()
