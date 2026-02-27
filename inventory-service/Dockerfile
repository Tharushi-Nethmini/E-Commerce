# ---- Dockerfile for Inventory Service ----
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

FROM gcr.io/distroless/java17-debian12
WORKDIR /app

# Distroless runs as non-root by default (uid 65532)

COPY --from=builder /app/target/*.jar app.jar

# Distroless automatically runs as non-root user

EXPOSE 8082

# Note: Distroless doesn't include shell/wget, use external health checks (Docker Compose, K8s)

ENTRYPOINT ["java", "-jar", "app.jar"]
