package com.management.warranty_management.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "Product name is required.")
        String name,

        @NotBlank(message = "Model number is required.")
        @Size(min = 3, max = 40, message = "Model number must be between 3 and 40 characters.")
        String modelNumber,

        @Size(max = 1000, message = "Description cannot exceed 1000 characters.")
        String description,

        @NotNull(message = "Warranty months is required.")
        @Min(value = 1, message = "Warranty months must be at least 1.")
        Integer warrantyMonths
) {
}
