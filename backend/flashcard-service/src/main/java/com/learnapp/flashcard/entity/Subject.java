package com.learnapp.flashcard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "subjects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String emoji = "📚";

    @Builder.Default
    @Column(nullable = false, length = 7)
    private String color = "#6366f1";

    @Builder.Default
    @Column(name = "reminder_enabled", nullable = false)
    private boolean reminderEnabled = false;

    // "MINUTES" | "HOURS" | "DAILY" | "WEEKLY"
    @Column(name = "reminder_type", length = 20)
    private String reminderType;

    // For MINUTES/HOURS: number of minutes or hours between reminders
    @Column(name = "reminder_interval")
    private Integer reminderInterval;

    // For DAILY/WEEKLY: time of day (e.g. 20:00)
    @Column(name = "reminder_time")
    private LocalTime reminderTime;

    // For WEEKLY: comma-separated day codes "MON,WED,FRI"
    @Column(name = "reminder_days", length = 50)
    private String reminderDays;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
