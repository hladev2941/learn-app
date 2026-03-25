export interface StudySession {
  id: string;
  durationSecs: number;
  sessionType: string;
  completed: boolean;
  studyDate: string;
  startedAt: string;
  endedAt: string;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

export interface UserGoal {
  goalStudyMinutesPerDay: number;
  goalCardsPerDay: number;
}

export interface CompleteSessionRequest {
  durationSecs: number;
  sessionType: 'POMODORO' | 'FREE';
  studyDate: string;
  startedAt: string;
  endedAt: string;
}
