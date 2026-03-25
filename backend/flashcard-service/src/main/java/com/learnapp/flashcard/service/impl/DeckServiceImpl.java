package com.learnapp.flashcard.service.impl;

import com.learnapp.flashcard.dto.CreateDeckRequest;
import com.learnapp.flashcard.dto.DeckResponse;
import com.learnapp.flashcard.entity.Deck;
import com.learnapp.flashcard.exception.AppException;
import com.learnapp.flashcard.repository.DeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl {

    private final DeckRepository deckRepository;

    public List<DeckResponse> getUserDecks(UUID userId) {
        return deckRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(DeckResponse::from).toList();
    }

    @Transactional
    public DeckResponse createDeck(UUID userId, CreateDeckRequest request) {
        Deck deck = Deck.builder()
                .userId(userId)
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
