package com.management.warranty_management.dto.analytics;

public record AdminOverviewResponse(
        long totalProducts,
        long totalWarranties,
        long activeWarranties,
        long expiredWarranties,
        long claimedWarranties,
        long expiringSoon,
        long totalClaims,
        long requestedClaims,
        long underReviewClaims,
        long approvedClaims,
        long rejectedClaims,
        long closedClaims
) {
}
