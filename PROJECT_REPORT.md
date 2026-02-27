# Project Report: E-Commerce Microservices Application

## SE4010 - Current Trends in Software Engineering
## Cloud Computing Assignment - 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Microservices Description](#microservices-description)
3. [Inter-Service Communication](#inter-service-communication)
4. [DevOps Practices](#devops-practices)
5. [Security Measures](#security-measures)
6. [Challenges and Solutions](#challenges-and-solutions)
7. [Conclusion](#conclusion)

---

## 1. Architecture Overview

### 1.1 System Architecture

Our e-commerce application is built using a microservices architecture with four independently deployable services. Each service is containerized using Docker and can be deployed on cloud platforms like AWS or Azure.

**Architecture Diagram:**

```
┌────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                          │
│                     (Web/Mobile Application)                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
│              (AWS ALB / Azure Application Gateway)             │
│            Routes requests to appropriate services             │
└──────┬──────────────┬──────────────┬──────────────┬───────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   User   │   │Inventory │   │  Order   │   │ Payment  │
│ Service  │   │ Service  │   │ Service  │   │ Service  │
│  :8081   │◄──┤  :8082   │◄──┤  :8080   │◄──┤  :8083   │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ User DB  │   │Product DB│   │ Order DB │   │Payment DB│
│   (H2)   │   │   (H2)   │   │   (H2)   │   │   (H2)   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 1.2 Technology Stack

- **Backend Framework:** Spring Boot 3.2.0
- **Language:** Java 17
- **Database:** H2 (development), PostgreSQL/MySQL (production)
- **Containerization:** Docker with multi-stage builds
- **Container Registry:** Docker Hub / AWS ECR / Azure ACR
- **Cloud Platforms:** AWS ECS (Fargate) / Azure Container Apps
- **CI/CD:** GitHub Actions
- **API Documentation:** SpringDoc OpenAPI 3 (Swagger)
- **Security:** Spring Security, JWT
- **DevSecOps:** SonarCloud (SAST), Snyk (Dependency Scanning)

---

## 2. Microservices Description

### 2.1 User Service (Student 1)

**Port:** 8081  
**Responsibility:** User authentication and profile management

**Key Features:**
- User registration with validation
- Login with JWT token generation
- Token validation for other services
- User profile CRUD operations
- Password encryption using BCrypt
- Role-based user types (CUSTOMER, ADMIN, VENDOR)

**API Endpoints:**
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/{id}` - Get user details
- `POST /api/users/validate` - Validate JWT token (for inter-service calls)

**Role in Application:** Provides authentication and user information to other services, particularly the Order Service which validates users before creating orders.

---

### 2.2 Inventory Service (Student 2)

**Port:** 8082  
**Responsibility:** Product catalog and inventory management

**Key Features:**
- Product CRUD operations
- Stock quantity tracking
- Stock reservation system
- Category-based filtering
- Stock availability checking
- Real-time inventory updates

**API Endpoints:**
- `POST /api/inventory/products` - Create product
- `GET /api/inventory/products` - Get all products
- `POST /api/inventory/check-stock` - Check stock availability
- `POST /api/inventory/reserve-stock` - Reserve stock for order
- `POST /api/inventory/confirm-stock` - Confirm stock deduction

**Role in Application:** Manages product catalog and ensures stock availability. The Order Service communicates with this service to check, reserve, and confirm stock during order processing.

---

### 2.3 Order Service (Student 3) - **ORCHESTRATOR**

**Port:** 8080  
**Responsibility:** Order management and service orchestration

**Key Features:**
- Order creation with multiple items
- Service orchestration (coordinates with User, Inventory, Payment services)
- Order status management
- Order cancellation with automatic stock release
- Transaction management
- Error handling and rollback

**API Endpoints:**
- `POST /api/orders` - Create order (triggers full integration flow)
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders/{id}/cancel` - Cancel order

**Role in Application:** Acts as the central orchestrator that coordinates the entire order workflow by calling User, Inventory, and Payment services in sequence.

**Order Creation Flow:**
1. Validate user with User Service
2. For each product: Check stock with Inventory Service
3. Reserve stock with Inventory Service
4. Create order in database
5. Process payment with Payment Service
6. Confirm stock deduction with Inventory Service
7. Update order status to CONFIRMED

---

### 2.4 Payment Service (Student 4)

**Port:** 8083  
**Responsibility:** Payment processing

**Key Features:**
- Payment processing with multiple methods
- Transaction ID generation
- Payment status tracking
- Refund processing
- Payment gateway simulation
- Duplicate payment prevention

**API Endpoints:**
- `POST /api/payments/process` - Process payment
- `GET /api/payments/order/{orderId}` - Get payment by order
- `POST /api/payments/{id}/refund` - Process refund

**Role in Application:** Handles payment processing for orders. Called by the Order Service after stock reservation to complete the transaction.

---

## 3. Inter-Service Communication

### 3.1 Communication Pattern

All services communicate using **synchronous REST API calls** via Spring's WebClient. This ensures real-time validation and immediate feedback.

### 3.2 Communication Examples

#### Example 1: Order Service → User Service

**Purpose:** Validate user exists before creating order

```java
UserResponse user = webClientBuilder.build()
    .get()
    .uri(userServiceUrl + "/api/users/" + userId)
    .retrieve()
    .bodyToMono(UserResponse.class)
    .block();
```

**Demonstration:** When creating an order, the Order Service first validates the user ID exists in the User Service.

---

#### Example 2: Order Service → Inventory Service

**Purpose:** Check and reserve stock

```java
// Check stock availability
StockCheckResponse stockCheck = webClientBuilder.build()
    .post()
    .uri(inventoryServiceUrl + "/api/inventory/check-stock")
    .bodyValue(request)
    .retrieve()
    .bodyToMono(StockCheckResponse.class)
    .block();

// Reserve stock
webClientBuilder.build()
    .post()
    .uri(inventoryServiceUrl + "/api/inventory/reserve-stock")
    .bodyValue(request)
    .retrieve()
    .bodyToMono(Void.class)
    .block();
```

**Demonstration:** Order Service checks if products are in stock, then reserves them before payment.

---

#### Example 3: Order Service → Payment Service

**Purpose:** Process payment

```java
PaymentResponse payment = webClientBuilder.build()
    .post()
    .uri(paymentServiceUrl + "/api/payments/process")
    .bodyValue(paymentRequest)
    .retrieve()
    .bodyToMono(PaymentResponse.class)
    .block();
```

**Demonstration:** After stock reservation, Order Service processes payment through Payment Service.

---

### 3.3 Complete Integration Flow

```
Step 1: Client → Order Service
  POST /api/orders { userId: 1, items: [...] }

Step 2: Order Service → User Service
  GET /api/users/1
  Response: User details

Step 3: Order Service → Inventory Service
  POST /api/inventory/check-stock { productId: 1, quantity: 2 }
  Response: { available: true }

Step 4: Order Service → Inventory Service
  POST /api/inventory/reserve-stock { productId: 1, quantity: 2 }
  Response: Success

Step 5: Order Service → Payment Service
  POST /api/payments/process { orderId: 1, amount: 199.98 }
  Response: { status: "COMPLETED", transactionId: "TXN123" }

Step 6: Order Service → Inventory Service
  POST /api/inventory/confirm-stock { productId: 1, quantity: 2 }
  Response: Success

Step 7: Order Service → Client
  Response: Order created with status CONFIRMED
```

---

## 4. DevOps Practices

### 4.1 Version Control (Git/GitHub)

**Implementation:**
- Each microservice has its own Git repository
- Meaningful commit messages following conventional commits
- `.gitignore` to exclude build artifacts and sensitive files
- README documentation for each service

**Benefits:**
- Independent versioning of services
- Easy collaboration and code review
- Clear change history

---

### 4.2 CI/CD Pipeline (GitHub Actions)

**Pipeline Configuration:** Each service has a `.github/workflows/ci.yml` file

**Pipeline Stages:**

1. **Code Checkout**
   ```yaml
   - uses: actions/checkout@v3
   ```

2. **Build Environment Setup**
   ```yaml
   - name: Set up JDK 17
     uses: actions/setup-java@v3
   ```

3. **Security Scanning (DevSecOps)**
   - **SonarCloud:** Static Application Security Testing (SAST)
   - **Snyk:** Dependency vulnerability scanning

4. **Build & Test**
   ```yaml
   - name: Build with Maven
     run: mvn clean package
   ```

5. **Containerization**
   - Build Docker image using multi-stage Dockerfile
   - Push to Docker Hub with tags (latest, commit SHA)

6. **Deployment** (Optional)
   - Deploy to AWS ECS or Azure Container Apps

**Benefits:**
- Automated testing on every commit
- Early detection of security vulnerabilities
- Consistent build process
- Automated deployment

---

### 4.3 Containerization (Docker)

**Multi-Stage Dockerfile:**

```dockerfile
# Stage 1: Build
FROM maven:3.8.8-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Benefits:**
- Small image size (JRE only, no build tools)
- Non-root user for security
- Cacheable layers for faster builds
- Health checks included

---

### 4.4 Infrastructure as Code

**Docker Compose for Local Development:**

```yaml
services:
  user-service:
    build: ./user-service
    ports: ["8081:8081"]
  
  inventory-service:
    build: ./inventory-service
    ports: ["8082:8082"]
  
  order-service:
    build: ./order-service
    ports: ["8080:8080"]
    depends_on:
      - user-service
      - inventory-service
      - payment-service
```

**Benefits:**
- One-command setup for entire application
- Consistent development environment
- Service dependency management

---

## 5. Security Measures

### 5.1 Application Security

#### 5.1.1 Authentication & Authorization (User Service)

**JWT Token-Based Authentication:**
- Users receive JWT tokens upon successful login
- Tokens contain user ID and username
- Tokens expire after 24 hours
- Other services validate tokens via User Service

**Implementation:**
```java
@Component
public class JwtTokenProvider {
    public String generateToken(String username, Long userId) {
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(username)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }
}
```

---

#### 5.1.2 Password Security

**BCrypt Hashing:**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

All passwords are hashed using BCrypt (strength 10) before storage.

---

#### 5.1.3 Input Validation

**Bean Validation on all DTOs:**
```java
@Data
public class UserRegistrationRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    private String username;
    
    @Email(message = "Email should be valid")
    private String email;
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
```

---

### 5.2 DevSecOps Practices

#### 5.2.1 Static Application Security Testing (SAST)

**SonarCloud Integration:**
- Analyzes code for security vulnerabilities
- Checks for code smells and bugs
- Measures code coverage
- Enforces quality gates

**Configuration:**
```yaml
- name: SonarCloud Scan
  run: mvn verify sonar:sonar
    -Dsonar.projectKey=your-org_service-name
    -Dsonar.organization=your-org
```

---

#### 5.2.2 Dependency Vulnerability Scanning

**Snyk Integration:**
- Scans Maven dependencies for known vulnerabilities
- Reports CVEs in third-party libraries
- Suggests upgrade paths

**Configuration:**
```yaml
- name: Run Snyk
  uses: snyk/actions/maven@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

### 5.3 Cloud Security

#### 5.3.1 IAM Roles (Least Privilege)

**AWS ECS Task Role:**
- Services use IAM roles instead of access keys
- Each service has minimum required permissions
- No hardcoded credentials

**Example:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": "arn:aws:logs:region:account:log-group:/ecs/user-service:*"
  }]
}
```

---

#### 5.3.2 Network Security (Security Groups)

**Security Group Configuration:**
- Load Balancer SG: Allow inbound HTTP/HTTPS from internet
- Service SG: Allow inbound only from Load Balancer SG
- Database SG: Allow inbound only from Service SG

**Example:**
```bash
# Service security group - only allow ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-service \
  --protocol tcp \
  --port 8080 \
  --source-group sg-alb
```

---

#### 5.3.3 Container Security

1. **Non-root User:** All containers run as non-root user
   ```dockerfile
   RUN adduser -S appuser -G appgroup
   USER appuser
   ```

2. **Image Scanning:** Docker Hub/ECR automatic vulnerability scanning

3. **Minimal Base Images:** Using Alpine Linux for smaller attack surface

---

### 5.4 Secrets Management

**Never Hardcode Secrets:**
- JWT secrets configured via environment variables
- Database credentials managed by cloud provider
- API keys stored in AWS Secrets Manager / Azure Key Vault

**Environment Variables:**
```properties
# application.properties
jwt.secret=${JWT_SECRET:default-secret-for-dev}
```

---

## 6. Challenges and Solutions

### 6.1 Inter-Service Communication Challenges

#### Challenge: Service Discovery
**Problem:** Services need to know URLs of other services
**Solution:** 
- Local: Docker Compose service names
- Cloud: Load Balancer DNS names
- Configuration via environment variables

#### Challenge: Network Latency
**Problem:** Multiple HTTP calls increase response time
**Solution:**
- Keep databases lightweight (H2 for demo)
- Consider async messaging for non-critical operations
- Implement circuit breakers (future enhancement)

---

### 6.2 Transaction Management

#### Challenge: Distributed Transactions
**Problem:** Order creation involves multiple services; if payment fails, need to rollback stock reservation

**Solution: Saga Pattern (Compensating Transactions)**
```java
try {
    reserveStock();
    processPayment();
    confirmStock();
} catch (Exception e) {
    // Compensate: release reserved stock
    releaseStock();
    throw new RuntimeException("Order failed");
}
```

---

### 6.3 Development Challenges

#### Challenge: Running Multiple Services Locally
**Problem:** Difficult to run 4 services simultaneously for testing

**Solution:**
- Docker Compose for one-command startup
- Health checks to ensure dependencies are ready
- Integration test script (`test-integration.sh`)

#### Challenge: Service Dependencies
**Problem:** Order Service depends on other three services

**Solution:**
- Docker Compose `depends_on` with health checks
- Graceful error handling when services unavailable
- Clear logging for debugging

---

### 6.4 Cloud Deployment Challenges

#### Challenge: Free Tier Limits
**Problem:** Need to stay within AWS/Azure free tier

**Solution:**
- Use smallest instance sizes (0.25 vCPU, 0.5GB RAM)
- Set up billing alerts
- Auto-scaling with min=0 for non-critical times

#### Challenge: Security Group Configuration
**Problem:** Services couldn't communicate initially

**Solution:**
- Properly configured security groups
- Used service discovery via internal DNS
- Tested connectivity using CloudWatch logs

---

## 7. Conclusion

### 7.1 Key Achievements

✅ **Microservices Architecture**
- Successfully implemented 4 independently deployable services
- Clear separation of concerns
- Demonstrated inter-service communication

✅ **DevOps Practices**
- Complete CI/CD pipelines with GitHub Actions
- Automated testing and security scanning
- Containerization with Docker

✅ **DevSecOps**
- SAST with SonarCloud
- Dependency scanning with Snyk
- Security best practices implemented

✅ **Cloud Deployment**
- Services deployed to AWS/Azure
- Load balancing configured
- Health monitoring enabled

✅ **Security**
- JWT authentication
- BCrypt password hashing
- IAM roles and security groups
- Input validation

---

### 7.2 Learning Outcomes

1. **Microservices Design:** Understanding of service boundaries and communication patterns
2. **DevOps Pipeline:** Hands-on experience with CI/CD automation
3. **Cloud Deployment:** Practical knowledge of AWS ECS/Azure Container Apps
4. **Security:** Implementation of security best practices and DevSecOps
5. **Orchestration:** Understanding of service coordination and transaction management

---

### 7.3 Future Enhancements

1. **API Gateway:** Implement Spring Cloud Gateway for unified entry point
2. **Service Mesh:** Use Istio for advanced traffic management
3. **Message Queue:** Add RabbitMQ/Kafka for asynchronous communication
4. **Database:** Replace H2 with PostgreSQL/MongoDB for production
5. **Monitoring:** Implement distributed tracing with Zipkin/Jaeger
6. **Caching:** Add Redis for performance optimization
7. **Circuit Breaker:** Implement Resilience4j for fault tolerance

---

### 7.4 Demonstration Checklist

For the 10-minute demonstration:

- [ ] Show architecture diagram
- [ ] Show all 4 microservices running
- [ ] Demonstrate complete order flow showing inter-service communication
- [ ] Show logs proving communication between services
- [ ] Demonstrate CI/CD pipeline running (make a code change, push, watch pipeline)
- [ ] Show deployed services on cloud (AWS/Azure)
- [ ] Explain security measures (JWT, IAM roles, security groups)
- [ ] Show SonarCloud and Snyk reports
- [ ] Discuss one major challenge faced and how it was solved

---

### 7.5 References

1. Spring Boot Documentation - https://spring.io/projects/spring-boot
2. Docker Documentation - https://docs.docker.com/
3. AWS ECS Documentation - https://docs.aws.amazon.com/ecs/
4. Azure Container Apps - https://learn.microsoft.com/azure/container-apps/
5. Microservices Patterns by Chris Richardson
6. GitHub Actions Documentation - https://docs.github.com/actions

---

**Date:** February 2026  
**Module:** SE4010 - Current Trends in Software Engineering  
**Institution:** SLIIT - Faculty of Computing
