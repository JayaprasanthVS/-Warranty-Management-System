package com.management.warranty_management.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClaimRequest(
        @NotNull(message = "Warranty id is required.")
        Long warrantyId,

        Long userId,

        @NotBlank(message = "Issue title is required.")
        @Size(max = 120, message = "Issue title must be 120 characters or fewer.")
        String issueTitle,

        @NotBlank(message = "Issue description is required.")
        @Size(max = 1500, message = "Issue description must be 1500 characters or fewer.")
        String issueDescription
) {
}

