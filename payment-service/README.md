# Payment Service

Payment processing microservice for the e-commerce application.

## Features

- Payment processing with multiple payment methods
- Transaction ID generation
- Payment status tracking
- Payment history by user/order
- Refund processing
- Payment gateway simulation (90% success rate)
- Duplicate payment prevention
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (development), can be replaced with PostgreSQL/MySQL
- **Documentation**: SpringDoc OpenAPI 3
- **Build Tool**: Maven
- **Containerization**: Docker

## API Endpoints

### Payment Processing

- `POST /api/payments/process` - Process a payment (for inter-service communication)
- `GET /api/payments/{id}` - Get payment by ID
- `GET /api/payments/order/{orderId}` - Get payment by order ID
- `GET /api/payments/transaction/{transactionId}` - Get payment by transaction ID
- `GET /api/payments` - Get all payments (with optional userId filter)
- `POST /api/payments/{id}/refund` - Process a refund

### Documentation

- Swagger UI: `http://localhost:8083/swagger-ui.html`
- API Docs: `http://localhost:8083/v3/api-docs`

## Running Locally

```bash
# Build the project
mvn clean package

# Run the application
mvn spring-boot:run
```

The service will start on `http://localhost:8083`

## Running with Docker

```bash
# Build the Docker image
docker build -t payment-service:latest .

# Run the container
docker run -p 8083:8083 payment-service:latest
```

## Inter-Service Communication

This service is called by the **Order Service** to process payments.

### Example: Process Payment

```bash
curl -X POST http://localhost:8083/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "userId": 1,
    "amount": 299.97,
    "paymentMethod": "CREDIT_CARD"
  }'
```

Response:
```json
{
  "id": 1,
  "orderId": 1,
  "userId": 1,
  "amount": 299.97,
  "status": "COMPLETED",
  "paymentMethod": "CREDIT_CARD",
  "transactionId": "TXN17093456781",
  "message": "Payment completed successfully",
  "createdAt": "2026-02-25T10:30:00",
  "processedAt": "2026-02-25T10:30:01"
}
```

## Payment Methods

- `CREDIT_CARD` - Credit card payment
- `DEBIT_CARD` - Debit card payment
- `PAYPAL` - PayPal payment
- `BANK_TRANSFER` - Bank transfer
- `CASH_ON_DELIVERY` - Cash on delivery

## Payment Status Flow

```
PENDING → PROCESSING → COMPLETED
                    ↓
                  FAILED

COMPLETED → REFUNDED
```

## Payment Gateway Simulation

This service simulates a payment gateway with:
- **Success Rate**: 90% (configurable)
- **Processing Time**: ~1 second
- **Unique Transaction ID**: Auto-generated for each payment
- **Duplicate Prevention**: Checks if payment exists for order

In production, this would be replaced with actual payment gateway integration (Stripe, PayPal, etc.).

## Security Features

1. **Transaction Tracking**: Unique transaction IDs for all payments
2. **Duplicate Prevention**: Prevents multiple payments for same order
3. **Input Validation**: Bean validation on all DTOs
4. **Non-root Docker User**: Container runs as non-root user
5. **SAST Integration**: SonarCloud for code quality
6. **Dependency Scanning**: Snyk for vulnerabilities
7. **Payment Method Validation**: Enum-based validation

## Error Handling

The service handles various error scenarios:
- Duplicate payment attempts
- Invalid order IDs
- Payment gateway failures
- Refund of non-completed payments

## License

This project is for academic purposes (SLIIT - SE4010 Assignment).
