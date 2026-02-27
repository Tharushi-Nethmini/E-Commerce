package com.ecommerce.order.client;

import lombok.Data;

@Data
public class StockCheckResponse {
    private Long productId;
    private Boolean available;
    private Integer requestedQuantity;
    private Integer availableQuantity;
    private String message;
}
