package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.*;
import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {
    
    private final ProductRepository productRepository;
    
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product: {}", request.getName());
        
        if (productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU already exists: " + request.getSku());
        }
        
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        
        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully: {}", savedProduct.getId());
        
        return mapToResponse(savedProduct);
    }
    
    public ProductResponse getProductById(Long id) {
        log.info("Fetching product by ID: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        
        return mapToResponse(product);
    }
    
    public List<ProductResponse> getAllProducts() {
        log.info("Fetching all products");
        
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<ProductResponse> getProductsByCategory(String category) {
        log.info("Fetching products by category: {}", category);
        
        return productRepository.findByCategory(category).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        
        Product updatedProduct = productRepository.save(product);
        log.info("Product updated successfully: {}", updatedProduct.getId());
        
        return mapToResponse(updatedProduct);
    }
    
    @Transactional
    public void deleteProduct(Long id) {
        log.info("Deleting product: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        
        productRepository.delete(product);
        log.info("Product deleted successfully: {}", id);
    }
    
    // Inter-service communication endpoint
    @Transactional
    public StockCheckResponse checkStock(StockCheckRequest request) {
        log.info("Checking stock for product ID: {} with quantity: {}", 
                request.getProductId(), request.getQuantity());
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + request.getProductId()));
        
        Integer availableQuantity = product.getAvailableQuantity();
        Boolean isAvailable = availableQuantity >= request.getQuantity();
        
        String message;
        if (isAvailable) {
            message = String.format("Stock available. Requested: %d, Available: %d", 
                    request.getQuantity(), availableQuantity);
        } else {
            message = String.format("Insufficient stock. Requested: %d, Available: %d", 
                    request.getQuantity(), availableQuantity);
        }
        
        log.info("Stock check result for product {}: {}", request.getProductId(), message);
        
        return StockCheckResponse.builder()
                .productId(product.getId())
                .available(isAvailable)
                .requestedQuantity(request.getQuantity())
                .availableQuantity(availableQuantity)
                .message(message)
                .build();
    }
    
    @Transactional
    public void reserveStock(Long productId, Integer quantity) {
        log.info("Reserving stock for product ID: {} with quantity: {}", productId, quantity);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
        
        if (product.getAvailableQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock to reserve");
        }
        
        product.setReservedQuantity(product.getReservedQuantity() + quantity);
        productRepository.save(product);
        
        log.info("Stock reserved successfully for product: {}", productId);
    }
    
    @Transactional
    public void releaseStock(Long productId, Integer quantity) {
        log.info("Releasing stock for product ID: {} with quantity: {}", productId, quantity);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
        
        product.setReservedQuantity(Math.max(0, product.getReservedQuantity() - quantity));
        productRepository.save(product);
        
        log.info("Stock released successfully for product: {}", productId);
    }
    
    @Transactional
    public void confirmStock(Long productId, Integer quantity) {
        log.info("Confirming stock for product ID: {} with quantity: {}", productId, quantity);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
        
        product.setStockQuantity(product.getStockQuantity() - quantity);
        product.setReservedQuantity(Math.max(0, product.getReservedQuantity() - quantity));
        productRepository.save(product);
        
        log.info("Stock confirmed successfully for product: {}", productId);
    }
    
    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .reservedQuantity(product.getReservedQuantity())
                .availableQuantity(product.getAvailableQuantity())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
