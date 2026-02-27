# User Service

User authentication and management microservice for the e-commerce application.

## Features

- User registration with validation
- User login with JWT token generation
- JWT token validation for other services
- User profile management (CRUD operations)
- Password encryption using BCrypt
- Role-based user types (CUSTOMER, ADMIN, VENDOR)
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (development), can be replaced with PostgreSQL/MySQL
- **Security**: Spring Security + JWT
- **Documentation**: SpringDoc OpenAPI 3
- **Build Tool**: Maven
- **Containerization**: Docker

## API Endpoints

### Public Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token
- `POST /api/users/validate` - Validate JWT token (for inter-service communication)
- `POST /api/users/validate/user` - Get user details from JWT token

### Protected Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Delete user

### Documentation

- Swagger UI: `http://localhost:8081/swagger-ui.html`
- API Docs: `http://localhost:8081/v3/api-docs`

## Running Locally

### Prerequisites

- Java 17 or higher
- Maven 3.6+

### Steps

```bash
# Clone the repository
git clone <your-repo-url>
cd user-service

# Build the project
mvn clean package

# Run the application
mvn spring-boot:run
```

The service will start on `http://localhost:8081`

## Running with Docker

```bash
# Build the Docker image
docker build -t user-service:latest .

# Run the container
docker run -p 8081:8081 user-service:latest
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | 8081 |
| `JWT_SECRET` | JWT signing secret | (set in application.properties) |
| `JWT_EXPIRATION` | JWT expiration time in ms | 86400000 (24 hours) |

## Inter-Service Communication

This service provides authentication and user validation for other services:

- **Order Service**: Validates user tokens before creating orders
- **Payment Service**: Retrieves user information for payment processing
- **Inventory Service**: Validates admin users for inventory management

### Example: Validating Token

```bash
curl -X POST http://localhost:8081/api/users/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token"}'
```

Response:
```json
{
  "valid": true
}
```

## Security Features

1. **Password Encryption**: BCrypt hashing algorithm
2. **JWT Authentication**: Stateless token-based authentication
3. **HTTPS Ready**: Configure SSL certificates for production
4. **Non-root Docker User**: Container runs as non-root user
5. **Input Validation**: Bean validation on all DTOs
6. **SAST Integration**: SonarCloud for code quality and security
7. **Dependency Scanning**: Snyk for vulnerability detection

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

1. **Code Quality**: SonarCloud SAST scanning
2. **Security**: Snyk dependency vulnerability scanning
3. **Build**: Maven build and test
4. **Containerization**: Docker image build and push to Docker Hub
5. **Deployment**: Automatic deployment to cloud provider

### Required Secrets

Configure these in GitHub repository secrets:

- `SONAR_TOKEN`: SonarCloud authentication token
- `SNYK_TOKEN`: Snyk authentication token
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/access token

## Testing

```bash
# Run unit tests
mvn test

# Run with coverage
mvn test jacoco:report
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is for academic purposes (SLIIT - SE4010 Assignment).
