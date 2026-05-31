package com.management.warranty_management.dto.filter;

import com.management.warranty_management.model.User;

public record ClaimFilterRequest(
        String status,
        String userEmail,
        String serialNumber,
        User.Role requesterRole
) {
}
