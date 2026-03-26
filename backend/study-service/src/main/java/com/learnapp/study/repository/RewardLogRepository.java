package com.learnapp.study.repository;

import com.learnapp.study.entity.RewardLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardLogRepository extends JpaRepository<RewardLog, UUID> {

    List<RewardLog> findTop10ByUserIdOrderByRewardedAtDesc(UUID userId);

    /** Returns [badgeCode, earnedAt] for all badges the user has earned. */
    @Query("SELECT r.badgeCode, MIN(r.rewardedAt) FROM RewardLog r " +
           "WHERE r.userId = :userId AND r.rewardType = 'BADGE' " +
           "GROUP BY r.badgeCode")
    List<Object[]> findEarnedBadgesByUser(UUID userId);
}
