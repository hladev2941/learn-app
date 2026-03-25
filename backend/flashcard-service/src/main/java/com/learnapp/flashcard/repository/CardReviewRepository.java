package com.learnapp.flashcard.repository;

import com.learnapp.flashcard.entity.CardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface CardReviewRepository extends JpaRepository<CardReview, UUID> {

    long countByUserIdAndReviewDate(UUID userId, LocalDate date);

    @Query("SELECT COUNT(r) FROM CardReview r WHERE r.userId = :userId AND r.reviewDate = :date AND r.rating IN ('GOOD', 'EASY')")
    long countGoodReviewsByDate(UUID userId, LocalDate date);

    long countByUserIdAndReviewDateBetween(UUID userId, LocalDate from, LocalDate to);
}
