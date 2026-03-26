package com.learnapp.study.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BLACKLIST_PREFIX   = "jwt:blacklist:";
    private static final String USER_DETAIL_PREFIX = "user:detail:";

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token))) {
                filterChain.doFilter(request, response);
                return;
            }

            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();

            String role = getRoleFromCache(userId);
            if (role == null) {
                role = claims.get("role", String.class);
            }

            if (userId != null && role != null) {
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                userId, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        )
                );
            }

        } catch (Exception ignored) {}

        filterChain.doFilter(request, response);
    }

    private String getRoleFromCache(String userId) {
        try {
            String json = redisTemplate.opsForValue().get(USER_DETAIL_PREFIX + userId);
            if (json == null) return null;
            return objectMapper.readValue(json, CachedUserDetail.class).role();
        } catch (Exception e) {
            return null;
        }
    }
}
