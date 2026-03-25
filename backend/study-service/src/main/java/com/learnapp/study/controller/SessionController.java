package com.learnapp.study.controller;

import com.learnapp.study.common.ApiResponse;
import com.learnapp.study.dto.CompleteSessionRequest;
import com.learnapp.study.dto.SessionCompletedResponse;
import com.learnapp.study.service.impl.SessionServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionServiceImpl sessionService;

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<SessionCompletedResponse>> complete(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CompleteSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.completeSession(userId, request)));
    }

    @GetMapping("/today/stats")
    public ResponseEntity<ApiResponse<Object>> getTodayStats(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "Asia/Ho_Chi_Minh") String timezone) {
        var stats = new java.util.HashMap<String, Object>();
        stats.put("totalSeconds", sessionService.getTodayStudySeconds(userId, timezone));
        stats.put("sessionCount",  sessionService.getTodaySessionCount(userId, timezone));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
