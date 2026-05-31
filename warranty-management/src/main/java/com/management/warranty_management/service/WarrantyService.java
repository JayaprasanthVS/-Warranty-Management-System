package com.management.warranty_management.service;
import com.management.warranty_management.dto.filter.WarrantyFilterRequest;
import com.management.warranty_management.dto.warranty.WarrantyRequest;
import com.management.warranty_management.dto.warranty.WarrantySummaryResponse;
import com.management.warranty_management.exception.BadRequestException;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.exception.NotFoundException;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.model.User;
import com.management.warranty_management.model.Warranty;
import com.management.warranty_management.repository.ProductRepository;
import com.management.warranty_management.repository.UserRepository;
import com.management.warranty_management.repository.WarrantyRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class WarrantyService {

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DocumentStorageService documentStorageService;

    public Warranty registerWarranty(WarrantyRequest request) {
        String normalizedSerialNumber = normalizeSerialNumber(request.serialNumber());
        if (!normalizedSerialNumber.matches("^[A-Z0-9-]{6,40}$")) {
            throw new BadRequestException("Serial number must contain only letters, numbers, or hyphens and be 6 to 40 characters long.");
        }
        if (warrantyRepository.existsBySerialNumber(normalizedSerialNumber)) {
            throw new ConflictException("Serial number already registered.");
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new NotFoundException("Product model not found."));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (request.purchaseDate().isBefore(LocalDate.now().minusYears(10))) {
            throw new BadRequestException("Purchase date is too old for direct registration.");
        }

        Warranty warranty = new Warranty();
        warranty.setSerialNumber(normalizedSerialNumber);
        warranty.setUser(user);
        warranty.setProduct(product);
        warranty.setPurchaseDate(request.purchaseDate());

        LocalDate purchaseDate = request.purchaseDate();
        LocalDate calculatedExpiry = purchaseDate.plusMonths(product.getWarrantyMonths());
        warranty.setExpiryDate(calculatedExpiry);

        if (LocalDate.now().isAfter(calculatedExpiry)) {
            warranty.setStatus(Warranty.Status.EXPIRED);
        } else {
            warranty.setStatus(Warranty.Status.ACTIVE);
        }

        Warranty savedWarranty = warrantyRepository.save(warranty);
        notificationService.createNotification(
                user,
                savedWarranty,
                com.management.warranty_management.model.Notification.Type.WARRANTY_REGISTERED,
                "Warranty registered successfully",
                "Your warranty for " + product.getName() + " is active until " + calculatedExpiry + "."
        );
        return savedWarranty;
    }

    public List<Warranty> getWarrantiesByUserId(Long userId) {
        return warrantyRepository.findByUserId(userId);
    }

    public WarrantySummaryResponse getWarrantySummaryByUserId(Long userId) {
        List<Warranty> warranties = warrantyRepository.findByUserId(userId);
        LocalDate now = LocalDate.now();
        long active = warranties.stream().filter(warranty -> hasStatus(warranty, Warranty.Status.ACTIVE)).count();
        long expired = warranties.stream().filter(warranty -> hasStatus(warranty, Warranty.Status.EXPIRED)).count();
        long claimed = warranties.stream().filter(warranty -> hasStatus(warranty, Warranty.Status.CLAIMED)).count();
        long expiringSoon = warranties.stream()
                .filter(warranty -> hasStatus(warranty, Warranty.Status.ACTIVE))
                .filter(warranty -> hasExpiryInRange(warranty, now, now.plusDays(30)))
                .count();

        return new WarrantySummaryResponse(warranties.size(), active, expired, claimed, expiringSoon);
    }

    public Warranty getWarrantyBySerialNumber(String serialNumber) {
        return warrantyRepository.findBySerialNumber(normalizeSerialNumber(serialNumber))
                .orElseThrow(() -> new NotFoundException("No warranty found for serial: " + serialNumber));
    }

    public Warranty getWarrantyById(Long warrantyId) {
        return warrantyRepository.findById(warrantyId)
                .orElseThrow(() -> new NotFoundException("Warranty not found."));
    }

    public List<Warranty> searchWarranties(WarrantyFilterRequest filter) {
        analyticsService.ensureRoleCanViewOperations(filter.requesterRole());

        String status = normalize(filter.status());
        String productName = normalize(filter.productName());
        String modelNumber = normalize(filter.modelNumber());
        String userEmail = normalize(filter.userEmail());

        return warrantyRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(warranty -> status == null || matchesStatus(warranty, status))
                .filter(warranty -> productName == null || containsIgnoreCase(warranty.getProduct() != null ? warranty.getProduct().getName() : null, productName))
                .filter(warranty -> modelNumber == null || containsIgnoreCase(warranty.getProduct() != null ? warranty.getProduct().getModelNumber() : null, modelNumber))
                .filter(warranty -> userEmail == null || containsIgnoreCase(warranty.getUser() != null ? warranty.getUser().getEmail() : null, userEmail))
                .filter(warranty -> filter.purchaseDateFrom() == null || hasDateOnOrAfter(warranty.getPurchaseDate(), filter.purchaseDateFrom()))
                .filter(warranty -> filter.purchaseDateTo() == null || hasDateOnOrBefore(warranty.getPurchaseDate(), filter.purchaseDateTo()))
                .filter(warranty -> filter.expiryDateFrom() == null || hasDateOnOrAfter(warranty.getExpiryDate(), filter.expiryDateFrom()))
                .filter(warranty -> filter.expiryDateTo() == null || hasDateOnOrBefore(warranty.getExpiryDate(), filter.expiryDateTo()))
                .toList();
    }

    public Warranty attachInvoice(Long warrantyId, MultipartFile file) {
        Warranty warranty = warrantyRepository.findById(warrantyId)
                .orElseThrow(() -> new NotFoundException("Warranty not found."));
        DocumentStorageService.StoredFile storedFile = documentStorageService.store("warranties", file);
        warranty.setInvoiceFileName(storedFile.originalFileName());
        warranty.setInvoiceFilePath(storedFile.storedPath());
        return warrantyRepository.save(warranty);
    }

    private String normalizeSerialNumber(String serialNumber) {
        return serialNumber == null ? null : serialNumber.trim().toUpperCase();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean hasStatus(Warranty warranty, Warranty.Status expectedStatus) {
        return warranty != null && warranty.getStatus() == expectedStatus;
    }

    private boolean matchesStatus(Warranty warranty, String expectedStatus) {
        return warranty.getStatus() != null && warranty.getStatus().name().equals(expectedStatus);
    }

    private boolean hasExpiryInRange(Warranty warranty, LocalDate from, LocalDate to) {
        return warranty != null
                && warranty.getExpiryDate() != null
                && !warranty.getExpiryDate().isBefore(from)
                && !warranty.getExpiryDate().isAfter(to);
    }

    private boolean containsIgnoreCase(String actualValue, String searchValue) {
        return actualValue != null && actualValue.toLowerCase().contains(searchValue.toLowerCase());
    }

    private boolean hasDateOnOrAfter(LocalDate actualDate, LocalDate threshold) {
        return actualDate != null && !actualDate.isBefore(threshold);
    }

    private boolean hasDateOnOrBefore(LocalDate actualDate, LocalDate threshold) {
        return actualDate != null && !actualDate.isAfter(threshold);
    }
}
