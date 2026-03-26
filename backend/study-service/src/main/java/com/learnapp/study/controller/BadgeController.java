package com.learnapp.study.controller;

import com.learnapp.study.common.ApiResponse;
import com.learnapp.study.dto.BadgeDto;
import com.learnapp.study.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    /** Returns all badge definitions + earned status for the authenticated user. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<BadgeDto>>> getMyBadges(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getUserBadges(userId)));
    }
}
