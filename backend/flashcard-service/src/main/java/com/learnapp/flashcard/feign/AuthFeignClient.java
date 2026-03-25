package com.learnapp.flashcard.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "auth-service", url = "${services.auth-url}", path = "/internal/users")
public interface AuthFeignClient {

    @GetMapping("/{userId}/exists")
    boolean userExists(@PathVariable UUID userId);

    @GetMapping("/{userId}/timezone")
    String getUserTimezone(@PathVariable UUID userId);
}
