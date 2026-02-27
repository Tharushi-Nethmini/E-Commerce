package com.ecommerce.order.client;

import lombok.Data;

@Data
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String amount;
    private String status;
    private String paymentMethod;
    private String transactionId;
}
