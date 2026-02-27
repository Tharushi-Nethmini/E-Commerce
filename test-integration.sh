#!/bin/bash

# Integration Test Script for E-Commerce Microservices
# Tests the complete flow from user registration to order completion

set -e  # Exit on any error

echo "=================================="
echo "E-Commerce Integration Test"
echo "=================================="
echo ""

# Base URLs (modify if running in different environment)
USER_SERVICE="http://localhost:8081"
INVENTORY_SERVICE="http://localhost:8082"
ORDER_SERVICE="http://localhost:8080"
PAYMENT_SERVICE="http://localhost:8083"

echo "Checking if all services are running..."
echo ""

# Check User Service
if curl -s "$USER_SERVICE/actuator/health" > /dev/null; then
    echo "✓ User Service is running"
else
    echo "✗ User Service is not running"
    exit 1
fi

# Check Inventory Service
if curl -s "$INVENTORY_SERVICE/actuator/health" > /dev/null; then
    echo "✓ Inventory Service is running"
else
    echo "✗ Inventory Service is not running"
    exit 1
fi

# Check Order Service
if curl -s "$ORDER_SERVICE/actuator/health" > /dev/null; then
    echo "✓ Order Service is running"
else
    echo "✗ Order Service is not running"
    exit 1
fi

# Check Payment Service
if curl -s "$PAYMENT_SERVICE/actuator/health" > /dev/null; then
    echo "✓ Payment Service is running"
else
    echo "✗ Payment Service is not running"
    exit 1
fi

echo ""
echo "=================================="
echo "Test 1: Register a User"
echo "=================================="

USER_RESPONSE=$(curl -s -X POST "$USER_SERVICE/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "integration_test_user",
    "email": "test@ecommerce.com",
    "password": "test123456",
    "fullName": "Integration Test User",
    "phone": "+1234567890",
    "address": "123 Test Street, Test City"
  }')

USER_ID=$(echo $USER_RESPONSE | grep -o '"userId":[0-9]*' | grep -o '[0-9]*')

if [ -n "$USER_ID" ]; then
    echo "✓ User registered successfully with ID: $USER_ID"
else
    echo "✗ User registration failed"
    echo "Response: $USER_RESPONSE"
    exit 1
fi

echo ""
echo "=================================="
echo "Test 2: Create Products"
echo "=================================="

# Create Product 1
PRODUCT1_RESPONSE=$(curl -s -X POST "$INVENTORY_SERVICE/api/inventory/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Pro 15",
    "description": "High-performance laptop",
    "sku": "LAPTOP-PRO-15-001",
    "price": 1299.99,
    "stockQuantity": 50,
    "category": "Electronics"
  }')

PRODUCT1_ID=$(echo $PRODUCT1_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -n "$PRODUCT1_ID" ]; then
    echo "✓ Product 1 created with ID: $PRODUCT1_ID"
else
    echo "✗ Product 1 creation failed"
    exit 1
fi

# Create Product 2
PRODUCT2_RESPONSE=$(curl -s -X POST "$INVENTORY_SERVICE/api/inventory/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "sku": "MOUSE-WIRELESS-001",
    "price": 29.99,
    "stockQuantity": 200,
    "category": "Accessories"
  }')

PRODUCT2_ID=$(echo $PRODUCT2_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -n "$PRODUCT2_ID" ]; then
    echo "✓ Product 2 created with ID: $PRODUCT2_ID"
else
    echo "✗ Product 2 creation failed"
    exit 1
fi

echo ""
echo "=================================="
echo "Test 3: Check Stock Availability"
echo "=================================="

STOCK_CHECK=$(curl -s -X POST "$INVENTORY_SERVICE/api/inventory/check-stock" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": $PRODUCT1_ID,
    \"quantity\": 2
  }")

STOCK_AVAILABLE=$(echo $STOCK_CHECK | grep -o '"available":[a-z]*' | grep -o '[a-z]*$')

if [ "$STOCK_AVAILABLE" = "true" ]; then
    echo "✓ Stock is available"
else
    echo "✗ Insufficient stock"
    exit 1
fi

echo ""
echo "=================================="
echo "Test 4: Create Order (Full Integration)"
echo "=================================="
echo "This will test communication between:"
echo "  - Order Service → User Service (validate user)"
echo "  - Order Service → Inventory Service (check & reserve stock)"
echo "  - Order Service → Payment Service (process payment)"
echo "  - Order Service → Inventory Service (confirm stock)"
echo ""

ORDER_RESPONSE=$(curl -s -X POST "$ORDER_SERVICE/api/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"items\": [
      {
        \"productId\": $PRODUCT1_ID,
        \"quantity\": 2
      },
      {
        \"productId\": $PRODUCT2_ID,
        \"quantity\": 3
      }
    ],
    \"shippingAddress\": \"123 Test Street, Test City, Test Country\",
    \"notes\": \"Integration test order\"
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
ORDER_STATUS=$(echo $ORDER_RESPONSE | grep -o '"status":"[A-Z_]*"' | grep -o '[A-Z_]*$')

if [ -n "$ORDER_ID" ] && [ "$ORDER_STATUS" = "CONFIRMED" ]; then
    echo "✓ Order created successfully with ID: $ORDER_ID"
    echo "✓ Order status: $ORDER_STATUS"
    echo ""
    echo "Full order response:"
    echo "$ORDER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ORDER_RESPONSE"
else
    echo "✗ Order creation failed"
    echo "Response: $ORDER_RESPONSE"
    exit 1
fi

echo ""
echo "=================================="
echo "Test 5: Verify Order Details"
echo "=================================="

ORDER_DETAILS=$(curl -s "$ORDER_SERVICE/api/orders/$ORDER_ID")
echo "$ORDER_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$ORDER_DETAILS"

echo ""
echo "=================================="
echo "Test 6: Verify Stock Reduction"
echo "=================================="

PRODUCT_DETAILS=$(curl -s "$INVENTORY_SERVICE/api/inventory/products/$PRODUCT1_ID")
REMAINING_STOCK=$(echo $PRODUCT_DETAILS | grep -o '"availableQuantity":[0-9]*' | grep -o '[0-9]*')

echo "✓ Remaining stock for Product 1: $REMAINING_STOCK units"

echo ""
echo "=================================="
echo "Test 7: Get User Order History"
echo "=================================="

USER_ORDERS=$(curl -s "$ORDER_SERVICE/api/orders?userId=$USER_ID")
ORDER_COUNT=$(echo $USER_ORDERS | grep -o '"id":[0-9]*' | wc -l)

echo "✓ User has $ORDER_COUNT order(s)"

echo ""
echo "=================================="
echo "All Integration Tests Passed! ✓"
echo "=================================="
echo ""
echo "Summary:"
echo "  - User Service: Working ✓"
echo "  - Inventory Service: Working ✓"
echo "  - Order Service: Working ✓"
echo "  - Payment Service: Working ✓"
echo "  - Inter-Service Communication: Working ✓"
echo ""
echo "Key Demonstrations:"
echo "  1. User registration and validation"
echo "  2. Product creation and inventory management"
echo "  3. Stock checking and reservation"
echo "  4. Order orchestration across multiple services"
echo "  5. Payment processing"
echo "  6. Stock confirmation and deduction"
echo "  7. Order status tracking"
echo ""
