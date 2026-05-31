package com.management.warranty_management.controller;
import com.management.warranty_management.dto.product.ProductRequest;
import com.management.warranty_management.dto.product.ProductResponse;
import com.management.warranty_management.dto.filter.ProductFilterRequest;
import com.management.warranty_management.mapper.ResponseMapper;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest product) {
        return ResponseEntity.ok(ResponseMapper.toProductResponse(productService.addProduct(product)));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts(@RequestParam(required = false) String query) {
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(productService.searchProducts(new ProductFilterRequest(query)).stream().map(ResponseMapper::toProductResponse).toList());
        }
        return ResponseEntity.ok(productService.getAllProducts().stream().map(ResponseMapper::toProductResponse).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseMapper.toProductResponse(productService.getProductById(id)));
    }
}
