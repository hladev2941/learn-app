package com.learnapp.study.repository;

import com.learnapp.study.entity.RewardLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardLogRepository extends JpaRepository<RewardLog, UUID> {
    List<RewardLog> findTop10ByUserIdOrderByRewardedAtDesc(UUID userId);
}
