package com.learnapp.auth.dto;

// Dùng cho internal API — study-service gọi để cộng XP/coin sau session
public record UpdateBalanceRequest(int xpDelta, int coinDelta) {}
