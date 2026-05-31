package com.management.warranty_management.service;

import com.management.warranty_management.dto.claim.ClaimRequest;
import com.management.warranty_management.dto.claim.ClaimStatusUpdateRequest;
import com.management.warranty_management.exception.BadRequestException;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ClaimRepository;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ClaimService claimService;

    private Warranty warranty;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);
        user.setRole(User.Role.CUSTOMER);
        user.setEmail("jay@example.com");
        user.setName("Jay");

        Product product = new Product();
        product.setId(3L);
        product.setName("Laptop");
        product.setModelNumber("LP-100");
        product.setWarrantyMonths(12);

        warranty = new Warranty();
        warranty.setId(5L);
        warranty.setUser(user);
        warranty.setProduct(product);
        warranty.setSerialNumber("SN-123456");
        warranty.setPurchaseDate(LocalDate.now().minusMonths(2));
        warranty.setExpiryDate(LocalDate.now().plusMonths(10));
        warranty.setStatus(Warranty.Status.ACTIVE);
    }

    @Test
    void createClaimRejectsExpiredWarranty() {
        warranty.setStatus(Warranty.Status.EXPIRED);
        when(warrantyRepository.findById(5L)).thenReturn(Optional.of(warranty));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> claimService.createClaim(new ClaimRequest(5L, 7L, "Power issue", "Won't turn on")));
    }

    @Test
    void createClaimRejectsDuplicateOpenClaim() {
        when(warrantyRepository.findById(5L)).thenReturn(Optional.of(warranty));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(claimRepository.findFirstByWarrantyIdAndStatusIn(eq(5L), any(List.class))).thenReturn(Optional.of(new Claim()));

        assertThrows(BadRequestException.class, () -> claimService.createClaim(new ClaimRequest(5L, 7L, "Power issue", "Won't turn on")));
    }

    @Test
    void updateClaimStatusRequiresAdminRole() {
        assertThrows(UnauthorizedException.class, () -> claimService.updateClaimStatus(1L, new ClaimStatusUpdateRequest(Claim.Status.UNDER_REVIEW, "Checking", User.Role.CUSTOMER)));
    }

    @Test
    void closingClaimMarksWarrantyClaimed() {
        Claim claim = new Claim();
        claim.setWarranty(warranty);
        claim.setUser(user);
        claim.setStatus(Claim.Status.APPROVED);
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(Claim.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(warrantyRepository.save(any(Warranty.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Claim updated = claimService.updateClaimStatus(1L, new ClaimStatusUpdateRequest(Claim.Status.CLOSED, "Replaced unit", User.Role.ADMIN));

        assertEquals(Claim.Status.CLOSED, updated.getStatus());
        assertEquals(Warranty.Status.CLAIMED, warranty.getStatus());
    }
}
