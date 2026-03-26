package com.learnapp.notification.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collections;

/**
 * Validates the JWT token sent in the STOMP CONNECT "Authorization" header.
 * Sets the WebSocket principal to the userId extracted from the token,
 * enabling SimpMessagingTemplate to route messages per-user.
 */
@Slf4j
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final SecretKey signingKey;

    public WebSocketAuthInterceptor(@Value("${jwt.secret}") String jwtSecret) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WS CONNECT missing Authorization header — anonymous session");
            return message;
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(authHeader.substring(7))
                    .getPayload();

            String userId = claims.getSubject();
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    userId, null, Collections.emptyList()));
            log.debug("WS CONNECT authenticated — userId={}", userId);
        } catch (Exception e) {
            log.warn("WS JWT validation failed: {}", e.getMessage());
        }

        return message;
    }

}
