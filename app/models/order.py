from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Order(Base):
    """
    Order model for customer orders
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="PENDING", index=True)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status})>"


class OrderItem(Base):
    """
    Order item model for items in an order
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)  # Price at time of order
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", backref="order_items")

    def __repr__(self):
        return f"<OrderItem(order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity})>"
