package com.management.warranty_management.service;

import com.management.warranty_management.dto.product.ProductRequest;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void addProductNormalizesModelNumberAndName() {
        ProductRequest request = new ProductRequest("  Premium TV  ", " tv-900x ", "  OLED panel  ", 24);
        when(productRepository.existsByModelNumber("TV-900X")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product saved = productService.addProduct(request);

        assertEquals("Premium TV", saved.getName());
        assertEquals("TV-900X", saved.getModelNumber());
        assertEquals("OLED panel", saved.getDescription());
    }

    @Test
    void addProductRejectsDuplicateModelNumber() {
        ProductRequest request = new ProductRequest("TV", "tv-900x", "OLED", 24);
        when(productRepository.existsByModelNumber("TV-900X")).thenReturn(true);

        assertThrows(ConflictException.class, () -> productService.addProduct(request));
    }
}
