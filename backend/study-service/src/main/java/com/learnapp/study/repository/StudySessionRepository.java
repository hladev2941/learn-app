package com.learnapp.study.repository;

import com.learnapp.study.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    List<StudySession> findByUserIdAndStudyDateOrderByStartedAtDesc(UUID userId, LocalDate date);

    @Query("SELECT COALESCE(SUM(s.durationSecs), 0) FROM StudySession s WHERE s.userId = :userId AND s.studyDate = :date AND s.completed = true")
    int sumDurationByUserAndDate(UUID userId, LocalDate date);

    @Query("SELECT COUNT(s) FROM StudySession s WHERE s.userId = :userId AND s.studyDate = :date AND s.completed = true")
    long countCompletedByUserAndDate(UUID userId, LocalDate date);

    @Query("SELECT s.studyDate, COALESCE(SUM(s.durationSecs), 0) FROM StudySession s WHERE s.userId = :userId AND s.studyDate BETWEEN :from AND :to AND s.completed = true GROUP BY s.studyDate ORDER BY s.studyDate")
    List<Object[]> findDailyStudyStats(UUID userId, LocalDate from, LocalDate to);
}
