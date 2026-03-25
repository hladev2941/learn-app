package com.learnapp.study.dto;

public record RewardGrantedResponse(
        String rewardType,   // XP, COIN, BADGE
        int xpGranted,
        int coinGranted,
        String badgeCode,    // null nếu không có badge
        String badgeName
) {}
