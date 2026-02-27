package com.ecommerce.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponse {
    private Long productId;
    private Boolean available;
    private Integer requestedQuantity;
    private Integer availableQuantity;
    private String message;
}
