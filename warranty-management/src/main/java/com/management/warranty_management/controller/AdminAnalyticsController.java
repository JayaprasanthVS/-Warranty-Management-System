package com.management.warranty_management.controller;

import com.management.warranty_management.dto.analytics.AdminOverviewResponse;
import com.management.warranty_management.model.User;
import com.management.warranty_management.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AdminAnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview(Authentication authentication) {
        User.Role role = extractRole(authentication);
        return ResponseEntity.ok(analyticsService.getOverview(role));
    }

    private User.Role extractRole(Authentication authentication) {
        String roleStr = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("CUSTOMER");
        return User.Role.valueOf(roleStr);
    }
}
