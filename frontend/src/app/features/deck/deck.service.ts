import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { ApiResponse } from '../../core/models/api.model';
import { Card, Deck, Subject } from '../../core/models/deck.model';
import { environment } from '../../../environments/environment';

export interface CreateSubjectRequest {
  name: string;
  emoji?: string;
  color?: string;
  reminderEnabled: boolean;
  reminderType?: string;      // "MINUTES" | "HOURS" | "DAILY" | "WEEKLY"
  reminderInterval?: number;  // for MINUTES/HOURS
  reminderTime?: string;      // "HH:mm" for DAILY/WEEKLY
  reminderDays?: string[];    // ["MON","WED"] for WEEKLY
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  coverColor?: string;
  subjectId?: string;
}

export interface CreateCardRequest {
  deckId: string;
  frontText: string;
  frontImageUrl?: string;
  backText: string;
  backImageUrl?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class DeckService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  subjects = signal<Subject[]>([]);
  decks = signal<Deck[]>([]);
  loading = signal(false);

  // ─── Subjects ───
  loadSubjects() {
    this.loading.set(true);
    return this.http.get<ApiResponse<Subject[]>>(`${this.base}/subjects`).pipe(
      tap({
        next: res => { this.subjects.set(res.data); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      })
    );
  }

  createSubject(req: CreateSubjectRequest) {
    return this.http.post<ApiResponse<Subject>>(`${this.base}/subjects`, req).pipe(
      tap(res => this.subjects.update(list => [res.data, ...list]))
    );
  }

  updateSubject(subjectId: string, req: CreateSubjectRequest) {
    return this.http.patch<ApiResponse<Subject>>(`${this.base}/subjects/${subjectId}`, req).pipe(
      tap(res => this.subjects.update(list => list.map(s => s.id === subjectId ? res.data : s)))
    );
  }

  deleteSubject(subjectId: string) {
    return this.http.delete<void>(`${this.base}/subjects/${subjectId}`).pipe(
      tap(() => this.subjects.update(list => list.filter(s => s.id !== subjectId)))
    );
  }

  // ─── Decks ───
  loadDecksBySubject(subjectId: string) {
    this.loading.set(true);
    return this.http.get<ApiResponse<Deck[]>>(`${this.base}/subjects/${subjectId}/decks`).pipe(
      tap({
        next: res => { this.decks.set(res.data); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      })
    );
  }

  createDeck(req: CreateDeckRequest) {
    return this.http.post<ApiResponse<Deck>>(`${this.base}/decks`, req).pipe(
      tap(res => this.decks.update(list => [res.data, ...list]))
    );
  }

  updateDeck(deckId: string, req: Partial<CreateDeckRequest>) {
    return this.http.patch<ApiResponse<Deck>>(`${this.base}/decks/${deckId}`, req).pipe(
      tap(res => this.decks.update(list => list.map(d => d.id === deckId ? res.data : d)))
    );
  }

  deleteDeck(deckId: string) {
    return this.http.delete<void>(`${this.base}/decks/${deckId}`).pipe(
      tap(() => this.decks.update(list => list.filter(d => d.id !== deckId)))
    );
  }

  // ─── Cards ───
  getCards(deckId: string) {
    return this.http.get<ApiResponse<Card[]>>(`${this.base}/decks/${deckId}/cards`);
  }

  createCard(deckId: string, req: CreateCardRequest) {
    return this.http.post<ApiResponse<Card>>(`${this.base}/decks/${deckId}/cards`, req);
  }

  updateCard(deckId: string, cardId: string, req: Partial<CreateCardRequest>) {
    return this.http.patch<ApiResponse<Card>>(`${this.base}/decks/${deckId}/cards/${cardId}`, req);
  }

  deleteCard(deckId: string, cardId: string) {
    return this.http.delete<void>(`${this.base}/decks/${deckId}/cards/${cardId}`);
  }
}
