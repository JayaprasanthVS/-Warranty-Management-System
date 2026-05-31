package com.management.warranty_management.dto.claim;

import com.management.warranty_management.dto.user.UserResponse;
import com.management.warranty_management.dto.warranty.WarrantyResponse;

import java.time.LocalDateTime;

public record ClaimResponse(
        Long id,
        WarrantyResponse warranty,
        UserResponse user,
        String issueTitle,
        String issueDescription,
        String status,
        String adminNote,
        String attachmentFileName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
