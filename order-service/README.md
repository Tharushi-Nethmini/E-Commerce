# Order Service

Order management and orchestration microservice for the e-commerce application.

## Features

- Order creation with multi-item support
- Order orchestration (coordinates with User, Inventory, and Payment services)
- Stock reservation and confirmation
- Payment processing integration
- Order status management
- Order cancellation with automatic stock release
- User order history
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (development), can be replaced with PostgreSQL/MySQL
- **Inter-Service Communication**: WebClient (Spring WebFlux)
- **Documentation**: SpringDoc OpenAPI 3
- **Build Tool**: Maven
- **Containerization**: Docker

## API Endpoints

### Order Management

- `POST /api/orders` - Create a new order (orchestrates with all services)
- `GET /api/orders` - Get all orders (with optional userId filter)
- `GET /api/orders/{id}` - Get order by ID
- `PATCH /api/orders/{id}/status` - Update order status
- `POST /api/orders/{id}/cancel` - Cancel an order

### Documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

## Running Locally

```bash
# Build the project
mvn clean package

# Run the application
mvn spring-boot:run
```

The service will start on `http://localhost:8080`

## Running with Docker

```bash
# Build the Docker image
docker build -t order-service:latest .

# Run the container
docker run -p 8080:8080 \
  -e services.user-service.url=http://host.docker.internal:8081 \
  -e services.inventory-service.url=http://host.docker.internal:8082 \
  -e services.payment-service.url=http://host.docker.internal:8083 \
  order-service:latest
```

## Inter-Service Communication Flow

The Order Service acts as an **orchestrator** and coordinates with multiple services:

### Order Creation Flow:

1. **Validate User** → Calls User Service to verify user exists
2. **Check Stock** → Calls Inventory Service to verify product availability
3. **Reserve Stock** → Calls Inventory Service to reserve items
4. **Create Order** → Saves order in database
5. **Process Payment** → Calls Payment Service to process payment
6. **Confirm Stock** → Calls Inventory Service to deduct stock
7. **Update Order Status** → Updates order to CONFIRMED

### Error Handling:

- If payment fails, reserved stock is automatically released
- Order status is set to FAILED
- Transaction rollback ensures data consistency

### Example: Create Order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2
      },
      {
        "productId": 2,
        "quantity": 1
      }
    ],
    "shippingAddress": "123 Main St, City, Country",
    "notes": "Please deliver in the evening"
  }'
```

Response:
```json
{
  "id": 1,
  "userId": 1,
  "totalAmount": 299.97,
  "status": "CONFIRMED",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Product A",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98
    }
  ],
  "shippingAddress": "123 Main St, City, Country",
  "paymentId": "TXN123456",
  "createdAt": "2026-02-25T10:30:00"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | 8080 |
| `services.user-service.url` | User Service URL | http://localhost:8081 |
| `services.inventory-service.url` | Inventory Service URL | http://localhost:8082 |
| `services.payment-service.url` | Payment Service URL | http://localhost:8083 |

## Order Status Flow

```
PENDING → PAYMENT_PENDING → PAYMENT_COMPLETED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                                     ↓
                                                 CANCELLED
                                                     ↓
                                                  FAILED
```

## Security Features

1. **Transaction Management**: Ensures data consistency
2. **Error Handling**: Automatic stock release on failures
3. **Input Validation**: Bean validation on all DTOs
4. **Non-root Docker User**: Container runs as non-root user
5. **SAST Integration**: SonarCloud for code quality
6. **Dependency Scanning**: Snyk for vulnerabilities

## License

This project is for academic purposes (SLIIT - SE4010 Assignment).
