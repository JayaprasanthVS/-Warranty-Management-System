package com.management.warranty_management.service;

import com.management.warranty_management.config.StorageProperties;
import com.management.warranty_management.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class DocumentStorageService {

    @Autowired
    private StorageProperties storageProperties;

    public StoredFile store(String folder, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size must be 5 MB or less.");
        }

        String originalFileName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "_" + originalFileName;

        try {
            Path root = Path.of(storageProperties.uploadDir()).toAbsolutePath().normalize();
            Path directory = root.resolve(folder);
            Files.createDirectories(directory);
            Path destination = directory.resolve(storedName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return new StoredFile(originalFileName, destination.toString());
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store the uploaded file.");
        }
    }

    public record StoredFile(String originalFileName, String storedPath) {
    }
}
