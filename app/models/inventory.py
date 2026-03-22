from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Inventory(Base):
    """
    Inventory model for product stock management
    """
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with product
    product = relationship("Product", back_populates="inventory")

    # Check constraint to ensure quantity is never negative
    __table_args__ = (
        CheckConstraint('quantity >= 0', name='check_quantity_positive'),
    )

    def __repr__(self):
        return f"<Inventory(product_id={self.product_id}, quantity={self.quantity})>"
