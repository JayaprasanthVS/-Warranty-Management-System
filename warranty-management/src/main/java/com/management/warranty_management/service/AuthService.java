package com.management.warranty_management.service;
import com.management.warranty_management.dto.auth.RegisterRequest;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.User;
import com.management.warranty_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Register a new user with a hashed password
    public User registerUser(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email address already registered.");
        }
        User user = new User();
        user.setName(normalizeName(request.name()));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        return userRepository.save(user);
    }

    // Verify user login credentials
    public User loginUser(String email, String plainPassword) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(plainPassword, user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        return user;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim().replaceAll("\\s+", " ");
    }
}
