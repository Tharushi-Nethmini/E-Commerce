# Inventory Service

Product catalog and inventory management microservice for the e-commerce application.

## Features

- Product CRUD operations
- Stock management (quantity tracking)
- Stock reservation system
- Category-based product filtering
- Stock availability checking for other services
- Real-time stock updates
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (development), can be replaced with PostgreSQL/MySQL
- **Documentation**: SpringDoc OpenAPI 3
- **Build Tool**: Maven
- **Containerization**: Docker

## API Endpoints

### Product Management

- `POST /api/inventory/products` - Create a new product
- `GET /api/inventory/products` - Get all products (with optional category filter)
- `GET /api/inventory/products/{id}` - Get product by ID
- `PUT /api/inventory/products/{id}` - Update product
- `DELETE /api/inventory/products/{id}` - Delete product

### Stock Management (Inter-Service Communication)

- `POST /api/inventory/check-stock` - Check stock availability
- `POST /api/inventory/reserve-stock` - Reserve stock for an order
- `POST /api/inventory/release-stock` - Release reserved stock
- `POST /api/inventory/confirm-stock` - Confirm stock purchase

### Documentation

- Swagger UI: `http://localhost:8082/swagger-ui.html`
- API Docs: `http://localhost:8082/v3/api-docs`

## Running Locally

```bash
# Build the project
mvn clean package

# Run the application
mvn spring-boot:run
```

The service will start on `http://localhost:8082`

## Running with Docker

```bash
# Build the Docker image
docker build -t inventory-service:latest .

# Run the container
docker run -p 8082:8082 inventory-service:latest
```

## Inter-Service Communication

This service provides inventory management for:

- **Order Service**: Checks stock availability and reserves stock when orders are created
- **Admin/Vendor Services**: Manages product catalog and stock levels

### Example: Check Stock Availability

```bash
curl -X POST http://localhost:8082/api/inventory/check-stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 5
  }'
```

Response:
```json
{
  "productId": 1,
  "available": true,
  "requestedQuantity": 5,
  "availableQuantity": 50,
  "message": "Stock available. Requested: 5, Available: 50"
}
```

## Stock Management Flow

1. **Check Stock**: Order Service checks if product is available
2. **Reserve Stock**: If available, stock is reserved during order processing
3. **Confirm Stock**: After successful payment, stock is confirmed (deducted)
4. **Release Stock**: If payment fails, reserved stock is released

## Security Features

1. **Input Validation**: Bean validation on all DTOs
2. **Non-root Docker User**: Container runs as non-root user
3. **SAST Integration**: SonarCloud for code quality
4. **Dependency Scanning**: Snyk for vulnerabilities

## License

This project is for academic purposes (SLIIT - SE4010 Assignment).
