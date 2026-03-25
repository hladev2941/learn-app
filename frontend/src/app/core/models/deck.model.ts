export interface Deck {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  cardCount: number;
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
}

export interface ReviewRequest {
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
  reviewDurationMs: number;
}
