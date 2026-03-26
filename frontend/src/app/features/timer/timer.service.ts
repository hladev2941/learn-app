import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SessionResult {
  sessionId: string;
  durationSecs: number;
  streak: { currentStreak: number; longestStreak: number; lastStudyDate: string } | null;
  reward: { xpGranted: number; coinGranted: number; badgeName: string | null } | null;
}

export interface TodayStats {
  totalSeconds: number;
  sessionCount: number;
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  completeSession(durationSecs: number, sessionType: 'POMODORO' | 'CUSTOM', startedAt: Date, endedAt: Date): Observable<SessionResult> {
    return this.http.post<{ success: boolean; data: SessionResult }>(`${this.base}/sessions/complete`, {
      durationSecs,
      sessionType,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    }).pipe(map(r => r.data));
  }

  getTodayStats(): Observable<TodayStats> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.get<{ success: boolean; data: TodayStats }>(`${this.base}/sessions/today/stats`, {
      params: { timezone: tz }
    }).pipe(map(r => r.data));
  }
}
