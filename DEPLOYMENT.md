# Cloud Deployment Guide

Detailed guide for deploying the E-Commerce microservices to cloud platforms.

## Table of Contents
- [AWS Deployment (Recommended)](#aws-deployment)
- [Azure Deployment](#azure-deployment)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Post-Deployment Testing](#post-deployment-testing)

---

## AWS Deployment

### Architecture on AWS

```
Internet → Route 53 (DNS) → Application Load Balancer
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ECS Service 1      ECS Service 2    ECS Service 3
            (User Service)   (Inventory Svc)   (Order & Payment)
                    ↓                 ▼                 ▼
                ECR Images        ECR Images        ECR Images
```

### Prerequisites

1. AWS Account with free tier access
2. AWS CLI installed and configured
3. Docker installed locally
4. IAM user with permissions for ECS, ECR, VPC, and ALB

### Step 1: Setup AWS CLI

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region: us-east-1 (or your preferred region)
# Enter output format: json
```

### Step 2: Create ECR Repositories

```bash
# Create repositories for each service
aws ecr create-repository --repository-name user-service --region us-east-1
aws ecr create-repository --repository-name inventory-service --region us-east-1
aws ecr create-repository --repository-name order-service --region us-east-1
aws ecr create-repository --repository-name payment-service --region us-east-1

# Note the repository URIs from the output
```

### Step 3: Build and Push Docker Images

```bash
# Set your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push User Service
cd user-service
docker build -t user-service:latest .
docker tag user-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/user-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/user-service:latest
cd ..

# Repeat for other services
cd inventory-service
docker build -t inventory-service:latest .
docker tag inventory-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/inventory-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/inventory-service:latest
cd ..

cd order-service
docker build -t order-service:latest .
docker tag order-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/order-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/order-service:latest
cd ..

cd payment-service
docker build -t payment-service:latest .
docker tag payment-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/payment-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/payment-service:latest
cd ..
```

### Step 4: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name ecommerce-cluster \
  --capacity-providers FARGATE \
  --region us-east-1
```

### Step 5: Create Task Definitions

Create a file `user-service-task.json`:

```json
{
  "family": "user-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/user-service:latest",
      "portMappings": [
        {
          "containerPort": 8081,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "SERVER_PORT",
          "value": "8081"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/user-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole"
}
```

Register the task definition:

```bash
# Create log group first
aws logs create-log-group --log-group-name /ecs/user-service

# Register task definition
aws ecs register-task-definition --cli-input-json file://user-service-task.json
```

Repeat for other services (inventory, order, payment).

### Step 6: Create Application Load Balancer

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name ecommerce-alb-sg \
  --description "Security group for e-commerce ALB" \
  --vpc-id <YOUR_VPC_ID>

# Allow HTTP traffic
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name ecommerce-alb \
  --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
  --security-groups <SECURITY_GROUP_ID> \
  --scheme internet-facing \
  --type application
```

### Step 7: Create Target Groups

```bash
# User Service target group
aws elbv2 create-target-group \
  --name user-service-tg \
  --protocol HTTP \
  --port 8081 \
  --vpc-id <YOUR_VPC_ID> \
  --target-type ip \
  --health-check-path /actuator/health

# Repeat for other services with different ports
```

### Step 8: Create ECS Services

```bash
# User Service
aws ecs create-service \
  --cluster ecommerce-cluster \
  --service-name user-service \
  --task-definition user-service \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_ID>],securityGroups=[<SECURITY_GROUP_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<TARGET_GROUP_ARN>,containerName=user-service,containerPort=8081"
```

### Step 9: Configure ALB Listener Rules

```bash
# Create listener
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<DEFAULT_TARGET_GROUP_ARN>

# Add rules for path-based routing
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 1 \
  --conditions Field=path-pattern,Values='/api/users/*' \
  --actions Type=forward,TargetGroupArn=<USER_SERVICE_TARGET_GROUP_ARN>
```

---

## Azure Deployment

### Prerequisites

1. Azure Account with free tier
2. Azure CLI installed
3. Docker installed

### Step 1: Setup Azure CLI

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
```

### Step 2: Create Resource Group

```bash
az group create --name ecommerce-rg --location eastus
```

### Step 3: Create Container Registry

```bash
# Create ACR
az acr create \
  --resource-group ecommerce-rg \
  --name ecommerceacr \
  --sku Basic

# Login to ACR
az acr login --name ecommerceacr
```

### Step 4: Build and Push Images

```bash
# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name ecommerceacr --query loginServer --output tsv)

# Build and push User Service
cd user-service
docker build -t user-service:latest .
docker tag user-service:latest $ACR_LOGIN_SERVER/user-service:latest
docker push $ACR_LOGIN_SERVER/user-service:latest
cd ..

# Repeat for other services
```

### Step 5: Create Container Apps Environment

```bash
az containerapp env create \
  --name ecommerce-env \
  --resource-group ecommerce-rg \
  --location eastus
```

### Step 6: Deploy Container Apps

```bash
# User Service
az containerapp create \
  --name user-service \
  --resource-group ecommerce-rg \
  --environment ecommerce-env \
  --image $ACR_LOGIN_SERVER/user-service:latest \
  --target-port 8081 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username <ACR_USERNAME> \
  --registry-password <ACR_PASSWORD> \
  --cpu 0.5 \
  --memory 1.0Gi

# Inventory Service
az containerapp create \
  --name inventory-service \
  --resource-group ecommerce-rg \
  --environment ecommerce-env \
  --image $ACR_LOGIN_SERVER/inventory-service:latest \
  --target-port 8082 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --cpu 0.5 \
  --memory 1.0Gi

# Order Service (with environment variables for service URLs)
az containerapp create \
  --name order-service \
  --resource-group ecommerce-rg \
  --environment ecommerce-env \
  --image $ACR_LOGIN_SERVER/order-service:latest \
  --target-port 8080 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --env-vars services.user-service.url=https://user-service.azurecontainerapps.io \
             services.inventory-service.url=https://inventory-service.azurecontainerapps.io \
             services.payment-service.url=https://payment-service.azurecontainerapps.io \
  --cpu 0.5 \
  --memory 1.0Gi

# Payment Service
az containerapp create \
  --name payment-service \
  --resource-group ecommerce-rg \
  --environment ecommerce-env \
  --image $ACR_LOGIN_SERVER/payment-service:latest \
  --target-port 8083 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --cpu 0.5 \
  --memory 1.0Gi
```

---

## Pre-Deployment Checklist

- [ ] All services build successfully locally
- [ ] Docker Compose runs without errors
- [ ] Integration tests pass
- [ ] GitHub Actions CI/CD pipelines configured
- [ ] Secrets configured in GitHub (DOCKER_USERNAME, DOCKER_PASSWORD, SONAR_TOKEN, SNYK_TOKEN)
- [ ] Cloud account created with billing alerts set
- [ ] IAM roles/service principals created with minimum permissions
- [ ] Network security groups configured

---

## Post-Deployment Testing

### Test User Service

```bash
# Get the public URL from AWS/Azure
USER_SERVICE_URL=<your-load-balancer-or-container-app-url>

# Register a user
curl -X POST $USER_SERVICE_URL/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Test Inventory Service

```bash
INVENTORY_SERVICE_URL=<your-url>

# Create a product
curl -X POST $INVENTORY_SERVICE_URL/api/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST001",
    "price": 99.99,
    "stockQuantity": 100
  }'
```

### Test Full Integration

```bash
ORDER_SERVICE_URL=<your-url>

# Create an order (tests all services)
curl -X POST $ORDER_SERVICE_URL/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [{"productId": 1, "quantity": 2}],
    "shippingAddress": "123 Test St"
  }'
