package com.management.warranty_management.service;

import com.management.warranty_management.dto.analytics.AdminOverviewResponse;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ClaimRepository;
import com.management.warranty_management.repository.ProductRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private ClaimRepository claimRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getOverviewAggregatesOperationalCounts() {
        Warranty active = new Warranty();
        active.setStatus(Warranty.Status.ACTIVE);
        active.setExpiryDate(LocalDate.now().plusDays(10));

        Warranty expired = new Warranty();
        expired.setStatus(Warranty.Status.EXPIRED);
        expired.setExpiryDate(LocalDate.now().minusDays(1));

        Claim requested = new Claim();
        requested.setStatus(Claim.Status.REQUESTED);
        Claim closed = new Claim();
        closed.setStatus(Claim.Status.CLOSED);

        when(productRepository.count()).thenReturn(4L);
        when(warrantyRepository.findAll()).thenReturn(List.of(active, expired));
        when(claimRepository.findAll()).thenReturn(List.of(requested, closed));

        AdminOverviewResponse response = analyticsService.getOverview(User.Role.ADMIN);

        assertEquals(4L, response.totalProducts());
        assertEquals(2L, response.totalWarranties());
        assertEquals(1L, response.activeWarranties());
        assertEquals(1L, response.expiredWarranties());
        assertEquals(1L, response.expiringSoon());
        assertEquals(2L, response.totalClaims());
        assertEquals(1L, response.requestedClaims());
        assertEquals(1L, response.closedClaims());
    }

    @Test
    void getOverviewRejectsCustomerRole() {
        assertThrows(UnauthorizedException.class, () -> analyticsService.getOverview(User.Role.CUSTOMER));
    }
}

