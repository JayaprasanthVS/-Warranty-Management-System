package com.management.warranty_management.controller;

import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.dto.filter.WarrantyFilterRequest;
import com.management.warranty_management.dto.warranty.WarrantyRequest;
import com.management.warranty_management.dto.warranty.WarrantyResponse;
import com.management.warranty_management.dto.warranty.WarrantySummaryResponse;
import com.management.warranty_management.mapper.ResponseMapper;
import com.management.warranty_management.model.User;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.service.WarrantyService;
import com.management.warranty_management.service.CertificateService;
import com.management.warranty_management.exception.NotFoundException;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/warranties")
@CrossOrigin(origins = "*")
public class WarrantyController {

    @Autowired
    private WarrantyService warrantyService;

    @Autowired
    private CertificateService certificateService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<WarrantyResponse> registerWarranty(@Valid @RequestBody WarrantyRequest warranty, Authentication authentication) {
        // Force the current logged-in user ID for registration safety
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        
        WarrantyRequest secureRequest = new WarrantyRequest(
                warranty.serialNumber(),
                currentUser.getId(),
                warranty.productId(),
                warranty.purchaseDate()
        );
        return ResponseEntity.ok(ResponseMapper.toWarrantyResponse(warrantyService.registerWarranty(secureRequest)));
    }

    @GetMapping("/my")
    public ResponseEntity<List<WarrantyResponse>> getMyWarranties(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        return ResponseEntity.ok(warrantyService.getWarrantiesByUserId(user.getId()).stream().map(ResponseMapper::toWarrantyResponse).toList());
    }

    @GetMapping("/my/summary")
    public ResponseEntity<WarrantySummaryResponse> getMyWarrantySummary(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        return ResponseEntity.ok(warrantyService.getWarrantySummaryByUserId(user.getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WarrantyResponse>> getWarrantiesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(warrantyService.getWarrantiesByUserId(userId).stream().map(ResponseMapper::toWarrantyResponse).toList());
    }

    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<WarrantySummaryResponse> getWarrantySummaryByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(warrantyService.getWarrantySummaryByUserId(userId));
    }

    @GetMapping("/serial/{serialNumber}")
    public ResponseEntity<WarrantyResponse> getWarrantyBySerial(@PathVariable String serialNumber) {
        return ResponseEntity.ok(ResponseMapper.toWarrantyResponse(warrantyService.getWarrantyBySerialNumber(serialNumber)));
    }

    @GetMapping
    public ResponseEntity<List<WarrantyResponse>> searchWarranties(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String modelNumber,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) LocalDate purchaseDateFrom,
            @RequestParam(required = false) LocalDate purchaseDateTo,
            @RequestParam(required = false) LocalDate expiryDateFrom,
            @RequestParam(required = false) LocalDate expiryDateTo,
            Authentication authentication
    ) {
        User.Role role = extractRole(authentication);
        WarrantyFilterRequest filter = new WarrantyFilterRequest(
                status,
                productName,
                modelNumber,
                userEmail,
                purchaseDateFrom,
                purchaseDateTo,
                expiryDateFrom,
                expiryDateTo,
                role
        );
        return ResponseEntity.ok(warrantyService.searchWarranties(filter).stream().map(ResponseMapper::toWarrantyResponse).toList());
    }

    @PostMapping("/{warrantyId}/invoice")
    public ResponseEntity<WarrantyResponse> uploadWarrantyInvoice(@PathVariable Long warrantyId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseMapper.toWarrantyResponse(warrantyService.attachInvoice(warrantyId, file)));
    }

    @GetMapping("/{warrantyId}/certificate")
    public ResponseEntity<ByteArrayResource> downloadWarrantyCertificate(@PathVariable Long warrantyId) {
        var warranty = warrantyService.getWarrantyById(warrantyId);
        byte[] pdf = certificateService.generateWarrantyCertificate(warranty);
        ByteArrayResource resource = new ByteArrayResource(pdf);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=warranty-certificate-" + warranty.getSerialNumber() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(resource);
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

