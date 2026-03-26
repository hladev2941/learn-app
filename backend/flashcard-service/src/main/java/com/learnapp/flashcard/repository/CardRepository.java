package com.learnapp.flashcard.repository;

import com.learnapp.flashcard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CardRepository extends JpaRepository<Card, UUID> {

    List<Card> findByDeck_IdAndUserId(UUID deckId, UUID userId);

    Optional<Card> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT DISTINCT c FROM Card c LEFT JOIN FETCH c.tags WHERE c.userId = :userId AND (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today) ORDER BY c.nextReviewDate ASC NULLS FIRST")
    List<Card> findDueCards(UUID userId, LocalDate today);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.userId = :userId AND (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today)")
    long countDueCards(UUID userId, LocalDate today);

    /** Due cards filtered by subject */
    @Query("SELECT DISTINCT c FROM Card c LEFT JOIN FETCH c.tags WHERE c.userId = :userId AND c.deck.subject.id = :subjectId AND (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today) ORDER BY c.nextReviewDate ASC NULLS FIRST")
    List<Card> findDueCardsBySubject(@Param("userId") UUID userId, @Param("subjectId") UUID subjectId, @Param("today") LocalDate today);

    /** Returns [deckId, totalCount, masteredCount, dueCount] per deck */
    @Query("""
            SELECT c.deck.id,
                   COUNT(c),
                   SUM(CASE WHEN c.fsrsState = 2 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today) THEN 1 ELSE 0 END)
            FROM Card c WHERE c.deck.id IN :deckIds GROUP BY c.deck.id
            """)
    List<Object[]> findDeckStats(@Param("deckIds") Collection<UUID> deckIds, @Param("today") LocalDate today);

    /** Returns [subjectId, totalCount, masteredCount, dueCount] per subject */
    @Query("""
            SELECT c.deck.subject.id,
                   COUNT(c),
                   SUM(CASE WHEN c.fsrsState = 2 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN (c.nextReviewDate IS NULL OR c.nextReviewDate <= :today) THEN 1 ELSE 0 END)
            FROM Card c WHERE c.deck.subject.id IN :subjectIds AND c.userId = :userId GROUP BY c.deck.subject.id
            """)
    List<Object[]> findSubjectStats(@Param("subjectIds") Collection<UUID> subjectIds, @Param("userId") UUID userId, @Param("today") LocalDate today);
}
