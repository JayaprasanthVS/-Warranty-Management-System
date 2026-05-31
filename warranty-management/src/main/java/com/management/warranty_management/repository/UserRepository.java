package com.management.warranty_management.repository;

import com.management.warranty_management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This allows us to look up a user by their email during login later!
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
