# Quick Start Guide

Get the E-Commerce microservices running in 5 minutes!

## Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed
- 8GB RAM available

### Steps

1. **Clone and Navigate**
```bash
cd E-Commerce
```

2. **Start All Services**
```bash
docker-compose up --build
```

3. **Wait for Services** (2-3 minutes)
Watch for these messages:
```
user-service        | Started UserServiceApplication
inventory-service   | Started InventoryServiceApplication
order-service       | Started OrderServiceApplication
payment-service     | Started PaymentServiceApplication
```

4. **Test the Setup**

Open these URLs in your browser:
- User Service: http://localhost:8081/swagger-ui.html
- Inventory Service: http://localhost:8082/swagger-ui.html
- Order Service: http://localhost:8080/swagger-ui.html
- Payment Service: http://localhost:8083/swagger-ui.html

5. **Run Integration Test**
```bash
bash test-integration.sh
```

**Done!** ✅

---

## Option 2: Run Services Individually

### Prerequisites
- Java 17
- Maven 3.6+

### Steps

**Terminal 1 - User Service:**
```bash
cd user-service
mvn spring-boot:run
```

**Terminal 2 - Inventory Service:**
```bash
cd inventory-service
mvn spring-boot:run
```

**Terminal 3 - Payment Service:**
```bash
cd payment-service
mvn spring-boot:run
```

**Terminal 4 - Order Service:**
```bash
cd order-service
mvn spring-boot:run
```

Wait 30 seconds, then test at http://localhost:8080/swagger-ui.html

---

## Quick Test

### 1. Register a User
```bash
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "address": "123 Test St"
  }'
```

### 2. Create a Product
```bash
curl -X POST http://localhost:8082/api/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Laptop",
    "sku": "LAPTOP001",
    "price": 999.99,
    "stockQuantity": 50,
    "category": "Electronics"
  }'
```

### 3. Create an Order (Tests Full Integration!)
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [{"productId": 1, "quantity": 2}],
    "shippingAddress": "123 Test Street"
  }'
```

**Expected Result:** Order created with status "CONFIRMED" ✅

---

## Troubleshooting

### Services Won't Start
```bash
# Stop all containers
docker-compose down

# Remove old images
docker system prune -a

# Retry
docker-compose up --build
```

### Port Already in Use
```bash
# On Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# On Mac/Linux
lsof -ti:8080 | xargs kill -9
```

### Integration Test Fails
- Make sure all 4 services show "Started" in logs
- Wait 30 seconds after startup
- Check http://localhost:8080/actuator/health shows UP

---

## Next Steps

1. ✅ Explore API Documentation (Swagger UI)
2. ✅ Read [README.md](README.md) for detailed information
3. ✅ Check [DEPLOYMENT.md](DEPLOYMENT.md) for cloud deployment
4. ✅ Review [PROJECT_REPORT.md](PROJECT_REPORT.md) for assignment report

---

## Support

- **Can't access Swagger?** Make sure service is running on correct port
- **Order creation fails?** Check all services are UP in Docker logs
- **Need help?** Check logs: `docker-compose logs -f [service-name]`
