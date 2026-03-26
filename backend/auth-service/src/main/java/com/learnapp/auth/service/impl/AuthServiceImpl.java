package com.learnapp.auth.service.impl;

import com.learnapp.auth.dto.AuthResponse;
import com.learnapp.auth.dto.LoginRequest;
import com.learnapp.auth.dto.RegisterRequest;
import com.learnapp.auth.dto.UserResponse;
import com.learnapp.auth.entity.RefreshToken;
import com.learnapp.auth.entity.User;
import com.learnapp.auth.exception.AppException;
import com.learnapp.auth.repository.RefreshTokenRepository;
import com.learnapp.auth.repository.UserRepository;
import com.learnapp.auth.service.AuthService;
import com.learnapp.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException("Email already registered", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .emailVerifyToken(UUID.randomUUID().toString())
                .build();

        userRepository.save(user);
        // TODO: send verification email via JavaMailSender

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AppException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AppException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new AppException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        return buildAuthResponse(refreshToken.getUser());
    }

    @Override
    @Transactional
    public void logout(String accessToken, String refreshToken) {
        try {
            String userId = jwtService.extractClaims(accessToken).getSubject();
            jwtService.evictUserDetail(userId);
        } catch (Exception ignored) {}

        jwtService.blacklistToken(accessToken);
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerifyToken(token)
                .orElseThrow(() -> new AppException("Invalid verification token", HttpStatus.BAD_REQUEST));
        user.setEmailVerified(true);
        user.setEmailVerifyToken(null);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        jwtService.cacheUserDetail(user);   // cache for downstream services

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString();

        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpiration))
                .build());

        return AuthResponse.of(accessToken, refreshToken, refreshTokenExpiration / 1000, UserResponse.from(user));
    }
}
