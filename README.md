# E-Commerce Microservices Application

A complete microservices-based e-commerce application demonstrating DevOps practices and cloud capabilities for SLIIT SE4010 assignment.

## 🏗️ Architecture Overview

This project consists of 4 independently deployable microservices:

1. **User Service** (Port 8081) - User authentication and management
2. **Inventory Service** (Port 8082) - Product catalog and stock management
3. **Order Service** (Port 8080) - Order orchestration (coordinator)
4. **Payment Service** (Port 8083) - Payment processing

### Communication Flow

```
Client → Order Service → User Service (validate user)
                      → Inventory Service (check & reserve stock)
                      → Payment Service (process payment)
                      → Inventory Service (confirm stock)
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                    (Web/Mobile App)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / Load Balancer              │
│              (AWS ALB / Azure Application Gateway)          │
└──────┬────────────┬────────────┬─────────────┬──────────────┘
       │            │            │             │
       ▼            ▼            ▼             ▼
  ┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐
  │  User  │  │Inventory│  │ Order  │  │ Payment  │
  │Service │  │ Service │  │Service │  │ Service  │
  │ :8081  │  │  :8082  │  │ :8080  │  │  :8083   │
  └───┬────┘  └────┬────┘  └───┬────┘  └────┬─────┘
      │            │           │            │
      ▼            ▼           ▼            ▼
  ┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐
  │   H2   │  │   H2    │  │   H2   │  │    H2    │
  │   DB   │  │   DB    │  │   DB   │  │    DB    │
  └────────┘  └─────────┘  └────────┘  └──────────┘
       │            │           │            │
       └────────────┴───────────┴────────────┘
                      │
                      ▼
          ┌──────────────────────────┐
          │  Container Registry      │
          │  (Docker Hub / ECR)      │
          └──────────────────────────┘
                      │
                      ▼
          ┌──────────────────────────┐
          │  Cloud Deployment        │
          │  (AWS ECS / Azure Apps)  │
          └──────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Docker and Docker Compose
- Git

### Running Locally (Individual Services)

Each service can run independently:

```bash
# User Service
cd user-service
mvn spring-boot:run

# Inventory Service
cd inventory-service
mvn spring-boot:run

# Payment Service
cd payment-service
mvn spring-boot:run

# Order Service
cd order-service
mvn spring-boot:run
```

### Running with Docker Compose

Run all services together:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📝 API Documentation

Each service has Swagger UI for API documentation:

- User Service: http://localhost:8081/swagger-ui.html
- Inventory Service: http://localhost:8082/swagger-ui.html
- Order Service: http://localhost:8080/swagger-ui.html
- Payment Service: http://localhost:8083/swagger-ui.html

## 🔄 Inter-Service Communication Demo

### Step 1: Register a User

```bash
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
  }'
```

### Step 2: Create Products

```bash
curl -X POST http://localhost:8082/api/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "sku": "LAPTOP001",
    "price": 999.99,
    "stockQuantity": 50,
    "category": "Electronics"
  }'
```

### Step 3: Create an Order (Demonstrates Full Integration)

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ],
    "shippingAddress": "123 Main St, City, Country",
    "notes": "Please deliver in the evening"
  }'
```

**This single API call demonstrates:**
1. ✅ Order Service validates user with User Service
2. ✅ Order Service checks stock with Inventory Service
3. ✅ Order Service reserves stock in Inventory Service
4. ✅ Order Service processes payment with Payment Service
5. ✅ Order Service confirms stock deduction in Inventory Service

## 🛠️ DevOps Practices Implemented

### 1. Version Control
- Git with meaningful commit messages
- Separate repositories for each microservice
- `.gitignore` for build artifacts

### 2. CI/CD Pipeline (GitHub Actions)
Each service has automated pipeline:
- ✅ Code checkout
- ✅ Build with Maven
- ✅ Run tests
- ✅ SonarCloud SAST scanning
- ✅ Snyk dependency scanning
- ✅ Docker image build
- ✅ Push to Docker Hub
- ✅ Cloud deployment (configurable)

