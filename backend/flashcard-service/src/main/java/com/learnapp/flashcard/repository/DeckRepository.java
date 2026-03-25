package com.learnapp.flashcard.repository;

import com.learnapp.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeckRepository extends JpaRepository<Deck, UUID> {
    List<Deck> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    List<Deck> findBySubject_IdAndUserIdOrderByUpdatedAtDesc(UUID subjectId, UUID userId);
    Optional<Deck> findByIdAndUserId(UUID id, UUID userId);
    int countBySubject_IdAndUserId(UUID subjectId, UUID userId);
}
