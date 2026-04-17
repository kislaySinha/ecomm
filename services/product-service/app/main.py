from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.routers import product_router, admin_router
from app.models import Product, Inventory  # noqa: F401 — registers models with Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Product Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "product-service"}


app.include_router(product_router)
app.include_router(admin_router)


def _seed_products(db: Session):
    """Insert initial product catalog if the products table is empty."""
    if db.query(Product).count() > 0:
        return

    from decimal import Decimal

    seed = [
        dict(name="Floral Wrap Dress", price=Decimal("49.99"), description="Elegant floral wrap dress, perfect for spring/summer. Lightweight chiffon fabric with a flattering silhouette.", category="Women", image_url="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400", is_featured=True, is_new=False, discount_percentage=Decimal("10.00"), qty=0),
        dict(name="High-Waist Skinny Jeans", price=Decimal("64.99"), description="Classic high-waist skinny jeans in stretch denim. Available in dark indigo wash for a versatile everyday look.", category="Women", image_url="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400", is_featured=False, is_new=True, discount_percentage=None, qty=39),
        dict(name="Ribbed Knit Crop Top", price=Decimal("29.99"), description="Soft ribbed knit crop top with a slim fit. Pairs perfectly with high-waist bottoms for a chic look.", category="Women", image_url="https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=400", is_featured=False, is_new=True, discount_percentage=None, qty=50),
        dict(name="Oversized Blazer", price=Decimal("89.99"), description="Tailored oversized blazer in a neutral tone. A wardrobe essential that elevates any outfit.", category="Women", image_url="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", is_featured=True, is_new=False, discount_percentage=Decimal("15.00"), qty=20),
        dict(name="Classic Oxford Shirt", price=Decimal("54.99"), description="Premium cotton Oxford shirt with a button-down collar. Ideal for smart casual and formal occasions.", category="Men", image_url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", is_featured=True, is_new=False, discount_percentage=None, qty=35),
        dict(name="Slim Fit Chino Pants", price=Decimal("59.99"), description="Versatile slim fit chinos in a breathable cotton blend. Perfect for office and weekend wear.", category="Men", image_url="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400", is_featured=False, is_new=False, discount_percentage=Decimal("20.00"), qty=30),
        dict(name="Merino Wool Crew Neck", price=Decimal("79.99"), description="Luxurious merino wool crew neck sweater. Ultra-soft, lightweight and naturally temperature regulating.", category="Men", image_url="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400", is_featured=False, is_new=True, discount_percentage=None, qty=22),
        dict(name="Leather Chelsea Boots", price=Decimal("129.99"), description="Genuine leather Chelsea boots with elastic side panels and a stacked heel. Timeless and durable.", category="Men", image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", is_featured=True, is_new=True, discount_percentage=None, qty=15),
        dict(name="Wireless Noise-Cancelling Headphones", price=Decimal("199.99"), description="Over-ear headphones with active noise cancellation, 30-hour battery life and premium sound quality.", category="Electronics", image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", is_featured=True, is_new=False, discount_percentage=Decimal("10.00"), qty=18),
        dict(name="Smartwatch Pro", price=Decimal("249.99"), description="Feature-packed smartwatch with health monitoring, GPS, NFC payments and a 5-day battery life.", category="Electronics", image_url="https://images.unsplash.com/photo-1523475496153-3a571481e5df?w=400", is_featured=True, is_new=True, discount_percentage=None, qty=12),
        dict(name="Portable Bluetooth Speaker", price=Decimal("79.99"), description="Compact waterproof Bluetooth speaker with 360° sound and 12-hour playtime. Perfect for outdoors.", category="Electronics", image_url="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400", is_featured=False, is_new=False, discount_percentage=Decimal("25.00"), qty=30),
        dict(name="USB-C Fast Charging Hub", price=Decimal("49.99"), description="7-in-1 USB-C hub with HDMI 4K, 3×USB-A, SD card reader, and 100W PD charging pass-through.", category="Electronics", image_url="https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400", is_featured=False, is_new=True, discount_percentage=None, qty=45),
        dict(name="Leather Bifold Wallet", price=Decimal("39.99"), description="Slim genuine leather bifold wallet with RFID blocking. Holds up to 8 cards plus bills.", category="Accessories", image_url="https://images.unsplash.com/photo-1627123424574-724758594e93?w=400", is_featured=False, is_new=False, discount_percentage=None, qty=60),
        dict(name="Polarised Sunglasses", price=Decimal("59.99"), description="UV400 polarised sunglasses with lightweight metal frame. Reduces glare for driving and outdoor activities.", category="Accessories", image_url="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400", is_featured=True, is_new=False, discount_percentage=Decimal("10.00"), qty=35),
        dict(name="Canvas Tote Bag", price=Decimal("24.99"), description="Durable heavy-duty canvas tote with reinforced straps and an inner zip pocket. Eco-friendly everyday bag.", category="Accessories", image_url="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", is_featured=False, is_new=True, discount_percentage=None, qty=80),
        dict(name="Minimalist Watch", price=Decimal("109.99"), description="Clean minimalist watch with a mesh stainless steel strap and Japanese quartz movement.", category="Accessories", image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", is_featured=True, is_new=True, discount_percentage=Decimal("5.00"), qty=20),
    ]

    for item in seed:
        qty = item.pop("qty")
        product = Product(**item)
        db.add(product)
        db.flush()
        db.add(Inventory(product_id=product.id, quantity=qty))

    db.commit()


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        _seed_products(db)
    finally:
        db.close()
