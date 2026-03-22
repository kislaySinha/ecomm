# AmCart Deployment Guide

## ✅ Successfully Deployed!

Your AmCart FastAPI application is now running in Docker containers.

## 🚀 Running Services

### FastAPI Application
- **URL**: http://localhost:8000
- **Status**: ✅ Running
- **Container**: `amcart_app`

### PostgreSQL Database
- **Host**: localhost
- **Port**: 5433 (mapped to 5432 inside container)
- **Database**: amcart
- **User**: postgres
- **Password**: postgres
- **Container**: `amcart_postgres`
- **Status**: ✅ Healthy

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:8000/
```
Response:
```json
{"status":"healthy","message":"Welcome to AmCart API","version":"1.0.0"}
```

### Database Health Check
```bash
curl http://localhost:8000/health/db
```
Response:
```json
{"status":"healthy","database":"connected"}
```

### Interactive API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🐳 Docker Commands

### View running containers
```bash
docker compose ps
```

### View logs
```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# App logs only
docker compose logs app -f

# Database logs only
docker compose logs postgres -f
```

### Stop containers
```bash
docker compose down
```

### Restart containers
```bash
docker compose restart
```

### Rebuild and restart
```bash
docker compose up --build -d
```

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker compose down -v
```

## 🔧 Development

### Hot Reload
The application supports hot reload. Any changes to files in the `app/` directory will automatically restart the server.

### Access Database
```bash
# Using psql
docker exec -it amcart_postgres psql -U postgres -d amcart

# Using docker compose
docker compose exec postgres psql -U postgres -d amcart
```

### Access App Container
```bash
docker exec -it amcart_app bash
```

## 📁 Project Structure
```
/home/kisla/ecomm/
├── app/
│   ├── main.py           # FastAPI app
│   ├── database.py       # Database config
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── routers/          # API routes
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env
```

## 🔐 Environment Variables

Current configuration (`.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/amcart
APP_NAME=AmCart
APP_VERSION=1.0.0
DEBUG=True
```

**Note**: Inside Docker containers, the app uses:
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/amcart
```

## 📝 Next Steps

1. **Add Models**: Create SQLAlchemy models in `app/models/`
2. **Add Schemas**: Create Pydantic schemas in `app/schemas/`
3. **Add Routes**: Create API endpoints in `app/routers/`
4. **Add Services**: Implement business logic in `app/services/`
5. **Database Migrations**: Set up Alembic for migrations

## 🛠️ Troubleshooting

### Port 5432 already in use
The PostgreSQL container uses port 5433 externally (mapped to 5432 internally) because port 5432 was already in use by another service.

### Container won't start
```bash
docker compose down
docker compose up --build -d
```

### Database connection issues
Check the logs:
```bash
docker compose logs postgres
docker compose logs app
```
