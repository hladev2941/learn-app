package com.learnapp.auth.repository;

import com.learnapp.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByOauthProviderAndOauthProviderId(String provider, String providerId);

    Optional<User> findByEmailVerifyToken(String token);

    List<User> findTop10ByOrderByXpTotalDesc();
}
