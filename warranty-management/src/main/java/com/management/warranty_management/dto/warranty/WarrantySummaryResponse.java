package com.management.warranty_management.dto.warranty;

public record WarrantySummaryResponse(
        long total,
        long active,
        long expired,
        long claimed,
        long expiringSoon
) {
}
