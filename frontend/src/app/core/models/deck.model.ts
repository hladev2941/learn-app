export type ReminderType = 'MINUTES' | 'HOURS' | 'DAILY' | 'WEEKLY';

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: string;
  reminderEnabled: boolean;
  reminderType: ReminderType | null;
  reminderInterval: number | null;
  reminderTime: string | null;
  reminderDays: string[];
  deckCount: number;
  totalCardCount: number;
  dueCardCount: number;
  masteredCardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  subjectId: string | null;
  name: string;
  description: string | null;
  coverColor: string;
  cardCount: number;
  dueCardCount: number;
  masteredCardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  frontText: string | null;
  frontImageUrl: string | null;
  backText: string | null;
  backImageUrl: string | null;
  nextReviewDate: string | null;
  lastReviewDate: string | null;
  fsrsState: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source?: string | null;
  contentFormat?: string;
}

export interface ReviewRequest {
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
  reviewDurationMs: number;
}
