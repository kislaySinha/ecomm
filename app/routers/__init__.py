# Routers will be imported here
from app.routers.auth import router as auth_router
from app.routers.product import router as product_router
from app.routers.cart import router as cart_router
from app.routers.order import router as order_router
from app.routers.payment import router as payment_router

__all__ = ["auth_router", "product_router", "cart_router", "order_router", "payment_router"]
