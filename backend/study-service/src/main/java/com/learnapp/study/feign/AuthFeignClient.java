package com.learnapp.study.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

/**
 * Feign client gọi internal API của auth-service.
 * URL resolved via Docker DNS (no Eureka).
 */
@FeignClient(name = "auth-service", url = "${services.auth-url}", path = "/internal/users")
public interface AuthFeignClient {

    @GetMapping("/{userId}/timezone")
    String getUserTimezone(@PathVariable UUID userId);

    @GetMapping("/{userId}/exists")
    boolean userExists(@PathVariable UUID userId);

    @PatchMapping("/{userId}/balance")
    void updateBalance(@PathVariable UUID userId, @RequestBody BalanceRequest request);

    record BalanceRequest(int xpDelta, int coinDelta) {}
}
