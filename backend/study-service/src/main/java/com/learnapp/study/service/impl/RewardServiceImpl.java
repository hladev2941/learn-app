package com.learnapp.study.service.impl;

import com.learnapp.study.dto.RewardGrantedResponse;
import com.learnapp.study.entity.RewardLog;
import com.learnapp.study.feign.AuthFeignClient;
import com.learnapp.study.repository.RewardLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RewardServiceImpl {

    private final RewardLogRepository rewardLogRepository;
    private final AuthFeignClient authFeignClient;

    private static final Random RANDOM = new Random();

    // XP range per session
    private static final int XP_MIN = 10;
    private static final int XP_MAX = 30;

    // Coin chance and range
    private static final double COIN_CHANCE = 0.4;
    private static final int COIN_MIN = 5;
    private static final int COIN_MAX = 20;

    @Transactional
    public RewardGrantedResponse grantSessionReward(UUID userId, UUID sessionId) {
        int xp   = XP_MIN + RANDOM.nextInt(XP_MAX - XP_MIN + 1);
        int coin = RANDOM.nextDouble() < COIN_CHANCE
                   ? COIN_MIN + RANDOM.nextInt(COIN_MAX - COIN_MIN + 1)
                   : 0;

        // Persist reward log
        rewardLogRepository.save(RewardLog.builder()
                .userId(userId)
                .sessionId(sessionId)
                .rewardType("XP")
                .rewardValue(xp)
                .build());

        if (coin > 0) {
            rewardLogRepository.save(RewardLog.builder()
                    .userId(userId)
                    .sessionId(sessionId)
                    .rewardType("COIN")
                    .rewardValue(coin)
                    .build());
        }

        // Update user balance via auth-service Feign call
        try {
            authFeignClient.updateBalance(userId, new AuthFeignClient.BalanceRequest(xp, coin));
        } catch (Exception e) {
            log.error("Failed to update balance for user {}: {}", userId, e.getMessage());
        }

        return new RewardGrantedResponse("XP", xp, coin, null, null);
    }
}
