package com.learnapp.auth.service;

import com.learnapp.auth.dto.AuthResponse;
import com.learnapp.auth.dto.LoginRequest;
import com.learnapp.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String accessToken, String refreshToken);
    void verifyEmail(String token);
}
