# AmCart - FastAPI E-commerce Backend

A modular FastAPI backend application with PostgreSQL integration for e-commerce operations.

## Features

- FastAPI framework with Python 3.11
- PostgreSQL database with SQLAlchemy ORM
- **User Authentication System** (JWT + bcrypt)
- **Product & Inventory Management** (Atomic stock operations)
- Docker and Docker Compose setup
- Modular project structure
- CORS middleware
- Health check endpoints

## Project Structure

```
ecomm/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── database.py       # Database configuration
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── routers/          # API endpoints
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env
```

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory

2. Build and run the containers:
```bash
docker-compose up --build
```

3. Access the API:
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Database: localhost:5432

### Local Development

1. Create a virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up PostgreSQL and update `.env` file with your database credentials

4. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user and get JWT token
- `GET /auth/me` - Get current user info (protected)

### Products
- `POST /products/` - Create product with initial inventory
- `GET /products/` - List all products with stock info
- `GET /products/{id}` - Get product details
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Inventory (Atomic Operations)
- `POST /products/{id}/reserve?quantity={qty}` - Reserve stock (atomic)
- `POST /products/{id}/restore?quantity={qty}` - Restore stock (atomic)
- `GET /products/{id}/stock` - Check current stock

### Health
- `GET /` - Health check endpoint
- `GET /health/db` - Database connection health check

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

📖 **Detailed Documentation:**
- **Authentication:** [AUTHENTICATION.md](AUTHENTICATION.md)
- **Products & Inventory:** [PRODUCTS_INVENTORY.md](PRODUCTS_INVENTORY.md)

## Database Configuration

The application uses PostgreSQL with the following default configuration:

- **User:** postgres
- **Password:** postgres
- **Database:** amcart
- **Port:** 5432

Update the `DATABASE_URL` in `.env` file to change the database connection.

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/amcart
APP_NAME=AmCart
APP_VERSION=1.0.0
DEBUG=True
```

## Docker Services

### app (FastAPI)
- Port: 8000
- Auto-reload enabled for development

### postgres
- Port: 5432
- Volume: postgres_data (persistent storage)

## Development

### Adding New Routes

1. Create a new router file in `app/routers/`
2. Define your endpoints
3. Import and include the router in `app/main.py`

### Adding Models

1. Create model files in `app/models/`
2. Define SQLAlchemy models
3. Create corresponding Pydantic schemas in `app/schemas/`

### Database Migrations

Use Alembic for database migrations:

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create a migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## License

MIT
