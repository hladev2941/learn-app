import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api.model';
import { User } from '../../core/models/auth.model';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  studiedToday: boolean;
}

export interface TodayStats {
  totalSeconds: number;
  sessionCount: number;
}

export interface DailyStat {
  date: string;
  totalSeconds: number;
  sessionCount: number;
}

export interface GoalProgress {
  goalStudyMinutesPerDay: number;
  goalCardsPerDay: number;
  actualStudyMinutesToday: number;
  actualSessionsToday: number;
  progressStudyPercent: number;
  studyGoalMet: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** GET /streaks/me */
  getStreaks(): Observable<StreakData> {
    return this.http
      .get<ApiResponse<StreakData>>(`${this.base}/streaks/me`)
      .pipe(map(r => r.data));
  }

  /** GET /sessions/today/stats?timezone=... */
  getTodayStats(timezone: string): Observable<TodayStats> {
    return this.http
      .get<ApiResponse<TodayStats>>(`${this.base}/sessions/today/stats`, {
        params: { timezone },
      })
      .pipe(map(r => r.data));
  }

  /** GET /reviews/due/count */
  getDueCount(): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.base}/reviews/due/count`)
      .pipe(map(r => r.data));
  }

  /** GET /users/me */
  getProfile(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.base}/users/me`)
      .pipe(map(r => r.data));
  }

  /** GET /goals/me — returns goal + today's actual progress */
  getGoalProgress(): Observable<GoalProgress> {
    return this.http
      .get<ApiResponse<GoalProgress>>(`${this.base}/goals/me`)
      .pipe(map(r => r.data));
  }

  /** GET /analytics/study?days=365 — yearly activity for heatmap */
  getYearlyActivity(timezone: string): Observable<DailyStat[]> {
    return this.http
      .get<ApiResponse<DailyStat[]>>(`${this.base}/analytics/study`, {
        params: { days: 365, timezone },
      })
      .pipe(map(r => r.data));
  }
}
