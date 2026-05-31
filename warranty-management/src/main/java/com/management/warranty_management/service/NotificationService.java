package com.management.warranty_management.service;

import com.management.warranty_management.model.Notification;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    public Notification createNotification(User user, Warranty warranty, Notification.Type type, String subject, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setWarranty(warranty);
        notification.setType(type);
        notification.setSubject(subject);
        notification.setMessage(message);
        notification.setDeliveryStatus(emailService.sendIfEnabled(user.getEmail(), subject, message));
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public boolean alreadySentForWarranty(Long warrantyId, Notification.Type type) {
        return notificationRepository.findFirstByWarrantyIdAndTypeOrderByCreatedAtDesc(warrantyId, type).isPresent();
    }
}
