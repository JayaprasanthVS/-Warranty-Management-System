package com.management.warranty_management.dto.product;

import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String modelNumber,
        String description,
        Integer warrantyMonths,
        LocalDateTime createdAt
) {
}
