package com.management.warranty_management.dto.claim;

import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.User;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClaimStatusUpdateRequest(
        @NotNull(message = "Status is required.")
        Claim.Status status,

        @Size(max = 1000, message = "Admin note must be 1000 characters or fewer.")
        String adminNote,

        User.Role requesterRole
) {
}

