package com.learnapp.study.dto;

import java.util.UUID;

public record SessionCompletedResponse(
        UUID sessionId,
        int durationSecs,
        StreakResponse streak,
        RewardGrantedResponse reward
) {}
