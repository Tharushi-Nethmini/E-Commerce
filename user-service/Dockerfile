# ---- Dockerfile for User Service ----
# Multi-stage build for optimized image size

# Stage 1: Build the application using Maven
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the final runtime image
FROM gcr.io/distroless/java17-debian12
WORKDIR /app

# Distroless runs as non-root by default (uid 65532)

# Copy the JAR file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Distroless automatically runs as non-root user (no shell/RUN/USER commands needed)

# Expose the port the application runs on
EXPOSE 8081

# Note: Distroless doesn't include shell/wget, use external health checks (Docker Compose, K8s)

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
