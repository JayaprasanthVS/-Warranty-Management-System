package com.management.warranty_management.service;
import com.management.warranty_management.dto.product.ProductRequest;
import com.management.warranty_management.dto.filter.ProductFilterRequest;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.exception.NotFoundException;
import com.management.warranty_management.model.Product;
import com.management.warranty_management.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Save a new product to the catalog
    public Product addProduct(ProductRequest request) {
        String normalizedModelNumber = normalizeModelNumber(request.modelNumber());
        if (productRepository.existsByModelNumber(normalizedModelNumber)) {
            throw new ConflictException("Model number already exists.");
        }

        Product product = new Product();
        product.setName(normalizeName(request.name()));
        product.setModelNumber(normalizedModelNumber);
        product.setDescription(normalizeDescription(request.description()));
        product.setWarrantyMonths(request.warrantyMonths());
        return productRepository.save(product);
    }

    // Retrieve all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> searchProducts(ProductFilterRequest filter) {
        String needle = filter.query() == null ? "" : filter.query().trim().toLowerCase();
        return productRepository.findAll().stream()
                .filter(product -> needle.isBlank()
                        || product.getName().toLowerCase().contains(needle)
                        || product.getModelNumber().toLowerCase().contains(needle)
                        || (product.getDescription() != null && product.getDescription().toLowerCase().contains(needle)))
                .toList();
    }

    // Find product by ID
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));
    }

    private String normalizeModelNumber(String modelNumber) {
        return modelNumber == null ? null : modelNumber.trim().toUpperCase();
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
