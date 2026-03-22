from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.routers import auth_router, product_router, cart_router, order_router, payment_router

# Import models to ensure they are registered with Base
from app.models import User, Product, Inventory, CartItem, Order, OrderItem

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AmCart API",
    description="E-commerce backend API built with FastAPI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/", tags=["Health"])
def health_check():
    """
    Health check endpoint to verify the API is running
    """
    return {
        "status": "healthy",
        "message": "Welcome to AmCart API",
        "version": "1.0.0"
    }


# Database connection test endpoint
@app.get("/health/db", tags=["Health"])
def database_health_check(db: Session = Depends(get_db)):
    """
    Test database connection
    """
    try:
        # Execute a simple query to test the connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# Include routers here
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(payment_router)
