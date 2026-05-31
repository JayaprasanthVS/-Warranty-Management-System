package com.management.warranty_management.service;

import com.management.warranty_management.dto.auth.RegisterRequest;
import com.management.warranty_management.exception.ConflictException;
import com.management.warranty_management.exception.UnauthorizedException;
import com.management.warranty_management.model.User;
import com.management.warranty_management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User();
        existingUser.setId(1L);
        existingUser.setName("Jay");
        existingUser.setEmail("jay@example.com");
        existingUser.setPassword("encoded");
        existingUser.setRole(User.Role.CUSTOMER);
    }

    @Test
    void registerUserHashesPasswordAndNormalizesEmail() {
        RegisterRequest request = new RegisterRequest("  Jay  Kumar ", " JAY@Example.com ", "password123", User.Role.CUSTOMER);
        when(userRepository.existsByEmail("jay@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User saved = authService.registerUser(request);

        assertEquals("jay@example.com", saved.getEmail());
        assertEquals("Jay Kumar", saved.getName());
        assertEquals("encoded", saved.getPassword());
    }

    @Test
    void registerUserRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Jay", "jay@example.com", "password123", User.Role.CUSTOMER);
        when(userRepository.existsByEmail("jay@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.registerUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginRejectsInvalidPassword() {
        when(userRepository.findByEmail("jay@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrong-password", "encoded")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.loginUser("jay@example.com", "wrong-password"));
    }
}
