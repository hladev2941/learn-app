package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.CreateSubjectRequest;
import com.learnapp.flashcard.dto.DeckResponse;
import com.learnapp.flashcard.dto.SubjectResponse;
import com.learnapp.flashcard.service.impl.DeckServiceImpl;
import com.learnapp.flashcard.service.impl.SubjectServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectServiceImpl subjectService;
    private final DeckServiceImpl deckService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getSubjects(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.getUserSubjects(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(subjectService.createSubject(userId, request)));
    }

    @PatchMapping("/{subjectId}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID subjectId,
            @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.updateSubject(subjectId, userId, request)));
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> deleteSubject(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID subjectId) {
        subjectService.deleteSubject(subjectId, userId);
        return ResponseEntity.noContent().build();
    }

    // Decks within a subject
    @GetMapping("/{subjectId}/decks")
    public ResponseEntity<ApiResponse<List<DeckResponse>>> getSubjectDecks(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID subjectId) {
        return ResponseEntity.ok(ApiResponse.success(deckService.getDecksBySubject(subjectId, userId)));
    }
}
