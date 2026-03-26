package com.learnapp.auth.service;

import com.learnapp.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    private static final String BLACKLIST_PREFIX  = "jwt:blacklist:";
    private static final String USER_DETAIL_PREFIX = "user:detail:";
    private static final long   USER_DETAIL_TTL_DAYS = 7;

    private final StringRedisTemplate redisTemplate;

    public JwtService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        return buildToken(claims, user.getId().toString(), accessTokenExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            if (isBlacklisted(token)) return false;
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void blacklistToken(String token) {
        Claims claims = extractClaims(token);
        long ttl = claims.getExpiration().getTime() - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue()
                    .set(BLACKLIST_PREFIX + token, "1", ttl, TimeUnit.MILLISECONDS);
        }
    }

    /** Cache user detail in Redis so downstream services can validate without calling auth-service. */
    public void cacheUserDetail(User user) {
        String json = String.format(
            "{\"id\":\"%s\",\"email\":\"%s\",\"displayName\":\"%s\",\"role\":\"%s\",\"timezone\":\"%s\"}",
            user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name(), user.getTimezone()
        );
        redisTemplate.opsForValue()
                .set(USER_DETAIL_PREFIX + user.getId(), json, USER_DETAIL_TTL_DAYS, TimeUnit.DAYS);
    }

    /** Remove cached user detail (call on logout or profile update). */
    public void evictUserDetail(String userId) {
        redisTemplate.delete(USER_DETAIL_PREFIX + userId);
    }

    private boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }
}
