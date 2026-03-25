package com.learnapp.flashcard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "cards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "front_text", columnDefinition = "TEXT")
    private String frontText;

    @Column(name = "front_image_url")
    private String frontImageUrl;

    @Column(name = "back_text", columnDefinition = "TEXT")
    private String backText;

    @Column(name = "back_image_url")
    private String backImageUrl;

    // FSRS algorithm fields
    @Column(name = "fsrs_stability")
    private double fsrsStability = 0;

    @Column(name = "fsrs_difficulty")
    private double fsrsDifficulty = 0;

    @Column(name = "fsrs_reps")
    private int fsrsReps = 0;

    @Column(name = "fsrs_lapses")
    private int fsrsLapses = 0;

    @Column(name = "fsrs_state")
    private int fsrsState = 0; // 0=New, 1=Learning, 2=Review, 3=Relearning

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "last_review_date")
    private LocalDate lastReviewDate;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "card_tags",
        joinColumns = @JoinColumn(name = "card_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