### 3. Containerization
- Multi-stage Docker builds for optimized images
- Non-root user for security
- Health checks
- `.dockerignore` for clean builds

### 4. Infrastructure as Code
- Docker Compose for local orchestration
- Configuration externalized via environment variables

## 🔒 Security Measures Implemented

### Application Security
1. **Authentication & Authorization**: JWT-based authentication in User Service
2. **Password Encryption**: BCrypt hashing
3. **Input Validation**: Bean validation on all DTOs
4. **Least Privilege**: Each service has minimal permissions

### DevSecOps
1. **SAST**: SonarCloud integration for code quality and security
2. **Dependency Scanning**: Snyk for vulnerability detection
3. **Container Security**: Non-root users in Docker containers
4. **Secrets Management**: Use of GitHub Secrets for sensitive data

### Cloud Security
1. **IAM Roles**: Services use IAM roles (no hardcoded credentials)
2. **Security Groups**: Network isolation between services
3. **HTTPS**: TLS/SSL for production deployments
4. **Health Monitoring**: Actuator endpoints for health checks

## ☁️ Cloud Deployment Guide

### AWS Deployment (ECS with Fargate)

1. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name user-service
aws ecr create-repository --repository-name inventory-service
aws ecr create-repository --repository-name order-service
aws ecr create-repository --repository-name payment-service
```

2. **Push Images to ECR**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag user-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/user-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/user-service:latest
```

3. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name ecommerce-cluster --capacity-providers FARGATE
```

4. **Create Task Definitions** (One per service)
5. **Create Services** (One per service)
6. **Configure Application Load Balancer**

### Azure Deployment (Container Apps)

1. **Create Container Registry**
```bash
az acr create --resource-group ecommerce-rg --name ecommerceacr --sku Basic
```

2. **Push Images**
```bash
az acr login --name ecommerceacr
docker tag user-service:latest ecommerceacr.azurecr.io/user-service:latest
docker push ecommerceacr.azurecr.io/user-service:latest
```

3. **Create Container Apps**
```bash
az containerapp create \
  --name user-service \
  --resource-group ecommerce-rg \
  --environment myenvironment \
  --image ecommerceacr.azurecr.io/user-service:latest \
  --target-port 8081 \
  --ingress external
```

## 📈 Monitoring & Observability

Each service exposes Actuator endpoints:
- `/actuator/health` - Health status
- `/actuator/info` - Service information
- `/actuator/metrics` - Metrics

## 🧪 Testing the Integration

Run the provided test script:

```bash
# Make script executable
chmod +x test-integration.sh

# Run tests
./test-integration.sh
```

## 📦 Project Structure

```
E-Commerce/
├── user-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
├── inventory-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
├── order-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
├── payment-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
├── docker-compose.yml
├── README.md
└── DEPLOYMENT.md
```

## 🎯 Assignment Deliverables Checklist

- ✅ **4 Microservices**: User, Inventory, Order, Payment
- ✅ **Inter-Service Communication**: Order Service communicates with all others
- ✅ **CI/CD Pipelines**: GitHub Actions for all services
- ✅ **Containerization**: Docker with multi-stage builds
- ✅ **Cloud Deployment Ready**: AWS/Azure configurations
- ✅ **DevSecOps**: SonarCloud + Snyk integration
- ✅ **Security**: JWT, IAM roles, security groups
- ✅ **Documentation**: README files and API docs
- ✅ **Architecture Diagram**: Included above

## 🤝 Team Collaboration

This project is designed for 4 students, each owning one microservice:

- **Student 1**: User Service
- **Student 2**: Inventory Service
- **Student 3**: Order Service
- **Student 4**: Payment Service

Each service can be developed independently while maintaining the integration contracts.

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## 📝 License

This project is for academic purposes (SLIIT - SE4010 Assignment - 2026).

## 👥 Contributors

Your team members' names here.

## 🙏 Acknowledgments

- SLIIT Department of Computer Science & Software Engineering
- SE4010 - Current Trends in Software Engineering Module
