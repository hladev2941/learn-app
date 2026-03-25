package com.learnapp.study.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserGoal {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "goal_study_minutes_per_day", nullable = false)
    private int goalStudyMinutesPerDay = 60;

    @Column(name = "goal_cards_per_day", nullable = false)
    private int goalCardsPerDay = 20;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
