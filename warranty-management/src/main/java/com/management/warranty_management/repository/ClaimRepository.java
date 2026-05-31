package com.management.warranty_management.repository;

import com.management.warranty_management.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Claim> findByWarrantyIdOrderByCreatedAtDesc(Long warrantyId);

    Optional<Claim> findFirstByWarrantyIdAndStatusIn(Long warrantyId, List<Claim.Status> statuses);
}
