package com.ecommerce.order.service;

import com.ecommerce.order.client.*;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final WebClient.Builder webClientBuilder;
    
    @Value("${services.user-service.url:http://localhost:8081}")
    private String userServiceUrl;
    
    @Value("${services.inventory-service.url:http://localhost:8082}")
    private String inventoryServiceUrl;
    
    @Value("${services.payment-service.url:http://localhost:8083}")
    private String paymentServiceUrl;
    
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        log.info("Creating order for user: {}", request.getUserId());
        
        // Step 1: Validate user exists (call User Service)
        UserResponse user = validateUser(request.getUserId());
        log.info("User validated: {}", user.getUsername());
        
        // Step 2: Create order entity
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setShippingAddress(request.getShippingAddress());
        order.setNotes(request.getNotes());
        order.setStatus(OrderStatus.PENDING);
        
        // Step 3: Process each order item
        for (OrderItemRequest itemRequest : request.getItems()) {
            // Get product details from Inventory Service
            ProductResponse product = getProduct(itemRequest.getProductId());
            
            // Check stock availability
            StockCheckResponse stockCheck = checkStock(itemRequest.getProductId(), itemRequest.getQuantity());
            
            if (!stockCheck.getAvailable()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                        ". " + stockCheck.getMessage());
            }
            
            // Reserve stock
            reserveStock(itemRequest.getProductId(), itemRequest.getQuantity());
            log.info("Stock reserved for product: {} (quantity: {})", product.getName(), itemRequest.getQuantity());
            
            // Create order item
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(product.getPrice());
            
            order.addItem(orderItem);
        }
        
        // Step 4: Save order
        Order savedOrder = orderRepository.save(order);
        log.info("Order created with ID: {}", savedOrder.getId());
        
        // Step 5: Process payment (call Payment Service)
        try {
            PaymentResponse payment = processPayment(savedOrder);
            savedOrder.setPaymentId(payment.getTransactionId());
            savedOrder.setStatus(OrderStatus.PAYMENT_COMPLETED);
            
            // Step 6: Confirm stock deduction
            for (OrderItem item : savedOrder.getItems()) {
                confirmStock(item.getProductId(), item.getQuantity());
            }
            
            savedOrder.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(savedOrder);
            
            log.info("Order {} completed successfully", savedOrder.getId());
        } catch (Exception e) {
            log.error("Payment failed for order {}: {}", savedOrder.getId(), e.getMessage());
            
            // Release reserved stock
            for (OrderItem item : savedOrder.getItems()) {
                releaseStock(item.getProductId(), item.getQuantity());
            }
            
            savedOrder.setStatus(OrderStatus.FAILED);
            orderRepository.save(savedOrder);
            
            throw new RuntimeException("Order failed: " + e.getMessage(), e);
        }
        
        return mapToResponse(savedOrder);
    }
    
    public OrderResponse getOrderById(Long id) {
        log.info("Fetching order by ID: {}", id);
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));
        
        return mapToResponse(order);
    }
    
    public List<OrderResponse> getAllOrders() {
        log.info("Fetching all orders");
        
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        log.info("Fetching orders for user: {}", userId);
        
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        log.info("Updating order {} status to: {}", id, status);
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));
        
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        
        log.info("Order status updated successfully");
        
        return mapToResponse(updatedOrder);
    }
    
    @Transactional
    public void cancelOrder(Long id) {
        log.info("Cancelling order: {}", id);
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));
        
        // Release reserved stock
        for (OrderItem item : order.getItems()) {
            try {
                releaseStock(item.getProductId(), item.getQuantity());
            } catch (Exception e) {
                log.error("Failed to release stock for product {}: {}", item.getProductId(), e.getMessage());
            }
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        log.info("Order cancelled successfully");
    }
    
    // Inter-service communication methods
    
    private UserResponse validateUser(Long userId) {
        log.info("Validating user with User Service: {}", userId);
        
        return webClientBuilder.build()
                .get()
                .uri(userServiceUrl + "/api/users/" + userId)
                .retrieve()
                .bodyToMono(UserResponse.class)
                .block();
    }
    
    private ProductResponse getProduct(Long productId) {
        log.info("Fetching product from Inventory Service: {}", productId);
        
        return webClientBuilder.build()
                .get()
                .uri(inventoryServiceUrl + "/api/inventory/products/" + productId)
                .retrieve()
                .bodyToMono(ProductResponse.class)
                .block();
    }
    
    private StockCheckResponse checkStock(Long productId, Integer quantity) {
        log.info("Checking stock with Inventory Service for product: {}", productId);
        
        StockCheckRequest request = StockCheckRequest.builder()
                .productId(productId)
                .quantity(quantity)
                .build();
        
        return webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/api/inventory/check-stock")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(StockCheckResponse.class)
                .block();
    }
    
    private void reserveStock(Long productId, Integer quantity) {
        log.info("Reserving stock with Inventory Service for product: {}", productId);
        
        StockCheckRequest request = StockCheckRequest.builder()
                .productId(productId)
                .quantity(quantity)
                .build();
        
        webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/api/inventory/reserve-stock")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
    
    private void releaseStock(Long productId, Integer quantity) {
        log.info("Releasing stock with Inventory Service for product: {}", productId);
        
        StockCheckRequest request = StockCheckRequest.builder()
                .productId(productId)
                .quantity(quantity)
                .build();
        
        webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/api/inventory/release-stock")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
    
    private void confirmStock(Long productId, Integer quantity) {
        log.info("Confirming stock with Inventory Service for product: {}", productId);
        
        StockCheckRequest request = StockCheckRequest.builder()
                .productId(productId)
                .quantity(quantity)
                .build();
        
        webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/api/inventory/confirm-stock")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
    
    private PaymentResponse processPayment(Order order) {
        log.info("Processing payment with Payment Service for order: {}", order.getId());
        
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .amount(order.getTotalAmount())
                .paymentMethod("CREDIT_CARD")
                .build();
        
        return webClientBuilder.build()
                .post()
                .uri(paymentServiceUrl + "/api/payments/process")
                .bodyValue(paymentRequest)
                .retrieve()
                .bodyToMono(PaymentResponse.class)
                .block();
    }
    
    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .items(order.getItems().stream()
                        .map(this::mapItemToResponse)
                        .collect(Collectors.toList()))
                .shippingAddress(order.getShippingAddress())
                .paymentId(order.getPaymentId())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
    
    private OrderItemResponse mapItemToResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