```

---

## Monitoring

### AWS CloudWatch

- View logs: `aws logs tail /ecs/user-service --follow`
- View metrics in AWS Console → CloudWatch → Metrics → ECS

### Azure Monitor

- View logs: Azure Portal → Container Apps → your-app → Log stream
- View metrics: Azure Portal → Container Apps → your-app → Metrics

---

## Cost Optimization

### Free Tier Limits

**AWS:**
- 750 hours/month of Fargate (first 2 months)
- 5GB ECR storage

**Azure:**
- 180,000 vCPU-seconds/month for Container Apps
- First 2M requests free

### Recommendations

1. Use smallest instance sizes (0.25 vCPU, 0.5GB RAM)
2. Set up billing alerts at $5, $10, $20
3. Delete resources after demonstration
4. Use auto-scaling with min=0 for non-critical services

---

## Troubleshooting

### Container Won't Start

1. Check logs: `aws logs tail /ecs/service-name --follow`
2. Verify environment variables
3. Check health check endpoint returns 200

### Service Communication Fails

1. Verify security groups allow traffic between services
2. Check service discovery/DNS configuration
3. Verify correct service URLs in environment variables

### High Costs

1. Check running instances: `aws ecs list-tasks --cluster ecommerce-cluster`
2. Stop unnecessary services
3. Review CloudWatch billing metrics

---

## Clean Up Resources

### AWS

```bash
# Delete services
aws ecs delete-service --cluster ecommerce-cluster --service user-service --force
# Repeat for other services

# Delete cluster
aws ecs delete-cluster --cluster ecommerce-cluster

# Delete ALB, target groups, etc.
```

### Azure

```bash
# Delete resource group (deletes all resources)
az group delete --name ecommerce-rg --yes --no-wait
```

---

## Security Best Practices

1. **Never commit secrets** - Use AWS Secrets Manager / Azure Key Vault
2. **Enable HTTPS** - Use ACM (AWS) or App Service Certificates (Azure)
3. **Restrict security groups** - Only allow necessary ports
4. **Use IAM roles** - No hardcoded credentials
5. **Enable logging** - CloudWatch / Azure Monitor
6. **Regular updates** - Keep images updated

---

## Additional Resources

- [AWS ECS Workshop](https://ecsworkshop.com/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
