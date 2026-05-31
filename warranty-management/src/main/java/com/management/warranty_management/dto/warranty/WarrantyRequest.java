package com.management.warranty_management.dto.warranty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record WarrantyRequest(
        @NotBlank(message = "Serial number is required.")
        String serialNumber,

        Long userId,

        @NotNull(message = "Product id is required.")
        Long productId,

        @NotNull(message = "Purchase date is required.")
        @PastOrPresent(message = "Purchase date cannot be in the future.")
        LocalDate purchaseDate
) {
}

