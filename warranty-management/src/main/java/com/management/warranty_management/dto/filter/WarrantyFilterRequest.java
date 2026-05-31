package com.management.warranty_management.dto.filter;

import com.management.warranty_management.model.User;
import java.time.LocalDate;

public record WarrantyFilterRequest(
        String status,
        String productName,
        String modelNumber,
        String userEmail,
        LocalDate purchaseDateFrom,
        LocalDate purchaseDateTo,
        LocalDate expiryDateFrom,
        LocalDate expiryDateTo,
        User.Role requesterRole
) {
}
