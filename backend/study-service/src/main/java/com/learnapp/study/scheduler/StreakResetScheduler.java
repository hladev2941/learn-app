package com.learnapp.study.scheduler;

import com.learnapp.study.service.impl.StreakServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StreakResetScheduler {

    private final StreakServiceImpl streakService;

    /**
     * Chạy lúc 00:05 mỗi ngày theo múi giờ UTC+7 (Việt Nam).
     * Reset streak của những user không học ngày hôm qua.
     * Cron: giây phút giờ ngày tháng thứ
     */
    @Scheduled(cron = "0 5 17 * * *") // 00:05 UTC+7 = 17:05 UTC
    public void resetMissedStreaks() {
        log.info("Running streak reset job...");
        streakService.resetMissedStreaks("Asia/Ho_Chi_Minh");
    }
}
