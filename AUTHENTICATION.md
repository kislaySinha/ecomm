# Authentication System - User Service

## Overview

The AmCart authentication system provides secure user registration and login functionality using JWT tokens and bcrypt password hashing.

## Features

✅ User registration with email validation
✅ User login with JWT token generation
✅ Password hashing using bcrypt
✅ Protected routes using JWT authentication
✅ Token-based authorization
✅ Secure password storage

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## API Endpoints

### 1. Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2026-03-22T12:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Email already registered
- `422 Unprocessable Entity` - Invalid email format or password too short

**Example:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

### 2. Login User

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2026-03-22T12:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Incorrect email or password

**Example:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

### 3. Get Current User (Protected)

**GET** `/auth/me`

Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2026-03-22T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

**Example:**
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Use token to access protected route
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security

### Password Hashing

Passwords are hashed using **bcrypt** with the following configuration:
- Algorithm: bcrypt
- Automatic salt generation
- Never stores plain text passwords

### JWT Tokens

Tokens are generated using the following:
- Algorithm: **HS256** (HMAC with SHA-256)
- Expiration: **30 minutes** (configurable)
- Payload includes: user email (sub) and expiration time

### Environment Variables

Configure in `.env` file:
```env
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**⚠️ IMPORTANT:** Change `SECRET_KEY` in production! Generate a secure key:
```bash
openssl rand -hex 32
```

---

## Code Structure

### Models (`app/models/user.py`)
- `User` - SQLAlchemy model for users table

### Schemas (`app/schemas/user.py`)
- `UserCreate` - Registration input validation
- `UserLogin` - Login input validation
- `UserResponse` - User data response (without password)
- `TokenResponse` - JWT token response
- `TokenData` - JWT payload data

### Services (`app/services/auth.py`)
- `create_user()` - Create new user with hashed password
- `authenticate_user()` - Verify user credentials
- `create_access_token()` - Generate JWT token
- `get_current_user()` - Dependency for protected routes
- `verify_password()` - Verify password against hash
- `get_password_hash()` - Hash a plain password

### Routers (`app/routers/auth.py`)
- `/auth/register` - User registration endpoint
- `/auth/login` - User login endpoint
- `/auth/me` - Get current user (protected)

---

## Usage Examples

### 1. Complete Registration and Login Flow

```bash
# Register new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Access protected route
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Using Protected Routes in Your Code

To protect your own routes, use the `get_current_user` dependency:

```python
from fastapi import APIRouter, Depends
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter()

@router.get("/my-protected-route")
async def my_protected_route(current_user: User = Depends(get_current_user)):
    return {
        "message": "This is a protected route",
        "user_id": current_user.id,
        "user_email": current_user.email
    }
```

---

## Testing

### Test Successful Registration
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```
**Expected:** 201 Created with token

### Test Duplicate Email
```bash
# Register same email twice
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```
**Expected:** 400 Bad Request - "Email already registered"

### Test Invalid Credentials
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```
**Expected:** 401 Unauthorized - "Incorrect email or password"

### Test Unauthorized Access
```bash
curl http://localhost:8000/auth/me
```
**Expected:** 401 Unauthorized - "Not authenticated"

### Test Valid Token
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl http://localhost:8000/auth/me -H "Authorization: Bearer $TOKEN"
```
**Expected:** 200 OK with user data

---

## Database Verification

Check users in the database:

```bash
# Access PostgreSQL
docker compose exec postgres psql -U postgres -d amcart

# View users
SELECT id, email, created_at FROM users;

# Verify password is hashed
SELECT id, email, SUBSTRING(hashed_password, 1, 20) || '...' as hash_preview FROM users;
```

---

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Password Requirements

- Minimum length: **6 characters**
- Maximum length: **72 characters** (bcrypt limitation)
- Can contain any characters

---

## Token Expiration

- Default expiration: **30 minutes**
- Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable
- Expired tokens return 401 Unauthorized
- Users must login again to get a new token

---

## Future Enhancements

Potential improvements:
- Refresh tokens for extended sessions
- Email verification on registration
- Password reset functionality
- Role-based access control (RBAC)
- Two-factor authentication (2FA)
- Account lockout after failed attempts
- Password complexity requirements
- Social authentication (OAuth2)
