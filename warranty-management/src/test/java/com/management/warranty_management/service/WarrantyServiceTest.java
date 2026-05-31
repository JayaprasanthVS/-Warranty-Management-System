package com.management.warranty_management.service;

import com.management.warranty_management.dto.warranty.WarrantyRequest;
import com.management.warranty_management.exception.BadRequestException;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ProductRepository;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WarrantyServiceTest {

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private WarrantyService warrantyService;

    private Product product;
    private User user;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(2L);
        product.setWarrantyMonths(12);
        product.setModelNumber("TV-900X");
        product.setName("Premium TV");

        user = new User();
        user.setId(5L);
        user.setName("Jay");
        user.setEmail("jay@example.com");
        user.setRole(User.Role.CUSTOMER);
    }

    @Test
    void registerWarrantyCalculatesExpiryAndNormalizesSerial() {
        WarrantyRequest request = new WarrantyRequest(" ab-12345 ", 5L, 2L, LocalDate.now().minusMonths(1));
        when(warrantyRepository.existsBySerialNumber("AB-12345")).thenReturn(false);
        when(productRepository.findById(2L)).thenReturn(Optional.of(product));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(warrantyRepository.save(any(Warranty.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Warranty saved = warrantyService.registerWarranty(request);

        assertEquals("AB-12345", saved.getSerialNumber());
        assertEquals(request.purchaseDate().plusMonths(12), saved.getExpiryDate());
        assertEquals(Warranty.Status.ACTIVE, saved.getStatus());
    }

    @Test
    void registerWarrantyRejectsDuplicateSerial() {
        WarrantyRequest request = new WarrantyRequest("AB-12345", 5L, 2L, LocalDate.now().minusDays(10));
        when(warrantyRepository.existsBySerialNumber("AB-12345")).thenReturn(true);

        assertThrows(ConflictException.class, () -> warrantyService.registerWarranty(request));
    }

    @Test
    void registerWarrantyRejectsInvalidSerialFormat() {
        WarrantyRequest request = new WarrantyRequest("bad serial", 5L, 2L, LocalDate.now().minusDays(10));

        assertThrows(BadRequestException.class, () -> warrantyService.registerWarranty(request));
    }
}
