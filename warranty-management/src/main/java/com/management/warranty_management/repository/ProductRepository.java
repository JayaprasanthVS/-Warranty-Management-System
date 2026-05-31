package com.management.warranty_management.repository;



import com.management.warranty_management.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // This allows us to look up a product by its unique model number
    Optional<Product> findByModelNumber(String modelNumber);

    boolean existsByModelNumber(String modelNumber);
}
