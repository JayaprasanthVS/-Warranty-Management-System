package com.management.warranty_management.service;

import com.management.warranty_management.dto.analytics.AdminOverviewResponse;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ClaimRepository;
import com.management.warranty_management.repository.ProductRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AnalyticsService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private ClaimRepository claimRepository;

    public AdminOverviewResponse getOverview(User.Role requesterRole) {
        ensureRoleCanViewOperations(requesterRole);

        List<Warranty> warranties = warrantyRepository.findAll();
        List<Claim> claims = claimRepository.findAll();
        LocalDate now = LocalDate.now();

        return new AdminOverviewResponse(
                productRepository.count(),
                warranties.size(),
                warranties.stream().filter(warranty -> hasWarrantyStatus(warranty, Warranty.Status.ACTIVE)).count(),
                warranties.stream().filter(warranty -> hasWarrantyStatus(warranty, Warranty.Status.EXPIRED)).count(),
                warranties.stream().filter(warranty -> hasWarrantyStatus(warranty, Warranty.Status.CLAIMED)).count(),
                warranties.stream()
                        .filter(warranty -> hasWarrantyStatus(warranty, Warranty.Status.ACTIVE))
                        .filter(warranty -> isExpiringWithin(warranty, now, 30))
                        .count(),
                claims.size(),
                claims.stream().filter(claim -> hasClaimStatus(claim, Claim.Status.REQUESTED)).count(),
                claims.stream().filter(claim -> hasClaimStatus(claim, Claim.Status.UNDER_REVIEW)).count(),
                claims.stream().filter(claim -> hasClaimStatus(claim, Claim.Status.APPROVED)).count(),
                claims.stream().filter(claim -> hasClaimStatus(claim, Claim.Status.REJECTED)).count(),
                claims.stream().filter(claim -> hasClaimStatus(claim, Claim.Status.CLOSED)).count()
        );
    }

    private boolean hasWarrantyStatus(Warranty warranty, Warranty.Status expectedStatus) {
        return warranty != null && warranty.getStatus() == expectedStatus;
    }

    private boolean hasClaimStatus(Claim claim, Claim.Status expectedStatus) {
        return claim != null && claim.getStatus() == expectedStatus;
    }

    private boolean isExpiringWithin(Warranty warranty, LocalDate fromDate, int daysAhead) {
        if (warranty == null || warranty.getExpiryDate() == null) {
            return false;
        }
        return !warranty.getExpiryDate().isBefore(fromDate)
                && !warranty.getExpiryDate().isAfter(fromDate.plusDays(daysAhead));
    }

    public void ensureRoleCanViewOperations(User.Role role) {
        if (role != User.Role.ADMIN && role != User.Role.SUPPORT) {
            throw new UnauthorizedException("Only admin or support users can access this resource.");
        }
    }
}
