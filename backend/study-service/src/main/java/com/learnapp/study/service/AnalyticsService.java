package com.learnapp.study.service;

import com.learnapp.study.dto.DailyStatDto;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {

    /**
     * Returns daily study stats for the given user over the last N days.
     *
     * @param userId   the authenticated user's ID
     * @param days     number of days to look back (1–90)
     * @param timezone IANA timezone string (e.g. "Asia/Ho_Chi_Minh")
     * @return list of DailyStatDto sorted ascending by date, all days filled in
     */
    List<DailyStatDto> getDailyStudyStats(UUID userId, int days, String timezone);
}
