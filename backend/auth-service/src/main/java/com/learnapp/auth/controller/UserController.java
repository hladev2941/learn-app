package com.learnapp.auth.controller;

import com.learnapp.auth.common.ApiResponse;
import com.learnapp.auth.dto.ChangePasswordRequest;
import com.learnapp.auth.dto.LeaderboardEntryDto;
import com.learnapp.auth.dto.UpdateProfileRequest;
import com.learnapp.auth.dto.UserResponse;
import com.learnapp.auth.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.findById(userId)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(userId, request)));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> getLeaderboard(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getLeaderboard(userId)));
    }
}
