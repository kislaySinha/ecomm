# Product and Inventory Services - Documentation

## Overview

AmCart's Product and Inventory services provide complete product catalog management with **atomic stock operations** using database-level updates (no Redis, no locks).

## ✅ Implementation Features

### Product Management
- Create products with initial inventory
- List all products with stock information
- Get individual product details
- Update product information
- Delete products (cascade deletes inventory)

### Atomic Inventory Operations
- **reserve_stock()** - Atomically reserve stock using SQL WHERE clause
- **restore_stock()** - Atomically restore stock (e.g., order cancellation)
- **get_stock_quantity()** - Check current stock
- **update_stock_quantity()** - Admin stock adjustment

## Database Schema

### Products Table

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Inventory Table

```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_quantity_positive CHECK (quantity >= 0)
);
```

**Key Features:**
- One-to-one relationship (one product = one inventory record)
- CASCADE delete (deleting product deletes inventory)
- CHECK constraint ensures quantity never goes negative

## API Endpoints

### 1. Create Product

**POST** `/products/`

Create a new product with initial inventory.

**Request Body:**
```json
{
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop",
  "initial_quantity": 10
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Laptop",
  "price": "999.99",
  "description": "High-performance laptop",
  "created_at": "2026-03-22T12:41:14.493509Z",
  "inventory": {
    "product_id": 1,
    "quantity": 10
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "description": "High-performance laptop",
    "initial_quantity": 10
  }'
```

---

### 2. Get All Products

**GET** `/products/`

Get list of all products with inventory information.

**Query Parameters:**
- `skip` (optional, default: 0) - Pagination offset
- `limit` (optional, default: 100) - Max records to return

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "price": "999.99",
      "description": "High-performance laptop",
      "created_at": "2026-03-22T12:41:14.493509Z",
      "inventory": {
        "product_id": 1,
        "quantity": 10
      }
    }
  ],
  "total": 1
}
```

**Example:**
```bash
curl http://localhost:8000/products/

# With pagination
curl http://localhost:8000/products/?skip=0&limit=10
```

---

### 3. Get Product by ID

**GET** `/products/{product_id}`

Get a single product with inventory details.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Laptop",
  "price": "999.99",
  "description": "High-performance laptop",
  "created_at": "2026-03-22T12:41:14.493509Z",
  "inventory": {
    "product_id": 1,
    "quantity": 10
  }
}
```

**Error Responses:**
- `404 Not Found` - Product does not exist

**Example:**
```bash
curl http://localhost:8000/products/1
```

---

### 4. Reserve Stock (Atomic)

**POST** `/products/{product_id}/reserve?quantity={quantity}`

Atomically reserve stock for a product. Uses database-level atomic update.

**Query Parameters:**
- `quantity` (required) - Quantity to reserve

**Response (200 OK):**
```json
{
  "message": "Stock reserved successfully",
  "product_id": 1,
  "quantity_reserved": 3
}
```

**Error Responses:**
- `400 Bad Request` - Insufficient stock or invalid quantity
- `404 Not Found` - Product not found

**Example:**
```bash
# Reserve 3 units
curl -X POST "http://localhost:8000/products/1/reserve?quantity=3"
```

**How Atomic Operation Works:**

```sql
UPDATE inventory 
SET quantity = quantity - 3
WHERE product_id = 1 
  AND quantity >= 3;  -- Only update if sufficient stock
```

If `quantity >= 3` is false, the UPDATE affects 0 rows → "Insufficient stock"

---

### 5. Restore Stock (Atomic)

**POST** `/products/{product_id}/restore?quantity={quantity}`

Atomically restore stock (e.g., after order cancellation).

**Query Parameters:**
- `quantity` (required) - Quantity to restore

**Response (200 OK):**
```json
{
  "message": "Stock restored successfully",
  "product_id": 1,
  "quantity_restored": 3
}
```

**Example:**
```bash
# Restore 3 units
curl -X POST "http://localhost:8000/products/1/restore?quantity=3"
```

---

### 6. Get Stock Quantity

**GET** `/products/{product_id}/stock`

Get current stock quantity for a product.

**Response (200 OK):**
```json
{
  "product_id": 1,
  "quantity": 7
}
```

**Example:**
```bash
curl http://localhost:8000/products/1/stock
```

---

### 7. Update Product

**PUT** `/products/{product_id}`

Update product information (not inventory quantity).

**Request Body:**
```json
{
  "name": "Updated Laptop",
  "price": 899.99,
  "description": "Updated description"
}
```

All fields are optional.

**Example:**
```bash
curl -X PUT http://localhost:8000/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 899.99}'
```

---

### 8. Delete Product

**DELETE** `/products/{product_id}`

Delete a product and its inventory (CASCADE).

**Response:** `204 No Content`

**Example:**
```bash
curl -X DELETE http://localhost:8000/products/1
```

---

## Atomic Stock Management

### Why Atomic Updates?

**Problem:** Race conditions when multiple requests reserve stock simultaneously.

**Bad Approach (NOT used):**
```python
# DON'T DO THIS - Race condition!
inventory = db.query(Inventory).filter_by(product_id=1).first()
if inventory.quantity >= 3:
    inventory.quantity -= 3  # ⚠️ Race condition!
    db.commit()
```

