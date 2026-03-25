package com.learnapp.flashcard.internal;

import com.learnapp.flashcard.entity.Subject;
import com.learnapp.flashcard.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Internal API — called by study-service via Feign to get subjects with due reminders.
 * NOT routed through api-gateway.
 */
@Slf4j
@RestController
@RequestMapping("/internal/subjects")
@RequiredArgsConstructor
public class InternalSubjectController {

    private final SubjectRepository subjectRepository;

    /**
     * Returns all subjects whose reminder is due at the current minute (UTC+7).
     * Supports DAILY and WEEKLY reminder types.
     */
    @GetMapping("/due-reminders")
    public ResponseEntity<List<DueReminderDto>> getDueReminders() {
        ZonedDateTime nowVn = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalTime nowTime = nowVn.toLocalTime().withSecond(0).withNano(0);
        DayOfWeek today = nowVn.getDayOfWeek();

        List<DueReminderDto> result = subjectRepository.findByReminderEnabledTrue()
                .stream()
                .filter(s -> isDue(s, nowTime, today))
                .map(s -> new DueReminderDto(
                        s.getUserId(),
                        s.getId(),
                        s.getEmoji() + " " + s.getName(),
                        "Đến giờ học môn " + s.getName() + " rồi!"
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    private boolean isDue(Subject s, LocalTime nowTime, DayOfWeek today) {
        if (s.getReminderTime() == null) return false;
        LocalTime reminderTime = s.getReminderTime().withSecond(0).withNano(0);
        if (!reminderTime.equals(nowTime)) return false;

        return switch (s.getReminderType() == null ? "" : s.getReminderType()) {
            case "DAILY" -> true;
            case "WEEKLY" -> {
                if (s.getReminderDays() == null) yield false;
                String dayCode = today.name().substring(0, 3); // MON, TUE, ...
                yield s.getReminderDays().contains(dayCode);
            }
            default -> false;
        };
    }

    record DueReminderDto(UUID userId, UUID subjectId, String subjectName, String message) {}
}
