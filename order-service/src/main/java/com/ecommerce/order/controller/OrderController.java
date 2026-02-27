package com.ecommerce.order.controller;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Order Management", description = "APIs for order creation and management (orchestrator service)")
public class OrderController {
    
    private final OrderService orderService;
    
    @PostMapping
    @Operation(summary = "Create a new order (orchestrates with User, Inventory, and Payment services)")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        log.info("POST /api/orders - Creating order for user: {}", request.getUserId());
        OrderResponse response = orderService.createOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        log.info("GET /api/orders/{} - Fetching order", id);
        OrderResponse response = orderService.getOrderById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(summary = "Get all orders or filter by user ID")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/orders - Fetching orders");
        
        List<OrderResponse> response;
        if (userId != null) {
            response = orderService.getOrdersByUserId(userId);
        } else {
            response = orderService.getAllOrders();
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update order status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        log.info("PATCH /api/orders/{}/status - Updating status", id);
        
        OrderStatus status = OrderStatus.valueOf(request.get("status"));
        OrderResponse response = orderService.updateOrderStatus(id, status);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<Map<String, String>> cancelOrder(@PathVariable Long id) {
        log.info("POST /api/orders/{}/cancel - Cancelling order", id);
        orderService.cancelOrder(id);
        return ResponseEntity.ok(Map.of("message", "Order cancelled successfully"));
    }
}
