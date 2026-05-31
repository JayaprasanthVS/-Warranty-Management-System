package com.management.warranty_management.mapper;

import com.management.warranty_management.dto.claim.ClaimResponse;
import com.management.warranty_management.dto.notification.NotificationResponse;
import com.management.warranty_management.dto.product.ProductResponse;
import com.management.warranty_management.dto.user.UserResponse;
import com.management.warranty_management.dto.warranty.WarrantyResponse;
import com.management.warranty_management.model.Notification;
import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;

public final class ResponseMapper {
    private ResponseMapper() {
    }

    public static ProductResponse toProductResponse(Product product) {
        if (product == null) {
            return null;
        }
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getModelNumber(),
                product.getDescription(),
                product.getWarrantyMonths(),
                product.getCreatedAt()
        );
    }

    public static UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getCreatedAt()
        );
    }

    public static WarrantyResponse toWarrantyResponse(Warranty warranty) {
        if (warranty == null) {
            return null;
        }
        return new WarrantyResponse(
                warranty.getId(),
                warranty.getSerialNumber(),
                toUserResponse(warranty.getUser()),
                toProductResponse(warranty.getProduct()),
                warranty.getPurchaseDate(),
                warranty.getExpiryDate(),
                warranty.getStatus() != null ? warranty.getStatus().name() : null,
                warranty.getInvoiceFileName()
        );
    }

    public static ClaimResponse toClaimResponse(Claim claim) {
        if (claim == null) {
            return null;
        }
        return new ClaimResponse(
                claim.getId(),
                toWarrantyResponse(claim.getWarranty()),
                toUserResponse(claim.getUser()),
                claim.getIssueTitle(),
                claim.getIssueDescription(),
                claim.getStatus() != null ? claim.getStatus().name() : null,
                claim.getAdminNote(),
                claim.getAttachmentFileName(),
                claim.getCreatedAt(),
                claim.getUpdatedAt()
        );
    }

    public static NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) {
            return null;
        }
        return new NotificationResponse(
                notification.getId(),
                notification.getWarranty() != null ? notification.getWarranty().getId() : null,
                notification.getType() != null ? notification.getType().name() : null,
                notification.getDeliveryStatus() != null ? notification.getDeliveryStatus().name() : null,
                notification.getSubject(),
                notification.getMessage(),
                notification.getCreatedAt()
        );
    }
}
