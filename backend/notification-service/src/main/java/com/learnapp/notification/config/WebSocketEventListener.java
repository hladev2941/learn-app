package com.learnapp.notification.config;

import com.learnapp.notification.registry.OnlineUserRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

/**
 * Listens to WebSocket connect/disconnect events to keep
 * the Redis online-user registry up to date.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final OnlineUserRegistry onlineUserRegistry;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        getPrincipal(StompHeaderAccessor.wrap(event.getMessage()))
                .ifPresent(userId -> {
                    onlineUserRegistry.markOnline(userId);
                    log.debug("User {} connected via WebSocket", userId);
                });
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        getPrincipal(StompHeaderAccessor.wrap(event.getMessage()))
                .ifPresent(userId -> {
                    onlineUserRegistry.markOffline(userId);
                    log.debug("User {} disconnected from WebSocket", userId);
                });
    }

    private Optional<UUID> getPrincipal(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) return Optional.empty();
        try {
            return Optional.of(UUID.fromString(user.getName()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
