package com.management.warranty_management.controller;

import com.management.warranty_management.dto.notification.NotificationResponse;
import com.management.warranty_management.exception.NotFoundException;
import com.management.warranty_management.mapper.ResponseMapper;
import com.management.warranty_management.model.User;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(user.getId()).stream().map(ResponseMapper::toNotificationResponse).toList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId).stream().map(ResponseMapper::toNotificationResponse).toList());
    }
}

