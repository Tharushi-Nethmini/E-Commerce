package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.Payment;
import com.ecommerce.payment.model.PaymentMethod;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final Random random = new Random();
    
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for order: {} with amount: {}", 
                request.getOrderId(), request.getAmount());
        
        // Check if payment already exists for this order
        if (paymentRepository.findByOrderId(request.getOrderId()).isPresent()) {
            throw new RuntimeException("Payment already exists for order: " + request.getOrderId());
        }
        
        // Create payment entity
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setUserId(request.getUserId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        payment.setStatus(PaymentStatus.PROCESSING);
        
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment created with ID: {}", savedPayment.getId());
        
        // Simulate payment processing with payment gateway
        boolean paymentSuccess = simulatePaymentGateway();
        
        if (paymentSuccess) {
            savedPayment.setStatus(PaymentStatus.COMPLETED);
            savedPayment.setProcessedAt(LocalDateTime.now());
            savedPayment.setPaymentGatewayResponse("Payment processed successfully");
            paymentRepository.save(savedPayment);
            
            log.info("Payment completed successfully: {}", savedPayment.getTransactionId());
            
            return mapToResponse(savedPayment, "Payment completed successfully");
        } else {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setProcessedAt(LocalDateTime.now());
            savedPayment.setPaymentGatewayResponse("Payment failed - Insufficient funds or gateway error");
            paymentRepository.save(savedPayment);
            
            log.error("Payment failed for order: {}", request.getOrderId());
            
            throw new RuntimeException("Payment processing failed");
        }
    }
    
    public PaymentResponse getPaymentById(Long id) {
        log.info("Fetching payment by ID: {}", id);
        
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + id));
        
        return mapToResponse(payment, null);
    }
    
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        log.info("Fetching payment by order ID: {}", orderId);
        
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));
        
        return mapToResponse(payment, null);
    }
    
    public PaymentResponse getPaymentByTransactionId(String transactionId) {
        log.info("Fetching payment by transaction ID: {}", transactionId);
        
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found with transaction ID: " + transactionId));
        
        return mapToResponse(payment, null);
    }
    
    public List<PaymentResponse> getAllPayments() {
        log.info("Fetching all payments");
        
        return paymentRepository.findAll().stream()
                .map(payment -> mapToResponse(payment, null))
                .collect(Collectors.toList());
    }
    
    public List<PaymentResponse> getPaymentsByUserId(Long userId) {
        log.info("Fetching payments for user: {}", userId);
        
        return paymentRepository.findByUserId(userId).stream()
                .map(payment -> mapToResponse(payment, null))
                .collect(Collectors.toList());
    }
    
    @Transactional
    public PaymentResponse refundPayment(Long id) {
        log.info("Processing refund for payment: {}", id);
        
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + id));
        
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }
        
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setProcessedAt(LocalDateTime.now());
        payment.setPaymentGatewayResponse("Payment refunded successfully");
        
        Payment refundedPayment = paymentRepository.save(payment);
        log.info("Payment refunded successfully: {}", refundedPayment.getTransactionId());
        
        return mapToResponse(refundedPayment, "Payment refunded successfully");
    }
    
    // Simulate payment gateway processing (90% success rate)
    private boolean simulatePaymentGateway() {
        try {
            // Simulate processing delay
            Thread.sleep(1000);
            
            // 90% success rate
            return random.nextInt(10) < 9;
        } catch (InterruptedException e) {
            log.error("Payment processing interrupted", e);
            return false;
        }
    }
    
    private PaymentResponse mapToResponse(Payment payment, String message) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionId(payment.getTransactionId())
                .message(message != null ? message : payment.getPaymentGatewayResponse())
                .createdAt(payment.getCreatedAt())
                .processedAt(payment.getProcessedAt())
                .build();
    }
}
