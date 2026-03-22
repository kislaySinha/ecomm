from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class CartItem(Base):
    """
    Cart item model for user shopping cart
    """
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="cart_items")
    product = relationship("Product", backref="cart_items")

    # Constraints
    __table_args__ = (
        CheckConstraint('quantity > 0', name='check_cart_quantity_positive'),
    )

    def __repr__(self):
        return f"<CartItem(user_id={self.user_id}, product_id={self.product_id}, quantity={self.quantity})>"
