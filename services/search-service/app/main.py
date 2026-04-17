from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import search_router
from app.models import Product, Inventory  # noqa: F401 — registers models (no create_all; product-service owns schema)

app = FastAPI(title="Search Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "search-service"}


app.include_router(search_router)
