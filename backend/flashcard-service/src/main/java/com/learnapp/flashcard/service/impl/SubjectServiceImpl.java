package com.learnapp.flashcard.service.impl;

import com.learnapp.flashcard.dto.CreateSubjectRequest;
import com.learnapp.flashcard.dto.SubjectResponse;
import com.learnapp.flashcard.entity.Subject;
import com.learnapp.flashcard.exception.AppException;
import com.learnapp.flashcard.repository.DeckRepository;
import com.learnapp.flashcard.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl {

    private final SubjectRepository subjectRepository;
    private final DeckRepository deckRepository;

    public List<SubjectResponse> getUserSubjects(UUID userId) {
        return subjectRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(s -> SubjectResponse.from(s, deckRepository.countBySubject_IdAndUserId(s.getId(), userId)))
                .toList();
    }

    @Transactional
    public SubjectResponse createSubject(UUID userId, CreateSubjectRequest req) {
        Subject subject = Subject.builder()
                .userId(userId)
                .name(req.name())
                .emoji(req.emoji() != null ? req.emoji() : "📚")
                .color(req.color() != null ? req.color() : "#6366f1")
                .reminderEnabled(req.reminderEnabled())
                .reminderType(req.reminderType())
                .reminderInterval(req.reminderInterval())
                .reminderTime(parseTime(req.reminderTime()))
                .reminderDays(joinDays(req.reminderDays()))
                .build();
        Subject saved = subjectRepository.save(subject);
        return SubjectResponse.from(saved, 0);
    }

    @Transactional
    public SubjectResponse updateSubject(UUID subjectId, UUID userId, CreateSubjectRequest req) {
        Subject subject = subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new AppException("Subject not found", HttpStatus.NOT_FOUND));

        if (req.name() != null)             subject.setName(req.name());
        if (req.emoji() != null)            subject.setEmoji(req.emoji());
        if (req.color() != null)            subject.setColor(req.color());
        subject.setReminderEnabled(req.reminderEnabled());
        subject.setReminderType(req.reminderType());
        subject.setReminderInterval(req.reminderInterval());
        if (req.reminderTime() != null)     subject.setReminderTime(parseTime(req.reminderTime()));
        if (req.reminderDays() != null)     subject.setReminderDays(joinDays(req.reminderDays()));

        Subject saved = subjectRepository.save(subject);
        int deckCount = deckRepository.countBySubject_IdAndUserId(subjectId, userId);
        return SubjectResponse.from(saved, deckCount);
    }

    @Transactional
    public void deleteSubject(UUID subjectId, UUID userId) {
        Subject subject = subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new AppException("Subject not found", HttpStatus.NOT_FOUND));
        subjectRepository.delete(subject);
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return null;
        return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String joinDays(List<String> days) {
        if (days == null || days.isEmpty()) return null;
        return String.join(",", days);
    }
}
