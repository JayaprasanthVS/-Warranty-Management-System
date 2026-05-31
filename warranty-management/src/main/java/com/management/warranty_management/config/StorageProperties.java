package com.management.warranty_management.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record StorageProperties(
        String uploadDir,
        MailProperties mail
) {
    public record MailProperties(boolean enabled) {
    }
}
