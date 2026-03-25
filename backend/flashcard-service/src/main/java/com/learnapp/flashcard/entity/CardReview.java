package com.learnapp.flashcard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "card_reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CardReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "card_id", nullable = false)
    private UUID cardId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String rating; // AGAIN, HARD, GOOD, EASY

    @Column(name = "review_duration_ms")
    private Integer reviewDurationMs;

    @Column(name = "stability_after")
    private Double stabilityAfter;

    @Column(name = "difficulty_after")
    private Double difficultyAfter;

    @Column(name = "scheduled_days")
    private Integer scheduledDays;

    @CreationTimestamp
    @Column(name = "reviewed_at", updatable = false)
    private Instant reviewedAt;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;
}
