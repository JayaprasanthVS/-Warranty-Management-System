package com.management.warranty_management.service;

import com.management.warranty_management.dto.filter.ClaimFilterRequest;
import com.management.warranty_management.dto.claim.ClaimRequest;
import com.management.warranty_management.dto.claim.ClaimStatusUpdateRequest;
import com.management.warranty_management.exception.BadRequestException;
import com.management.warranty_management.exception.NotFoundException;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.Claim;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ClaimRepository;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DocumentStorageService documentStorageService;

    public Claim createClaim(ClaimRequest request) {
        Warranty warranty = warrantyRepository.findById(request.warrantyId())
                .orElseThrow(() -> new NotFoundException("Warranty not found."));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (!warranty.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only create claims for your own warranties.");
        }

        // Logic check: Is the warranty currently valid?
        if (warranty.getExpiryDate().isBefore(LocalDate.now())) {
            warranty.setStatus(Warranty.Status.EXPIRED);
            warrantyRepository.save(warranty);
            throw new BadRequestException("Expired warranties cannot be claimed.");
        }
        
        if (warranty.getStatus() == Warranty.Status.EXPIRED) {
            throw new BadRequestException("Expired warranties cannot be claimed.");
        }

        // Block if there is already a PENDING or OPEN claim for this specific warranty
        claimRepository.findFirstByWarrantyIdAndStatusIn(
                warranty.getId(),
                List.of(Claim.Status.REQUESTED, Claim.Status.UNDER_REVIEW, Claim.Status.APPROVED)
        ).ifPresent(existing -> {
            throw new BadRequestException("An active claim already exists for this warranty. Please wait for it to be resolved.");
        });

        Claim claim = new Claim();
        claim.setWarranty(warranty);
        claim.setUser(user);
        claim.setIssueTitle(normalize(request.issueTitle()));
        claim.setIssueDescription(normalize(request.issueDescription()));
        claim.setStatus(Claim.Status.REQUESTED);

        Claim savedClaim = claimRepository.save(claim);
        notificationService.createNotification(
                user,
                warranty,
                com.management.warranty_management.model.Notification.Type.CLAIM_CREATED,
                "Claim request submitted",
                "Your claim for warranty " + warranty.getSerialNumber() + " has been submitted and is awaiting review."
        );
        return savedClaim;
    }

    public List<Claim> getClaimsByUserId(Long userId) {
        return claimRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Claim> getAllClaims() {
        return claimRepository.findAll().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Claim::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    public List<Claim> searchClaims(ClaimFilterRequest filter) {
        analyticsService.ensureRoleCanViewOperations(filter.requesterRole());
        String status = normalizeOptional(filter.status());
        String userEmail = normalizeOptional(filter.userEmail());
        String serialNumber = normalizeOptional(filter.serialNumber());

        return claimRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(claim -> status == null || (claim.getStatus() != null && claim.getStatus().name().equals(status)))
                .filter(claim -> userEmail == null || containsIgnoreCase(claim.getUser() != null ? claim.getUser().getEmail() : null, userEmail))
                .filter(claim -> serialNumber == null || containsIgnoreCase(claim.getWarranty() != null ? claim.getWarranty().getSerialNumber() : null, serialNumber))
                .sorted(Comparator.comparing(Claim::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    public Claim updateClaimStatus(Long claimId, ClaimStatusUpdateRequest request) {
        if (request.requesterRole() != User.Role.ADMIN && request.requesterRole() != User.Role.SUPPORT) {
            throw new UnauthorizedException("Only admins or support users can update claim status.");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found."));

        claim.setStatus(request.status());
        claim.setAdminNote(normalizeOptional(request.adminNote()));

        Warranty warranty = claim.getWarranty();
        
        // Business Rule: A CLOSED claim means the service is finished. 
        // We only mark the warranty as EXPIRED if the date has passed.
        // We don't mark it as 'CLAIMED' (dead) unless it was a full replacement (future feature).
        if (request.status() == Claim.Status.CLOSED) {
            warranty.setStatus(Warranty.Status.CLAIMED);
        } else if (warranty.getExpiryDate().isBefore(LocalDate.now())) {
            warranty.setStatus(Warranty.Status.EXPIRED);
        } else {
            warranty.setStatus(Warranty.Status.ACTIVE);
        }

        warrantyRepository.save(warranty);
        Claim updatedClaim = claimRepository.save(claim);
        notificationService.createNotification(
                claim.getUser(),
                warranty,
                com.management.warranty_management.model.Notification.Type.CLAIM_STATUS_UPDATED,
                "Claim status updated",
                "Your claim for warranty " + warranty.getSerialNumber() + " is now " + request.status().name() + "."
        );
        return updatedClaim;
    }

    public Claim attachClaimDocument(Long claimId, MultipartFile file) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found."));
        DocumentStorageService.StoredFile storedFile = documentStorageService.store("claims", file);
        claim.setAttachmentFileName(storedFile.originalFileName());
        claim.setAttachmentFilePath(storedFile.storedPath());
        return claimRepository.save(claim);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean containsIgnoreCase(String actualValue, String searchValue) {
        return actualValue != null && actualValue.toLowerCase().contains(searchValue.toLowerCase());
    }
}
