package com.learnapp.study.service.impl;

import com.learnapp.study.dto.CompleteSessionRequest;
import com.learnapp.study.dto.SessionCompletedResponse;
import com.learnapp.study.dto.StreakResponse;
import com.learnapp.study.dto.RewardGrantedResponse;
import com.learnapp.study.entity.BadgeDefinition;
import com.learnapp.study.entity.StudySession;
import com.learnapp.study.feign.AuthFeignClient;
import com.learnapp.study.repository.StudySessionRepository;
import com.learnapp.study.service.BadgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl {

    private final StudySessionRepository sessionRepository;
    private final StreakServiceImpl streakService;
    private final RewardServiceImpl rewardService;
    private final BadgeService badgeService;
    private final AuthFeignClient authFeignClient;

    @Transactional
    public SessionCompletedResponse completeSession(UUID userId, CompleteSessionRequest request) {
        // 1. Get user timezone from auth-service
        String timezone = "Asia/Ho_Chi_Minh";
        try {
            timezone = authFeignClient.getUserTimezone(userId);
        } catch (Exception e) {
            log.warn("Could not fetch timezone for user {}", userId);
        }

        LocalDate studyDate = request.startedAt().atZone(ZoneId.of(timezone)).toLocalDate();

        // 2. Save session
        StudySession session = StudySession.builder()
                .userId(userId)
                .durationSecs(request.durationSecs())
                .sessionType(request.sessionType())
                .studyDate(studyDate)
                .startedAt(request.startedAt())
                .endedAt(request.endedAt())
                .completed(true)
                .build();
        session = sessionRepository.save(session);

        // 3. Update streak
        StreakResponse streak = streakService.updateAfterSession(userId);

        // 4. Grant XP/coin reward
        RewardGrantedResponse reward = rewardService.grantSessionReward(userId, session.getId());

        // 5. Check and grant badges
        String badgeCode = null;
        try {
            badgeCode = badgeService.checkAndGrantBadges(
                    userId, session.getId(), session.getSessionType(),
                    streak.currentStreak(), session.getDurationSecs(),
                    session.getStartedAt(), timezone
            );
        } catch (Exception e) {
            log.warn("Badge check failed for user {}: {}", userId, e.getMessage());
        }

        // Merge badge into reward response if a new badge was earned
        if (badgeCode != null) {
            BadgeDefinition def = BadgeDefinition.fromCode(badgeCode);
            reward = new RewardGrantedResponse(
                    reward.rewardType(), reward.xpGranted(), reward.coinGranted(),
                    badgeCode, def != null ? def.name : null
            );
        }

        return new SessionCompletedResponse(session.getId(), session.getDurationSecs(), streak, reward);
    }

    public long getTodayStudySeconds(UUID userId, String timezone) {
        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        return sessionRepository.sumDurationByUserAndDate(userId, today);
    }

    public long getTodaySessionCount(UUID userId, String timezone) {
        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        return sessionRepository.countCompletedByUserAndDate(userId, today);
    }
}
