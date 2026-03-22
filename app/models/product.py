from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    """
    Product model for e-commerce catalog
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with inventory
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
