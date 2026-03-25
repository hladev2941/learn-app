package com.learnapp.flashcard.repository;

import com.learnapp.flashcard.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    List<Subject> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    Optional<Subject> findByIdAndUserId(UUID id, UUID userId);

    /** Find all subjects with reminder enabled — used by study-service scheduler. */
    List<Subject> findByReminderEnabledTrue();
}
