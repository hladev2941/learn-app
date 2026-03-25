package com.learnapp.study.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reward_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "reward_type", nullable = false)
    private String rewardType; // XP, COIN, BADGE

    @Column(name = "reward_value")
    private Integer rewardValue;

    @Column(name = "badge_code")
    private String badgeCode;

    @CreationTimestamp
    @Column(name = "rewarded_at", updatable = false)
    private Instant rewardedAt;
}
