package com.management.warranty_management.service;

import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.WarrantyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReminderSchedulerServiceTest {

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReminderSchedulerService reminderSchedulerService;

    @Test
    void processExpiryRemindersCreates30DayNotification() {
        Warranty warranty = new Warranty();
        warranty.setId(1L);
        warranty.setStatus(Warranty.Status.ACTIVE);
        warranty.setExpiryDate(LocalDate.now().plusDays(30));
        Product product = new Product();
        product.setName("Laptop");
        warranty.setProduct(product);
        User user = new User();
        user.setEmail("user@example.com");
        warranty.setUser(user);

        when(warrantyRepository.findAll()).thenReturn(List.of(warranty));
        when(notificationService.alreadySentForWarranty(1L, com.management.warranty_management.model.Notification.Type.WARRANTY_EXPIRING_30)).thenReturn(false);

        reminderSchedulerService.processExpiryReminders();

        verify(notificationService).createNotification(
                eq(user),
                eq(warranty),
                eq(com.management.warranty_management.model.Notification.Type.WARRANTY_EXPIRING_30),
                anyString(),
                anyString()
        );
    }
}
