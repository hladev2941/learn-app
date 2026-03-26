package com.learnapp.study.service.impl;

import com.learnapp.study.dto.DailyStatDto;
import com.learnapp.study.repository.StudySessionRepository;
import com.learnapp.study.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final StudySessionRepository sessionRepository;

    @Override
    public List<DailyStatDto> getDailyStudyStats(UUID userId, int days, String timezone) {
        ZoneId zone;
        try {
            zone = ZoneId.of(timezone);
        } catch (Exception e) {
            log.warn("Invalid timezone '{}', falling back to Asia/Ho_Chi_Minh", timezone);
            zone = ZoneId.of("Asia/Ho_Chi_Minh");
        }

        LocalDate today = LocalDate.now(zone);
        LocalDate from  = today.minusDays(days - 1L);

        // Query 1: total seconds per day
        List<Object[]> durationRows = sessionRepository.findDailyStudyStats(userId, from, today);

        // Query 2: session count per day
        List<Object[]> countRows = sessionRepository.findDailySessionCount(userId, from, today);

        // Build lookup maps keyed by ISO date string
        Map<String, Integer> durationMap = new HashMap<>();
        for (Object[] row : durationRows) {
            String dateKey = ((LocalDate) row[0]).format(DATE_FMT);
            int seconds = row[1] instanceof Number n ? n.intValue() : 0;
            durationMap.put(dateKey, seconds);
        }

        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : countRows) {
            String dateKey = ((LocalDate) row[0]).format(DATE_FMT);
            long count = row[1] instanceof Number n ? n.longValue() : 0L;
            countMap.put(dateKey, count);
        }

        // Fill every day in the range (0 for missing days)
        List<DailyStatDto> result = new ArrayList<>(days);
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            String key = d.format(DATE_FMT);
            result.add(new DailyStatDto(
                    key,
                    durationMap.getOrDefault(key, 0),
                    countMap.getOrDefault(key, 0L)
            ));
        }

        return result;
    }
}
