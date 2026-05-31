package com.management.warranty_management.dto.auth;

public record AuthResponse(
        String message,
        String token,
        Long userId,
        String userName,
        String email,
        String role
) {
}
