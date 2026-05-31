package com.management.warranty_management.service;

import com.management.warranty_management.model.Notification;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.WarrantyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class ReminderSchedulerService {

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void processExpiryReminders() {
        LocalDate now = LocalDate.now();
        for (Warranty warranty : warrantyRepository.findAll()) {
            if (warranty.getStatus() != Warranty.Status.ACTIVE) {
                continue;
            }

            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(now, warranty.getExpiryDate());
            if (daysLeft == 30 && !notificationService.alreadySentForWarranty(warranty.getId(), Notification.Type.WARRANTY_EXPIRING_30)) {
                notificationService.createNotification(
                        warranty.getUser(),
                        warranty,
                        Notification.Type.WARRANTY_EXPIRING_30,
                        "Warranty expiring in 30 days",
                        "Your warranty for " + warranty.getProduct().getName() + " expires on " + warranty.getExpiryDate() + "."
                );
            }

            if (daysLeft == 7 && !notificationService.alreadySentForWarranty(warranty.getId(), Notification.Type.WARRANTY_EXPIRING_7)) {
                notificationService.createNotification(
                        warranty.getUser(),
                        warranty,
                        Notification.Type.WARRANTY_EXPIRING_7,
                        "Warranty expiring in 7 days",
                        "Your warranty for " + warranty.getProduct().getName() + " expires in 7 days on " + warranty.getExpiryDate() + "."
                );
            }
        }
    }
}
