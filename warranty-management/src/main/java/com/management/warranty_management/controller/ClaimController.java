package com.management.warranty_management.controller;

import com.management.warranty_management.dto.claim.ClaimRequest;
import com.management.warranty_management.dto.claim.ClaimResponse;
import com.management.warranty_management.dto.claim.ClaimStatusUpdateRequest;
import com.management.warranty_management.dto.filter.ClaimFilterRequest;
import com.management.warranty_management.exception.NotFoundException;
import com.management.warranty_management.mapper.ResponseMapper;
import com.management.warranty_management.model.User;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ClaimResponse> createClaim(@Valid @RequestBody ClaimRequest request, Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        
        // Force the current logged-in user ID for claim safety
        ClaimRequest secureRequest = new ClaimRequest(
                request.warrantyId(),
                currentUser.getId(),
                request.issueTitle(),
                request.issueDescription()
        );
        return ResponseEntity.ok(ResponseMapper.toClaimResponse(claimService.createClaim(secureRequest)));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found."));
        return ResponseEntity.ok(claimService.getClaimsByUserId(user.getId()).stream().map(ResponseMapper::toClaimResponse).toList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ClaimResponse>> getClaimsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(claimService.getClaimsByUserId(userId).stream().map(ResponseMapper::toClaimResponse).toList());
    }

    @GetMapping
    public ResponseEntity<List<ClaimResponse>> getAllClaims(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String serialNumber,
            Authentication authentication
    ) {
        User.Role role = extractRole(authentication);
        ClaimFilterRequest filter = new ClaimFilterRequest(status, userEmail, serialNumber, role);
        return ResponseEntity.ok(claimService.searchClaims(filter).stream().map(ResponseMapper::toClaimResponse).toList());
    }

    @PatchMapping("/{claimId}/status")
    public ResponseEntity<ClaimResponse> updateClaimStatus(
            @PathVariable Long claimId, 
            @Valid @RequestBody ClaimStatusUpdateRequest request,
            Authentication authentication
    ) {
        User.Role role = extractRole(authentication);
        ClaimStatusUpdateRequest secureRequest = new ClaimStatusUpdateRequest(
                request.status(),
                request.adminNote(),
                role
        );
        return ResponseEntity.ok(ResponseMapper.toClaimResponse(claimService.updateClaimStatus(claimId, secureRequest)));
    }

    @PostMapping("/{claimId}/attachment")
    public ResponseEntity<ClaimResponse> uploadClaimAttachment(@PathVariable Long claimId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseMapper.toClaimResponse(claimService.attachClaimDocument(claimId, file)));
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

