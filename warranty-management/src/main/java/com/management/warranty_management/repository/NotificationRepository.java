package com.management.warranty_management.repository;

import com.management.warranty_management.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findFirstByWarrantyIdAndTypeOrderByCreatedAtDesc(Long warrantyId, Notification.Type type);
}
