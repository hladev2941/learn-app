package com.learnapp.study.controller;

import com.learnapp.study.common.ApiResponse;
import com.learnapp.study.dto.StreakResponse;
import com.learnapp.study.service.impl.StreakServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/streaks")
@RequiredArgsConstructor
public class StreakController {

    private final StreakServiceImpl streakService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<StreakResponse>> getMyStreak(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(streakService.getStreak(userId)));
    }
}
