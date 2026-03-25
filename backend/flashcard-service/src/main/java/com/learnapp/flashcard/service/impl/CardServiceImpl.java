package com.learnapp.flashcard.service.impl;

import com.learnapp.flashcard.dto.CardResponse;
import com.learnapp.flashcard.dto.CreateCardRequest;
import com.learnapp.flashcard.entity.Card;
import com.learnapp.flashcard.entity.Deck;
import com.learnapp.flashcard.entity.Tag;
import com.learnapp.flashcard.exception.AppException;
import com.learnapp.flashcard.repository.CardRepository;
import com.learnapp.flashcard.repository.DeckRepository;
import com.learnapp.flashcard.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardServiceImpl {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;
    private final TagRepository tagRepository;

    public List<CardResponse> getCardsByDeck(UUID deckId, UUID userId) {
        return cardRepository.findByDeck_IdAndUserId(deckId, userId)
                .stream().map(CardResponse::from).toList();
    }

    @Transactional
    public CardResponse createCard(UUID deckId, UUID userId, CreateCardRequest request) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new AppException("Deck not found", HttpStatus.NOT_FOUND));

        Set<Tag> tags = resolveTags(userId, request.tags());

        Card card = Card.builder()
                .deck(deck)
                .userId(userId)
                .frontText(request.frontText())
                .frontImageUrl(request.frontImageUrl())
                .backText(request.backText())
                .backImageUrl(request.backImageUrl())
                .tags(tags)
                .build();

        return CardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public CardResponse updateCard(UUID cardId, UUID userId, CreateCardRequest request) {
        Card card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new AppException("Card not found", HttpStatus.NOT_FOUND));

        if (request.frontText() != null)     card.setFrontText(request.frontText());
        if (request.frontImageUrl() != null) card.setFrontImageUrl(request.frontImageUrl());
        if (request.backText() != null)      card.setBackText(request.backText());
        if (request.backImageUrl() != null)  card.setBackImageUrl(request.backImageUrl());
        if (request.tags() != null)          card.setTags(resolveTags(userId, request.tags()));

        return CardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public void deleteCard(UUID cardId, UUID userId) {
        Card card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new AppException("Card not found", HttpStatus.NOT_FOUND));

        cardRepository.delete(card);
    }

    private Set<Tag> resolveTags(UUID userId, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        Set<Tag> tags = new HashSet<>();
        for (String name : tagNames) {
            Tag tag = tagRepository.findByUserIdAndName(userId, name)
                    .orElseGet(() -> tagRepository.save(Tag.builder().userId(userId).name(name).build()));
            tags.add(tag);
        }
        return tags;
    }
}