**Good Approach (USED):**
```python
# Atomic UPDATE with WHERE condition
stmt = (
    update(Inventory)
    .where(Inventory.product_id == 1)
    .where(Inventory.quantity >= 3)  # ✅ Atomic check
    .values(quantity=Inventory.quantity - 3)
)
result = db.execute(stmt)
success = result.rowcount > 0
```

### How It Works

The database ensures atomicity through:

1. **Single SQL statement** - No gap between check and update
2. **WHERE clause validation** - Update only if condition met
3. **Transaction isolation** - ACID guarantees
4. **Row-level locking** (automatic) - Database handles concurrency

### No Redis, No Locks Required

- ✅ Uses PostgreSQL's transaction isolation
- ✅ No distributed locks needed
- ✅ No Redis/external cache
- ✅ Database does the heavy lifting
- ✅ ACID compliance guaranteed

---

## Code Structure

### Models

**[app/models/product.py](app/models/product.py)**
```python
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    inventory = relationship("Inventory", back_populates="product")
```

**[app/models/inventory.py](app/models/inventory.py)**
```python
class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False, default=0)
    product = relationship("Product", back_populates="inventory")
```

### Services

**[app/services/inventory.py](app/services/inventory.py)**

Key methods:
- `reserve_stock(db, product_id, quantity)` - Atomic reservation
- `restore_stock(db, product_id, quantity)` - Atomic restoration
- `get_stock_quantity(db, product_id)` - Check stock
- `update_stock_quantity(db, product_id, new_quantity)` - Admin update

### Schemas

**[app/schemas/product.py](app/schemas/product.py)**
- `ProductCreate` - Create product with initial quantity
- `ProductUpdate` - Update product info
- `ProductResponse` - Product with inventory
- `ProductListResponse` - List with pagination
- `InventoryResponse` - Inventory info

### Routers

**[app/routers/product.py](app/routers/product.py)**
- All product and inventory endpoints

---

## Testing Scenarios

### Test 1: Successful Reservation
```bash
# Initial stock: 10
curl -X POST "http://localhost:8000/products/1/reserve?quantity=3"
# Result: quantity = 7 ✅
```

### Test 2: Insufficient Stock
```bash
# Current stock: 2
curl -X POST "http://localhost:8000/products/1/reserve?quantity=5"
# Result: "Insufficient stock" ✅
# Stock unchanged: 2 ✅
```

### Test 3: Stock Restoration
```bash
# Current stock: 2
curl -X POST "http://localhost:8000/products/1/restore?quantity=3"
# Result: quantity = 5 ✅
```

### Test 4: Concurrent Reservations

```bash
# Simulate concurrent requests
curl -X POST "http://localhost:8000/products/1/reserve?quantity=5" &
curl -X POST "http://localhost:8000/products/1/reserve?quantity=5" &
wait
# Only ONE succeeds if stock < 10 ✅
```

---

## Database Verification

```bash
# Check products and inventory
docker compose exec postgres psql -U postgres -d amcart -c \
  "SELECT p.id, p.name, p.price, i.quantity 
   FROM products p 
   LEFT JOIN inventory i ON p.id = i.product_id;"
```

---

## Complete Usage Example

```bash
# 1. Create product
curl -X POST http://localhost:8000/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "description": "Gaming laptop",
    "initial_quantity": 10
  }'

# 2. Reserve 3 units
curl -X POST "http://localhost:8000/products/1/reserve?quantity=3"

# 3. Check remaining stock
curl http://localhost:8000/products/1/stock
# Response: {"product_id": 1, "quantity": 7}

# 4. Try to reserve more than available (will fail)
curl -X POST "http://localhost:8000/products/1/reserve?quantity=10"
# Response: {"detail": "Insufficient stock"}

# 5. Restore 2 units (e.g., order cancelled)
curl -X POST "http://localhost:8000/products/1/restore?quantity=2"

# 6. Verify final stock
curl http://localhost:8000/products/1/stock
# Response: {"product_id": 1, "quantity": 9}
```

---

## Error Handling

### Product Not Found (404)
```json
{"detail": "Product with id 999 not found"}
```

### Insufficient Stock (400)
```json
{"detail": "Insufficient stock"}
```

### Invalid Quantity (400)
```json
{"detail": "Quantity must be positive"}
```

### Inventory Not Found (404)
```json
{"detail": "Inventory not found for product 1"}
```

---

## Performance Considerations

### Indexing
- `product_id` in inventory table is indexed (foreign key)
- `products.id` is primary key (automatically indexed)
- Ensures fast lookups for reserve/restore operations

### Transaction Isolation
- PostgreSQL default: READ COMMITTED
- Sufficient for atomic operations
- No need for SERIALIZABLE isolation level

### Scalability
- Database handles concurrent requests
- No application-level locking needed
- Horizontal scaling supported (read replicas for GET requests)

---

## API Documentation

Interactive documentation available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Future Enhancements

Potential improvements:
- Stock alerts (low stock notifications)
- Stock history tracking
- Bulk operations
- Product categories
- Product images
- Price history
- Stock reservations with timeout (auto-release)
- Inventory audit logs
