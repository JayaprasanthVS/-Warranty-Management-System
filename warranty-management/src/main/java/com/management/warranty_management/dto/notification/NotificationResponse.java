package com.management.warranty_management.dto.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long warrantyId,
        String type,
        String deliveryStatus,
        String subject,
        String message,
        LocalDateTime createdAt
) {
}
