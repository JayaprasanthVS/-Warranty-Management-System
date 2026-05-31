package com.management.warranty_management.repository;

import com.management.warranty_management.model.Warranty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRepository extends JpaRepository<Warranty, Long> {
    // Find a warranty card by its unique hardware serial number
    Optional<Warranty> findBySerialNumber(String serialNumber);

    boolean existsBySerialNumber(String serialNumber);
    
    // Find all warranties belonging to a specific customer ID
    List<Warranty> findByUserId(Long userId);
}
