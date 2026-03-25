package com.learnapp.study.repository;

import com.learnapp.study.entity.Streak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StreakRepository extends JpaRepository<Streak, UUID> {

    /** Find users with active streak who haven't studied today — used by StreakWarningScheduler. */
    @Query("SELECT s FROM Streak s WHERE s.currentStreak > 0 AND (s.lastStudyDate IS NULL OR s.lastStudyDate < :today)")
    List<Streak> findUsersWithActiveStreakNotStudiedToday(@Param("today") LocalDate today);
}
