package com.learnapp.flashcard.service.impl;

import com.learnapp.flashcard.entity.Card;
import com.learnapp.flashcard.entity.CardReview;
import com.learnapp.flashcard.repository.CardRepository;
import com.learnapp.flashcard.repository.CardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Simplified SM-2 based spaced repetition.
 * Phase 2: replace with fsrs4j library for full FSRS algorithm.
 */
@Service
@RequiredArgsConstructor
public class SpacedRepetitionServiceImpl {

    private final CardRepository cardRepository;
    private final CardReviewRepository reviewRepository;

    @Transactional
    public Card processReview(UUID cardId, UUID userId, String rating, Integer durationMs) {
        Card card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        LocalDate today = LocalDate.now();
        int intervalDays = calculateInterval(card, rating);

        // Update FSRS/SM-2 fields on card
        card.setFsrsReps(card.getFsrsReps() + 1);
        card.setLastReviewDate(today);
        card.setNextReviewDate(today.plusDays(intervalDays));
        card.setFsrsState(2); // Move to Review state after first review

        if (rating.equals("AGAIN")) {
            card.setFsrsLapses(card.getFsrsLapses() + 1);
            card.setFsrsState(3); // Relearning
        }

        cardRepository.save(card);

        // Log review
        reviewRepository.save(CardReview.builder()
                .cardId(cardId)
                .userId(userId)
                .rating(rating)
                .reviewDurationMs(durationMs)
                .stabilityAfter(card.getFsrsStability())
                .scheduledDays(intervalDays)
                .reviewDate(today)
                .build());

        return card;
    }

    private int calculateInterval(Card card, String rating) {
        // Simplified SM-2: intervals 1, 3, 7, 14, 30 days based on rating & reps
        return switch (rating) {
            case "AGAIN" -> 1;
            case "HARD"  -> Math.max(1, (int)(card.getFsrsStability() * 0.5));
            case "GOOD"  -> calculateGoodInterval(card);
            case "EASY"  -> calculateGoodInterval(card) * 2;
            default      -> 1;
        };
    }

    private int calculateGoodInterval(Card card) {
        if (card.getFsrsReps() == 0) return 1;
        if (card.getFsrsReps() == 1) return 3;
        if (card.getFsrsReps() == 2) return 7;
        return Math.min(365, (int)(card.getFsrsStability() * 2.5));
    }
}
