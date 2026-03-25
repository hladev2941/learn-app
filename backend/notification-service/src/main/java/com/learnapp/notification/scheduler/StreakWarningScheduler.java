package com.learnapp.notification.scheduler;

import com.learnapp.notification.feign.StudyFeignClient;
import com.learnapp.notification.model.NotificationMessage;
import com.learnapp.notification.service.NotificationDispatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Runs at 20:00 UTC+7 (= 13:00 UTC).
 * Warns users who have an active streak but haven't studied today.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StreakWarningScheduler {

    private final StudyFeignClient studyFeignClient;
    private final NotificationDispatcher dispatcher;

    @Scheduled(cron = "0 0 13 * * *") // 20:00 UTC+7 = 13:00 UTC
    public void warnUsersAtRisk() {
        LocalDate today = LocalDate.now();
        log.info("Running streak warning scheduler for {}", today);

        try {
            studyFeignClient.getAtRiskStreaks(today).forEach(streak -> {
                String message = "Bạn đang có streak " + streak.currentStreak()
                        + " ngày. Hãy học ít nhất 1 phút hôm nay để giữ streak nhé!";

                dispatcher.send(
                        streak.userId(),
                        NotificationMessage.of("STREAK_WARNING",
                                "Streak của bạn sắp mất!", message),
                        "STREAK_WARNING",
                        null
                );
            });
        } catch (Exception e) {
            log.error("StreakWarningScheduler error: {}", e.getMessage());
        }
    }
}
