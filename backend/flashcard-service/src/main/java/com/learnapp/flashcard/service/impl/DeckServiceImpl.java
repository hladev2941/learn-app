package com.learnapp.flashcard.service.impl;

import com.learnapp.flashcard.dto.CreateDeckRequest;
import com.learnapp.flashcard.dto.DeckResponse;
import com.learnapp.flashcard.entity.Deck;
import com.learnapp.flashcard.entity.Subject;
import com.learnapp.flashcard.exception.AppException;
import com.learnapp.flashcard.repository.CardRepository;
import com.learnapp.flashcard.repository.DeckRepository;
import com.learnapp.flashcard.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl {

    private final DeckRepository deckRepository;
    private final SubjectRepository subjectRepository;
    private final CardRepository cardRepository;

    public List<DeckResponse> getUserDecks(UUID userId) {
        return deckRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(DeckResponse::from).toList();
    }

    public List<DeckResponse> getDecksBySubject(UUID subjectId, UUID userId) {
        List<Deck> decks = deckRepository.findBySubject_IdAndUserIdOrderByUpdatedAtDesc(subjectId, userId);
        if (decks.isEmpty()) return List.of();

        List<UUID> deckIds = decks.stream().map(Deck::getId).toList();
        LocalDate today = LocalDate.now();
        // Map<deckId, [masteredCount, dueCount]>
        Map<UUID, long[]> stats = cardRepository.findDeckStats(deckIds, today).stream()
                .collect(Collectors.toMap(
                        r -> (UUID) r[0],
                        r -> new long[]{toLong(r[2]), toLong(r[3])}
                ));
        return decks.stream().map(deck -> {
            long[] s = stats.getOrDefault(deck.getId(), new long[]{0L, 0L});
            return DeckResponse.from(deck, (int) s[1], (int) s[0]);
        }).toList();
    }

    private static long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Long l) return l;
        if (val instanceof Number n) return n.longValue();
        return 0L;
    }

    @Transactional
    public DeckResponse createDeck(UUID userId, CreateDeckRequest request) {
        Subject subject = null;
        if (request.subjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.subjectId(), userId)
                    .orElseThrow(() -> new AppException("Subject not found", HttpStatus.NOT_FOUND));
        }
        Deck deck = Deck.builder()
                .userId(userId)
                .subject(subject)
                .name(request.name())
                .description(request.description())
                .coverColor(request.coverColor() != null ? request.coverColor() : "#6366f1")
                .build();
        return DeckResponse.from(deckRepository.save(deck));
    }

    @Transactional
    public DeckResponse updateDeck(UUID deckId, UUID userId, CreateDeckRequest request) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new AppException("Deck not found", HttpStatus.NOT_FOUND));
        if (request.name() != null)        deck.setName(request.name());
        if (request.description() != null) deck.setDescription(request.description());
        if (request.coverColor() != null)  deck.setCoverColor(request.coverColor());
        return DeckResponse.from(deckRepository.save(deck));
    }

    @Transactional
    public void deleteDeck(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new AppException("Deck not found", HttpStatus.NOT_FOUND));
        deckRepository.delete(deck);
    }
}
