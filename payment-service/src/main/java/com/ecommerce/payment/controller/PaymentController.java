package com.ecommerce.payment.controller;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Management", description = "APIs for payment processing and management")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/process")
    @Operation(summary = "Process a payment (for inter-service communication)")
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("POST /api/payments/process - Processing payment for order: {}", request.getOrderId());
        PaymentResponse response = paymentService.processPayment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        log.info("GET /api/payments/{} - Fetching payment", id);
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order ID")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
        log.info("GET /api/payments/order/{} - Fetching payment by order", orderId);
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/transaction/{transactionId}")
    @Operation(summary = "Get payment by transaction ID")
    public ResponseEntity<PaymentResponse> getPaymentByTransactionId(@PathVariable String transactionId) {
        log.info("GET /api/payments/transaction/{} - Fetching payment by transaction", transactionId);
        PaymentResponse response = paymentService.getPaymentByTransactionId(transactionId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(summary = "Get all payments or filter by user ID")
    public ResponseEntity<List<PaymentResponse>> getPayments(
            @RequestParam(required = false) Long userId) {
        log.info("GET /api/payments - Fetching payments");
        
        List<PaymentResponse> response;
        if (userId != null) {
            response = paymentService.getPaymentsByUserId(userId);
        } else {
            response = paymentService.getAllPayments();
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/refund")
    @Operation(summary = "Refund a payment")
    public ResponseEntity<PaymentResponse> refundPayment(@PathVariable Long id) {
        log.info("POST /api/payments/{}/refund - Processing refund", id);
        PaymentResponse response = paymentService.refundPayment(id);
        return ResponseEntity.ok(response);
    }
}
