package com.learnapp.auth.internal;

import com.learnapp.auth.dto.UpdateBalanceRequest;
import com.learnapp.auth.service.impl.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Internal API — only called by other services via Feign.
 * NOT exposed through api-gateway.
 */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserServiceImpl userService;

    @GetMapping("/{userId}/timezone")
    public ResponseEntity<String> getTimezone(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getTimezone(userId));
    }

    @GetMapping("/{userId}/exists")
    public ResponseEntity<Boolean> exists(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.existsById(userId));
    }

    @PatchMapping("/{userId}/balance")
    public ResponseEntity<Void> updateBalance(
            @PathVariable UUID userId,
            @RequestBody UpdateBalanceRequest request) {
        userService.updateBalance(userId, request);
        return ResponseEntity.noContent().build();
    }
}
