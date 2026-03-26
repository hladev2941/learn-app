import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReviewCard {
  id: string;
  deckId: string;
  frontText: string;
  frontImageUrl?: string;
  backText: string;
  backImageUrl?: string;
  fsrsState: number;
  nextReviewDate?: string;
  tags: string[];
  source?: string | null;
  contentFormat?: string;
}

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getDueCards(subjectId?: string): Observable<ReviewCard[]> {
    const url = subjectId
      ? `${this.base}/reviews/due?subjectId=${subjectId}`
      : `${this.base}/reviews/due`;
    return this.http.get<ApiResponse<ReviewCard[]>>(url).pipe(map(r => r.data));
  }

  getDueCount(): Observable<number> {
    return this.http.get<ApiResponse<number>>(`${this.base}/reviews/due/count`)
      .pipe(map(r => r.data));
  }

  submitReview(cardId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY', durationMs: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reviews`, {
      cardId,
      rating,
      reviewDurationMs: durationMs,
    }).pipe(map(() => undefined));
  }
}
