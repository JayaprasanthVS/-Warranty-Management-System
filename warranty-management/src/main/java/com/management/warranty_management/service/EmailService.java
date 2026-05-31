package com.management.warranty_management.service;

import com.management.warranty_management.config.StorageProperties;
import com.management.warranty_management.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private StorageProperties storageProperties;

    public Notification.DeliveryStatus sendIfEnabled(String email, String subject, String message) {
        if (!storageProperties.mail().enabled() || mailSender == null) {
            return Notification.DeliveryStatus.SKIPPED;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(email);
            mail.setSubject(subject);
            mail.setText(message);
            mailSender.send(mail);
            return Notification.DeliveryStatus.SENT;
        } catch (Exception exception) {
            return Notification.DeliveryStatus.FAILED;
        }
    }
}
