package com.learnapp.flashcard.repository;

import com.learnapp.flashcard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CardRepository extends JpaRepository<Card, UUID> {

    List<Card> findByDeck_IdAndUserId(UUID deckId, UUID userId);

    Optional<Card> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT c FROM Card c WHERE c.userId = :userId AND (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today) ORDER BY c.nextReviewDate ASC NULLS FIRST")
    List<Card> findDueCards(UUID userId, LocalDate today);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.userId = :userId AND (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today)")
    long countDueCards(UUID userId, LocalDate today);
}
