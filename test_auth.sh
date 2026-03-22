#!/bin/bash

# AmCart Authentication System Test Script
# This script demonstrates all authentication features

echo "================================================"
echo "  AmCart Authentication System - Test Suite"
echo "================================================"
echo ""

BASE_URL="http://localhost:8000"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="testpass123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

echo "1. Testing Health Check..."
RESPONSE=$(curl -s ${BASE_URL}/)
if echo "$RESPONSE" | grep -q "healthy"; then
    print_result 0 "Health check endpoint"
else
    print_result 1 "Health check endpoint"
fi
echo ""

echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    print_result 0 "User registration"
    TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   Token received: ${TOKEN:0:20}..."
else
    # User might already exist, try to continue
    if echo "$REGISTER_RESPONSE" | grep -q "Email already registered"; then
        echo -e "${YELLOW}⚠ INFO${NC}: User already registered, continuing with login test"
    else
        print_result 1 "User registration"
        echo "   Response: $REGISTER_RESPONSE"
    fi
fi
echo ""

echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    print_result 0 "User login"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    print_result 1 "User login"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

echo "4. Testing Protected Route (with valid token)..."
ME_RESPONSE=$(curl -s ${BASE_URL}/auth/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "email"; then
    print_result 0 "Access protected route with valid token"
    echo "   User data: $ME_RESPONSE"
else
    print_result 1 "Access protected route with valid token"
fi
echo ""

echo "5. Testing Protected Route (without token)..."
NO_TOKEN_RESPONSE=$(curl -s ${BASE_URL}/auth/me)

if echo "$NO_TOKEN_RESPONSE" | grep -q "Not authenticated"; then
    print_result 0 "Reject access without token"
else
    print_result 1 "Reject access without token"
fi
echo ""

echo "6. Testing Login with Wrong Password..."
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"wrongpassword\"}")

if echo "$WRONG_PASSWORD_RESPONSE" | grep -q "Incorrect email or password"; then
    print_result 0 "Reject incorrect password"
else
    print_result 1 "Reject incorrect password"
fi
echo ""

echo "7. Testing Duplicate Registration..."
DUPLICATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

if echo "$DUPLICATE_RESPONSE" | grep -q "Email already registered"; then
    print_result 0 "Reject duplicate email"
else
    print_result 1 "Reject duplicate email"
fi
echo ""

echo "8. Testing Invalid Email Format..."
INVALID_EMAIL_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "password123"}' \
  2>&1)

if echo "$INVALID_EMAIL_RESPONSE" | grep -q "validation error\|value is not a valid email"; then
    print_result 0 "Reject invalid email format"
else
    print_result 1 "Reject invalid email format"
fi
echo ""

echo "================================================"
echo "  All tests completed!"
echo "================================================"
echo ""
echo "To view API documentation, visit:"
echo "  Swagger UI: ${BASE_URL}/docs"
echo "  ReDoc:      ${BASE_URL}/redoc"
echo ""
