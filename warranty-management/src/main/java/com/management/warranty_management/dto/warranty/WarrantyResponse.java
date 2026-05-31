package com.management.warranty_management.dto.warranty;

import com.management.warranty_management.dto.product.ProductResponse;
import com.management.warranty_management.dto.user.UserResponse;

import java.time.LocalDate;

public record WarrantyResponse(
        Long id,
        String serialNumber,
        UserResponse user,
        ProductResponse product,
        LocalDate purchaseDate,
        LocalDate expiryDate,
        String status,
        String invoiceFileName
) {
}
