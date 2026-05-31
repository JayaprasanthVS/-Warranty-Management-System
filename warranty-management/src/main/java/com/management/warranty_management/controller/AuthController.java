package com.management.warranty_management.controller;
import com.management.warranty_management.dto.auth.AuthRequest;
import com.management.warranty_management.dto.auth.AuthResponse;
import com.management.warranty_management.dto.auth.RegisterRequest;
import com.management.warranty_management.dto.user.UserResponse;
import com.management.warranty_management.model.User;
import com.management.warranty_management.service.AuthService;
import com.management.warranty_management.config.JwtUtil;
import com.management.warranty_management.mapper.ResponseMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil; // Injected utility instance

    // Endpoint: POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User savedUser = authService.registerUser(request);
        return ResponseEntity.ok(ResponseMapper.toUserResponse(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        User user = authService.loginUser(request.email(), request.password());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().toString());

        return ResponseEntity.ok(new AuthResponse(
                "Login successful!",
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().toString()
        ));
    }
}
