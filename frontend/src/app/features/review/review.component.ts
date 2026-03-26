import {
  Component, inject, signal, computed, OnInit, OnDestroy, HostListener
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReviewService, ReviewCard } from './review.service';
import { environment } from '../../../environments/environment';

type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

interface SessionResult { again: number; hard: number; good: number; easy: number; }
interface SubjectItem { id: string; name: string; emoji: string; dueCardCount: number; }
interface ApiResponse<T> { success: boolean; data: T; }

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .page {
      padding: 32px;
      max-width: 760px;
      margin: 0 auto;
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 640px) { .page { padding: 16px; } }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
    }
    .page-icon {
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 15px;
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white; flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(16,185,129,0.3);
    }
    .page-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -0.02em; }
    .page-sub { font-size: 0.875rem; color: #94a3b8; margin: 3px 0 0; }

    /* ── Subject filter ── */
    .filter-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .filter-label { font-size: 0.8rem; font-weight: 600; color: #64748b; white-space: nowrap; }
    .subject-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 14px; border-radius: 20px; cursor: pointer;
      font-size: 0.8125rem; font-weight: 600;
      border: 1.5px solid transparent;
      transition: all 0.15s;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(12px);
      color: #475569;
      border-color: rgba(148,163,184,0.25);
    }
    .chip:hover { border-color: rgba(16,185,129,0.4); color: #059669; }
    .chip.active {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white; border-color: transparent;
      box-shadow: 0 2px 10px rgba(16,185,129,0.3);
    }
    .chip-due {
      font-size: 0.7rem; font-weight: 700;
      background: rgba(239,68,68,0.15); color: #dc2626;
      padding: 1px 7px; border-radius: 20px;
    }
    .chip.active .chip-due {
      background: rgba(255,255,255,0.25); color: white;
    }

    /* ── Progress bar ── */
    .progress-wrap { margin-bottom: 28px; }
    .progress-meta {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .progress-text { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
    .progress-count { font-size: 0.8125rem; color: #94a3b8; }
    .progress-bar {
      height: 6px; border-radius: 999px;
      background: rgba(203,213,225,0.5);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 999px;
      transition: width 0.4s ease;
    }

    /* ── Card scene ── */
    .card-scene {
      flex: 1;
      display: flex; flex-direction: column; align-items: center;
      gap: 28px;
    }

    .flip-scene {
      width: 100%; max-width: 680px;
      height: 320px;
      perspective: 1200px;
      cursor: pointer;
    }
    @media (max-width: 640px) { .flip-scene { height: 260px; } }

    .flip-card {
      width: 100%; height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .flip-card.flipped { transform: rotateY(180deg); }

    .flip-face {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 24px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 32px 40px;
      text-align: center;
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.85);
      box-shadow: 0 8px 32px rgba(99,102,241,0.10), inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .flip-face.back {
      transform: rotateY(180deg);
      background: rgba(240,253,250,0.9);
      border-color: rgba(16,185,129,0.2);
      box-shadow: 0 8px 32px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
    }

    .face-label {
      font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; margin-bottom: 16px;
    }
    .face-label.front-lbl { color: #a5b4fc; }
    .face-label.back-lbl  { color: #6ee7b7; }

    .card-text {
      font-size: 1.375rem; font-weight: 600; color: #1e1b4b;
      line-height: 1.45;
      word-break: break-word;
    }

    .hint-tap {
      position: absolute; bottom: 16px;
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; color: #cbd5e1; font-weight: 500;
    }
    .hint-tap mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ── Tags ── */
    .tags-row {
      display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
    }
    .tag {
      font-size: 0.6875rem; font-weight: 600; padding: 3px 10px;
      background: rgba(99,102,241,0.08); color: #6366f1;
      border-radius: 20px; border: 1px solid rgba(99,102,241,0.12);
    }

    /* ── Keyboard shortcut hint bar ── */
    .kbd-hint-bar {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;
      padding: 10px 20px; border-radius: 12px;
      background: rgba(241,245,249,0.7);
      border: 1px solid rgba(203,213,225,0.4);
      font-size: 0.75rem; color: #94a3b8; font-weight: 500;
    }
    .kbd-hint { display: flex; align-items: center; gap: 5px; }
    kbd {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 6px;
      background: white; border: 1px solid #cbd5e1;
      border-radius: 5px; font-size: 0.7rem; font-weight: 700; color: #475569;
      box-shadow: 0 1px 0 #cbd5e1;
      font-family: inherit;
    }

    /* ── Rating buttons ── */
    .rating-section {
      width: 100%; max-width: 680px;
    }
    .rating-label {
      font-size: 0.75rem; font-weight: 600; color: #94a3b8;
      text-align: center; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 12px;
    }
    .rating-buttons {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    }
    @media (max-width: 480px) {
      .rating-buttons { grid-template-columns: repeat(2, 1fr); }
    }

    .rate-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; padding: 14px 8px;
      border: 2px solid transparent;
      border-radius: 16px; cursor: pointer;
      font-family: inherit; transition: all 0.18s;
      position: relative; overflow: hidden;
    }
    .rate-btn:hover { transform: translateY(-2px); }
    .rate-btn:active { transform: translateY(0); }

    .rate-btn .btn-emoji { font-size: 22px; line-height: 1; }
    .rate-btn .btn-label {
      font-size: 0.8125rem; font-weight: 700;
    }
    .rate-btn .btn-interval {
      font-size: 0.6875rem; font-weight: 500;
    }
    .rate-btn .btn-key {
      position: absolute; top: 6px; right: 8px;
      font-size: 0.6rem; font-weight: 700;
      background: rgba(255,255,255,0.5);
      border: 1px solid currentColor;
      border-radius: 4px; padding: 1px 5px; opacity: 0.6;
    }

    .btn-again {
      background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.18); color: #dc2626;
    }
    .btn-again:hover { background: rgba(239,68,68,0.14); box-shadow: 0 4px 16px rgba(239,68,68,0.18); }

    .btn-hard {
      background: rgba(249,115,22,0.07); border-color: rgba(249,115,22,0.18); color: #ea580c;
    }
    .btn-hard:hover { background: rgba(249,115,22,0.14); box-shadow: 0 4px 16px rgba(249,115,22,0.18); }

    .btn-good {
      background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.18); color: #059669;
    }
    .btn-good:hover { background: rgba(16,185,129,0.14); box-shadow: 0 4px 16px rgba(16,185,129,0.18); }

    .btn-easy {
      background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.18); color: #4f46e5;
    }
    .btn-easy:hover { background: rgba(99,102,241,0.14); box-shadow: 0 4px 16px rgba(99,102,241,0.18); }

    /* ── Reveal button ── */
    .reveal-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 36px; border: none; border-radius: 16px; cursor: pointer;
      font-family: inherit; font-size: 0.9375rem; font-weight: 600;
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white; box-shadow: 0 4px 16px rgba(16,185,129,0.3);
      transition: all 0.2s;
    }
    .reveal-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(16,185,129,0.4);
    }
    .reveal-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* ── Loading ── */
    .loading-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; flex: 1; padding: 60px 24px;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(16,185,129,0.15);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }

    /* ── Empty state ── */
    .empty-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; flex: 1; padding: 64px 24px; text-align: center;
    }
    .empty-icon-big {
      width: 80px; height: 80px; border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.06));
      margin-bottom: 4px;
    }
    .empty-icon-big mat-icon { font-size: 36px; width: 36px; height: 36px; color: #10b981; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: #1e1b4b; margin: 0; }
    .empty-desc { font-size: 0.875rem; color: #64748b; margin: 0; max-width: 300px; line-height: 1.6; }
    .btn-outline {
      display: flex; align-items: center; gap: 6px;
      margin-top: 8px; padding: 10px 20px;
      border: 1.5px solid rgba(99,102,241,0.25);
      background: rgba(238,242,255,0.6);
      color: #6366f1; border-radius: 12px; cursor: pointer;
      font-family: inherit; font-size: 0.875rem; font-weight: 600;
      transition: all 0.18s;
    }
    .btn-outline:hover { background: rgba(99,102,241,0.1); }

    /* ── Done screen ── */
    .done-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 20px; flex: 1; padding: 40px 24px; text-align: center;
    }
    .done-trophy { font-size: 64px; line-height: 1; }
    .done-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; }
    .done-sub { font-size: 0.9rem; color: #64748b; margin: 0; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 12px; width: 100%; max-width: 520px;
    }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

    .stat-card {
      padding: 16px 12px; border-radius: 16px; text-align: center;
      background: rgba(255,255,255,0.8);
      border: 1px solid rgba(255,255,255,0.9);
      backdrop-filter: blur(12px);
    }
    .stat-num { font-size: 1.75rem; font-weight: 800; line-height: 1; }
    .stat-lbl { font-size: 0.6875rem; font-weight: 600; margin-top: 4px; opacity: 0.7; }
    .stat-again { color: #dc2626; }
    .stat-hard  { color: #ea580c; }
    .stat-good  { color: #059669; }
    .stat-easy  { color: #4f46e5; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 32px; border: none; border-radius: 16px; cursor: pointer;
      font-family: inherit; font-size: 0.9375rem; font-weight: 600;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; box-shadow: 0 4px 16px rgba(99,102,241,0.3);
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.4); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="page-icon">
          <mat-icon>quiz</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Ôn tập thẻ</h1>
          <p class="page-sub">Ôn lại các thẻ đến hạn hôm nay</p>
        </div>
      </div>

      <!-- Subject filter -->
      @if (subjects().length > 0) {
        <div class="filter-row">
          <span class="filter-label">Bộ môn:</span>
          <div class="subject-chips">
            <button
              class="chip"
              [class.active]="selectedSubjectId() === null"
              (click)="selectSubject(null)"
            >
              <mat-icon style="font-size:14px;width:14px;height:14px;">all_inclusive</mat-icon>
              Tất cả
            </button>
            @for (s of subjects(); track s.id) {
              <button
                class="chip"
                [class.active]="selectedSubjectId() === s.id"
                (click)="selectSubject(s.id)"
              >
                {{ s.emoji }} {{ s.name }}
                @if (s.dueCardCount > 0) {
                  <span class="chip-due">{{ s.dueCardCount }}</span>
                }
              </button>
            }
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <p class="loading-text">Đang tải thẻ ôn tập...</p>
        </div>
      } @else if (!loading() && cards().length === 0 && !done()) {
        <div class="empty-wrap">
          <div class="empty-icon-big">
            <mat-icon>check_circle</mat-icon>
          </div>
          <p class="empty-title">Tuyệt vời! Không còn thẻ nào đến hạn</p>
          <p class="empty-desc">
            {{ selectedSubjectId() ? 'Bộ môn này không có thẻ nào đến hạn hôm nay.' : 'Bạn đã ôn tập hết tất cả các thẻ hôm nay. Quay lại vào ngày mai nhé!' }}
          </p>
          <button class="btn-outline" (click)="goToDeck()">
            <mat-icon>style</mat-icon>
            Xem bộ thẻ
          </button>
        </div>
      } @else if (done()) {
        <div class="done-wrap">
          <div class="done-trophy">🎉</div>
          <p class="done-title">Hoàn thành phiên ôn tập!</p>
          <p class="done-sub">Bạn đã ôn tập {{ totalReviewed() }} thẻ hôm nay</p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-num stat-again">{{ results().again }}</div>
              <div class="stat-lbl stat-again">Lại</div>
            </div>
            <div class="stat-card">
              <div class="stat-num stat-hard">{{ results().hard }}</div>
              <div class="stat-lbl stat-hard">Khó</div>
            </div>
            <div class="stat-card">
              <div class="stat-num stat-good">{{ results().good }}</div>
              <div class="stat-lbl stat-good">Tốt</div>
            </div>
            <div class="stat-card">
              <div class="stat-num stat-easy">{{ results().easy }}</div>
              <div class="stat-lbl stat-easy">Dễ</div>
            </div>
          </div>

          <button class="btn-primary" (click)="goToDeck()">
            <mat-icon>home</mat-icon>
            Về trang chủ
          </button>
        </div>
      } @else if (currentCard()) {
        <!-- Progress -->
        <div class="progress-wrap">
          <div class="progress-meta">
            <span class="progress-text">Tiến độ</span>
            <span class="progress-count">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progressPct()"></div>
          </div>
        </div>

        <div class="card-scene">
          <!-- Flip card -->
          <div class="flip-scene" (click)="flip()">
            <div class="flip-card" [class.flipped]="flipped()">

              <!-- Front -->
              <div class="flip-face front">
                <span class="face-label front-lbl">Câu hỏi</span>
                <p class="card-text">{{ currentCard()!.frontText }}</p>
                @if (!flipped()) {
                  <div class="hint-tap">
                    <mat-icon>touch_app</mat-icon>
                    Chạm hoặc nhấn <kbd style="margin:0 3px;">Space</kbd> để xem đáp án
                  </div>
                }
              </div>

              <!-- Back -->
              <div class="flip-face back">
                <span class="face-label back-lbl">Đáp án</span>
                <p class="card-text">{{ currentCard()!.backText }}</p>
              </div>

            </div>
          </div>

          <!-- Tags -->
          @if (currentCard()!.tags.length > 0) {
            <div class="tags-row">
              @for (tag of currentCard()!.tags; track tag) {
                <span class="tag"># {{ tag }}</span>
              }
            </div>
          }

          <!-- Reveal / Rating -->
          @if (!flipped()) {
            <button class="reveal-btn" (click)="flip(); $event.stopPropagation()">
              <mat-icon>flip</mat-icon>
              Xem đáp án
            </button>

            <!-- Keyboard hint (before flip) -->
            <div class="kbd-hint-bar">
              <div class="kbd-hint"><kbd>Space</kbd> Lật thẻ</div>
            </div>
          } @else {
            <div class="rating-section">
              <p class="rating-label">Bạn nhớ bài này như thế nào?</p>
              <div class="rating-buttons">
                <button class="rate-btn btn-again" (click)="rate('AGAIN')">
                  <span class="btn-key">1</span>
                  <span class="btn-emoji">😓</span>
                  <span class="btn-label">Lại</span>
                  <span class="btn-interval">+1 ngày</span>
                </button>
                <button class="rate-btn btn-hard" (click)="rate('HARD')">
                  <span class="btn-key">2</span>
                  <span class="btn-emoji">😅</span>
                  <span class="btn-label">Khó</span>
                  <span class="btn-interval">+3 ngày</span>
                </button>
                <button class="rate-btn btn-good" (click)="rate('GOOD')">
                  <span class="btn-key">3</span>
                  <span class="btn-emoji">😊</span>
                  <span class="btn-label">Tốt</span>
                  <span class="btn-interval">+7 ngày</span>
                </button>
                <button class="rate-btn btn-easy" (click)="rate('EASY')">
                  <span class="btn-key">4</span>
                  <span class="btn-emoji">🚀</span>
                  <span class="btn-label">Dễ</span>
                  <span class="btn-interval">+14 ngày</span>
                </button>
              </div>
            </div>

            <!-- Keyboard hint (after flip) -->
            <div class="kbd-hint-bar">
              <div class="kbd-hint"><kbd>1</kbd> Lại</div>
              <div class="kbd-hint"><kbd>2</kbd> Khó</div>
              <div class="kbd-hint"><kbd>3</kbd> Tốt</div>
              <div class="kbd-hint"><kbd>4</kbd> Dễ</div>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class ReviewComponent implements OnInit, OnDestroy {
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private http = inject(HttpClient);

  protected loading = signal(true);
  protected cards = signal<ReviewCard[]>([]);
  protected currentIndex = signal(0);
  protected flipped = signal(false);
  protected done = signal(false);
  protected results = signal<SessionResult>({ again: 0, hard: 0, good: 0, easy: 0 });
  protected subjects = signal<SubjectItem[]>([]);
  protected selectedSubjectId = signal<string | null>(null);

  protected currentCard = computed(() => this.cards()[this.currentIndex()] ?? null);
  protected progressPct = computed(() =>
    this.cards().length === 0 ? 0 : (this.currentIndex() / this.cards().length) * 100
  );
  protected totalReviewed = computed(() => {
    const r = this.results();
    return r.again + r.hard + r.good + r.easy;
  });

  private cardStartMs = 0;

  ngOnInit(): void {
    this.loadSubjects();
    this.loadCards();
  }

  ngOnDestroy(): void {}

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    // Ignore when typing in input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (this.loading() || this.done()) return;

    switch (event.key) {
      case ' ':
      case 'Space':
        event.preventDefault();
        if (!this.flipped()) this.flip();
        break;
      case '1':
        if (this.flipped()) this.rate('AGAIN');
        break;
      case '2':
        if (this.flipped()) this.rate('HARD');
        break;
      case '3':
        if (this.flipped()) this.rate('GOOD');
        break;
      case '4':
        if (this.flipped()) this.rate('EASY');
        break;
    }
  }

  // ── Load subjects for filter ───────────────────────────────────────────────
  private loadSubjects(): void {
    this.http.get<ApiResponse<SubjectItem[]>>(`${environment.apiUrl}/subjects`).subscribe({
      next: res => this.subjects.set((res.data ?? []).filter(s => s.dueCardCount > 0)),
      error: () => {},
    });
  }

  // ── Select subject filter ──────────────────────────────────────────────────
  protected selectSubject(id: string | null): void {
    if (this.selectedSubjectId() === id) return;
    this.selectedSubjectId.set(id);
    this.resetSession();
    this.loadCards();
  }

  // ── Load due cards (with optional subject filter) ──────────────────────────
  private loadCards(): void {
    this.loading.set(true);
    const subjectId = this.selectedSubjectId() ?? undefined;
    this.reviewService.getDueCards(subjectId).subscribe({
      next: cards => {
        this.cards.set(cards);
        this.loading.set(false);
        this.cardStartMs = Date.now();
      },
      error: () => this.loading.set(false),
    });
  }

  private resetSession(): void {
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.done.set(false);
    this.results.set({ again: 0, hard: 0, good: 0, easy: 0 });
  }

  protected flip(): void {
    this.flipped.set(true);
  }

  protected rate(rating: Rating): void {
    const card = this.currentCard();
    if (!card) return;

    const durationMs = Date.now() - this.cardStartMs;
    this.reviewService.submitReview(card.id, rating, durationMs).subscribe();

    const r = this.results();
    this.results.set({
      ...r,
      [rating.toLowerCase()]: r[rating.toLowerCase() as keyof SessionResult] + 1,
    });

    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.cards().length) {
      this.done.set(true);
    } else {
      this.currentIndex.set(nextIndex);
      this.flipped.set(false);
      this.cardStartMs = Date.now();
    }
  }

  protected goToDeck(): void {
    this.router.navigate(['/deck']);
  }
}
