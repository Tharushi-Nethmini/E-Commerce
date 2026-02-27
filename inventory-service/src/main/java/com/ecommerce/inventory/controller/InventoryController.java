package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.*;
import com.ecommerce.inventory.service.InventoryService;
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
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Inventory Management", description = "APIs for product catalog and inventory management")
public class InventoryController {
    
    private final InventoryService inventoryService;
    
    @PostMapping("/products")
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        log.info("POST /api/inventory/products - Creating product: {}", request.getName());
        ProductResponse response = inventoryService.createProduct(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/products/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        log.info("GET /api/inventory/products/{} - Fetching product", id);
        ProductResponse response = inventoryService.getProductById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/products")
    @Operation(summary = "Get all products")
    public ResponseEntity<List<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String category) {
        log.info("GET /api/inventory/products - Fetching products");
        
        List<ProductResponse> response;
        if (category != null && !category.isEmpty()) {
            response = inventoryService.getProductsByCategory(category);
        } else {
            response = inventoryService.getAllProducts();
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/products/{id}")
    @Operation(summary = "Update product")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        log.info("PUT /api/inventory/products/{} - Updating product", id);
        ProductResponse response = inventoryService.updateProduct(id, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/products/{id}")
    @Operation(summary = "Delete product")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Long id) {
        log.info("DELETE /api/inventory/products/{} - Deleting product", id);
        inventoryService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }
    
    // Inter-service communication endpoints
    @PostMapping("/check-stock")
    @Operation(summary = "Check stock availability (for inter-service communication)")
    public ResponseEntity<StockCheckResponse> checkStock(@Valid @RequestBody StockCheckRequest request) {
        log.info("POST /api/inventory/check-stock - Checking stock for product: {}", request.getProductId());
        StockCheckResponse response = inventoryService.checkStock(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reserve-stock")
    @Operation(summary = "Reserve stock (for inter-service communication)")
    public ResponseEntity<Map<String, String>> reserveStock(@RequestBody StockCheckRequest request) {
        log.info("POST /api/inventory/reserve-stock - Reserving stock for product: {}", request.getProductId());
        inventoryService.reserveStock(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(Map.of("message", "Stock reserved successfully"));
    }
    
    @PostMapping("/release-stock")
    @Operation(summary = "Release reserved stock (for inter-service communication)")
    public ResponseEntity<Map<String, String>> releaseStock(@RequestBody StockCheckRequest request) {
        log.info("POST /api/inventory/release-stock - Releasing stock for product: {}", request.getProductId());
        inventoryService.releaseStock(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(Map.of("message", "Stock released successfully"));
    }
    
    @PostMapping("/confirm-stock")
    @Operation(summary = "Confirm stock purchase (for inter-service communication)")
    public ResponseEntity<Map<String, String>> confirmStock(@RequestBody StockCheckRequest request) {
        log.info("POST /api/inventory/confirm-stock - Confirming stock for product: {}", request.getProductId());
        inventoryService.confirmStock(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(Map.of("message", "Stock confirmed successfully"));
    }
}
