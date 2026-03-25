import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Card, Deck, Subject } from '../../core/models/deck.model';
import { CreateCardRequest, CreateDeckRequest, CreateSubjectRequest, DeckService } from './deck.service';

// ─── Constants ───────────────────────────────────────────────
const DECK_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#64748b',
];
const DAYS = [
  { key: 'MON', label: 'T2' }, { key: 'TUE', label: 'T3' },
  { key: 'WED', label: 'T4' }, { key: 'THU', label: 'T5' },
  { key: 'FRI', label: 'T6' }, { key: 'SAT', label: 'T7' },
  { key: 'SUN', label: 'CN' },
];
const STATE_LABELS  = ['Mới', 'Đang học', 'Ôn tập', 'Học lại'];
const STATE_CLASSES = ['state-new', 'state-learning', 'state-review', 'state-relearn'];

// ─── Styles ──────────────────────────────────────────────────
const S = `
*, *::before, *::after { box-sizing: border-box; }

.page { padding: 32px; max-width: 1100px; margin: 0 auto; }
@media (max-width: 640px) { .page { padding: 16px; } }

/* ── Header ── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
}
.hd-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.7); border: 1.5px solid rgba(199,210,254,0.7);
  cursor: pointer; color: #6366f1; transition: background .15s;
}
.back-btn:hover { background: rgba(255,255,255,0.95); }
.back-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
.page-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 15px; color: white;
  flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  font-size: 22px; line-height: 1;
}
.page-title  { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -.02em; }
.page-sub    { font-size: .875rem; color: #94a3b8; margin: 3px 0 0; }
.breadcrumb  { display: flex; align-items: center; gap: 6px; font-size: .8125rem; color: #94a3b8; }
.breadcrumb-sep { color: #c7d2fe; }
.breadcrumb-active { color: #1e1b4b; font-weight: 600; }

/* ── Buttons ── */
.btn-brand {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white;
  border: none; border-radius: 12px; padding: 10px 18px;
  font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.btn-brand:hover { opacity: .9; transform: translateY(-1px); }
.btn-brand mat-icon { font-size: 18px; width: 18px; height: 18px; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.6); color: #475569;
  border: 1.5px solid rgba(199,210,254,0.8); border-radius: 10px;
  padding: 8px 14px; font-size: .8125rem; font-weight: 500;
  cursor: pointer; transition: background .15s;
}
.btn-ghost:hover { background: rgba(255,255,255,.95); }
.btn-ghost mat-icon { font-size: 16px; width: 16px; height: 16px; }
.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  background: transparent; border: none; cursor: pointer; color: #94a3b8;
  transition: background .15s, color .15s;
}
.btn-icon:hover { background: rgba(99,102,241,.1); color: #6366f1; }
.btn-icon mat-icon { font-size: 16px; width: 16px; height: 16px; }

/* ── Glass ── */
.glass {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.8); border-radius: 20px;
  box-shadow: 0 4px 20px rgba(99,102,241,.07), inset 0 1px 0 rgba(255,255,255,.9);
}

/* ── Subject grid ── */
.subject-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
  gap: 16px; margin-bottom: 8px;
}
.subject-card {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.85); border-radius: 22px;
  box-shadow: 0 4px 20px rgba(99,102,241,.07);
  overflow: hidden; cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  display: flex; flex-direction: column;
}
.subject-card:hover { transform: translateY(-4px); box-shadow: 0 10px 36px rgba(99,102,241,.14); }

.subject-cover {
  height: 80px; display: flex; align-items: center; justify-content: center;
  font-size: 2.25rem; position: relative; flex-shrink: 0;
}
.subject-cover-overlay {
  position: absolute; inset: 0; opacity: .18;
  background: repeating-linear-gradient(45deg, rgba(255,255,255,.3) 0, rgba(255,255,255,.3) 1px, transparent 0, transparent 50%);
  background-size: 10px 10px;
}

.subject-body { padding: 14px 16px; flex: 1; }
.subject-name { font-size: .9375rem; font-weight: 700; color: #1e1b4b; margin: 0 0 4px; }
.subject-meta {
  display: flex; align-items: center; gap: 5px;
  font-size: .75rem; color: #6366f1; font-weight: 600;
}
.subject-meta mat-icon { font-size: 13px; width: 13px; height: 13px; }

.subject-footer {
  display: flex; align-items: center; padding: 8px 12px;
  border-top: 1px solid rgba(99,102,241,.06); gap: 4px;
}
.subject-footer-spacer { flex: 1; }
.reminder-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: .6875rem; font-weight: 600;
  background: rgba(99,102,241,.1); color: #6366f1;
  border-radius: 100px; padding: 2px 8px; flex-shrink: 0;
}
.reminder-badge mat-icon { font-size: 11px; width: 11px; height: 11px; }

/* ── Deck grid ── */
.deck-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap: 14px; margin-bottom: 24px;
}
.deck-card {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.85); border-radius: 18px;
  box-shadow: 0 3px 14px rgba(99,102,241,.06);
  overflow: hidden; cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  display: flex; flex-direction: column;
}
.deck-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(99,102,241,.12); }
.deck-card.active {
  border-color: rgba(99,102,241,.4);
  box-shadow: 0 0 0 2px rgba(99,102,241,.15), 0 8px 28px rgba(99,102,241,.12);
}
.deck-cover { height: 5px; }
.deck-body   { padding: 14px; flex: 1; }
.deck-name   { font-size: .875rem; font-weight: 700; color: #1e1b4b; margin: 0 0 3px; }
.deck-desc   { font-size: .75rem; color: #94a3b8; margin: 0 0 8px; line-height: 1.4; }
.deck-meta   { display: flex; align-items: center; gap: 5px; font-size: .75rem; color: #6366f1; font-weight: 600; }
.deck-meta mat-icon { font-size: 13px; width: 13px; height: 13px; }
.deck-footer { display: flex; align-items: center; padding: 6px 10px; border-top: 1px solid rgba(99,102,241,.06); }
.deck-footer-spacer { flex: 1; }

/* ── Card list panel ── */
.card-panel {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.85); border-radius: 20px;
  box-shadow: 0 4px 20px rgba(99,102,241,.07); overflow: hidden;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(99,102,241,.06);
  flex-wrap: wrap; gap: 8px;
}
.panel-header-left { display: flex; align-items: center; gap: 10px; }
.panel-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.panel-name { font-size: .9375rem; font-weight: 700; color: #1e1b4b; }
.panel-count { font-size: .75rem; color: #94a3b8; }
.panel-header-right { display: flex; gap: 6px; }
.card-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.flash-card {
  background: rgba(248,250,252,.85); border: 1px solid rgba(199,210,254,.5);
  border-radius: 13px; padding: 12px 14px;
  display: flex; align-items: flex-start; gap: 10px;
}
.flash-card:hover { background: rgba(255,255,255,.95); }
.flash-content { flex: 1; min-width: 0; }
.flash-front { font-size: .8125rem; font-weight: 600; color: #1e1b4b; margin-bottom: 3px; }
.flash-back  { font-size: .75rem; color: #64748b; line-height: 1.4; }
.flash-tags  { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px; }
.tag-pill { font-size: .6875rem; font-weight: 600; color: #6366f1; background: rgba(99,102,241,.1); border-radius: 100px; padding: 1px 7px; }
.flash-actions { display: flex; gap: 2px; flex-shrink: 0; }
.state-badge { font-size: .625rem; font-weight: 700; border-radius: 100px; padding: 2px 7px; flex-shrink: 0; align-self: flex-start; }
.state-new      { background: rgba(99,102,241,.1); color: #6366f1; }
.state-learning { background: rgba(245,158,11,.1); color: #d97706; }
.state-review   { background: rgba(16,185,129,.1); color: #059669; }
.state-relearn  { background: rgba(239,68,68,.1); color: #ef4444; }

/* ── Empty state ── */
.empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 52px 24px; text-align: center; }
.empty-icon { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 18px; }
.empty-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
.empty-title { font-size: .9375rem; font-weight: 600; color: #475569; margin: 0; }
.empty-desc  { font-size: .8125rem; color: #94a3b8; margin: 0; max-width: 300px; line-height: 1.5; }

.spinner-wrap { display: flex; justify-content: center; padding: 48px; }

/* ── Modal ── */
.overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(30,27,75,.32); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.modal {
  background: rgba(255,255,255,.97);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,.9); border-radius: 24px;
  box-shadow: 0 20px 60px rgba(30,27,75,.18);
  padding: 28px; width: 100%; max-width: 480px;
  animation: slideUp .2s cubic-bezier(.4,0,.2,1);
}
@keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
.modal-wide { max-width: 520px; }
.modal-title {
  font-size: 1.125rem; font-weight: 700; color: #1e1b4b; margin: 0 0 20px;
  display: flex; align-items: center; gap: 8px;
}
.modal-title mat-icon { color: #6366f1; font-size: 20px; width: 20px; height: 20px; }

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: .8125rem; font-weight: 600; color: #475569; margin-bottom: 5px; }
.form-input, .form-textarea, .form-select {
  width: 100%; background: rgba(248,250,252,.8);
  border: 1.5px solid rgba(199,210,254,.9); border-radius: 12px;
  padding: 9px 13px; font-size: .875rem; color: #1e1b4b;
  outline: none; transition: border-color .15s; font-family: inherit;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #6366f1; }
.form-textarea { resize: vertical; min-height: 68px; }

.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }

.emoji-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.emoji-btn {
  width: 36px; height: 36px; border-radius: 10px; font-size: 1.25rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 2px solid transparent;
  background: rgba(248,250,252,.8); transition: border-color .15s, transform .1s;
}
.emoji-btn.selected { border-color: #6366f1; transform: scale(1.1); }

.color-row { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 4px; }
.color-dot {
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
  border: 2.5px solid transparent; transition: border-color .15s, transform .1s;
}
.color-dot.selected { border-color: #1e1b4b; transform: scale(1.15); }

/* Toggle */
.toggle-row { display: flex; align-items: center; gap: 10px; }
.toggle-wrap { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.toggle-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  position: absolute; inset: 0; border-radius: 100px;
  background: rgba(199,210,254,.6); cursor: pointer; transition: background .2s;
}
.toggle-track.on { background: #6366f1; }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: white; box-shadow: 0 1px 4px rgba(0,0,0,.2);
  transition: transform .2s; pointer-events: none;
}
.toggle-thumb.on { transform: translateX(20px); }
.toggle-label { font-size: .875rem; color: #475569; font-weight: 500; }

/* Days picker */
.days-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.day-btn {
  width: 34px; height: 34px; border-radius: 50%; font-size: .75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 1.5px solid rgba(199,210,254,.7);
  background: rgba(248,250,252,.8); color: #64748b; transition: all .15s;
}
.day-btn.selected { background: #6366f1; color: white; border-color: #6366f1; }

/* Interval pill options */
.interval-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.interval-pill {
  padding: 5px 12px; border-radius: 100px; font-size: .8rem; font-weight: 600;
  cursor: pointer; border: 1.5px solid rgba(199,210,254,.7);
  background: rgba(248,250,252,.8); color: #64748b; transition: all .15s;
}
.interval-pill.selected { background: #6366f1; color: white; border-color: #6366f1; }

/* Reminder type tabs */
.reminder-tabs {
  display: flex; gap: 4px; background: rgba(241,245,249,.9);
  border-radius: 10px; padding: 3px; margin-bottom: 12px;
}
.reminder-tab {
  flex: 1; padding: 6px 4px; border-radius: 8px; border: none;
  font-size: .75rem; font-weight: 600; color: #94a3b8;
  background: transparent; cursor: pointer; transition: all .15s;
  text-align: center;
}
.reminder-tab.active { background: white; color: #6366f1; box-shadow: 0 1px 4px rgba(0,0,0,.1); }

.reminder-section {
  background: rgba(99,102,241,.04); border: 1px solid rgba(99,102,241,.1);
  border-radius: 14px; padding: 14px; margin-top: 4px;
}
.reminder-hint { font-size: .75rem; color: #94a3b8; margin: 6px 0 0; }

.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn-cancel {
  background: rgba(248,250,252,.8); color: #64748b;
  border: 1.5px solid rgba(199,210,254,.6); border-radius: 10px;
  padding: 9px 16px; font-size: .875rem; font-weight: 500; cursor: pointer;
}
.btn-cancel:hover { background: #f1f5f9; }
.btn-submit {
  background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white;
  border: none; border-radius: 10px; padding: 9px 20px;
  font-size: .875rem; font-weight: 600; cursor: pointer; transition: opacity .15s;
}
.btn-submit:hover { opacity: .9; }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }
`;

const SUBJECT_EMOJIS = ['📚','🧮','🌍','🔬','🎨','💻','🎵','📖','✏️','🏛️','⚗️','🌱'];

const REMINDER_TYPES = [
  { key: 'MINUTES', label: 'Phút' },
  { key: 'HOURS',   label: 'Giờ' },
  { key: 'DAILY',   label: 'Hằng ngày' },
  { key: 'WEEKLY',  label: 'Hằng tuần' },
];
const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];
const HOUR_OPTIONS   = [1, 2, 3, 4, 6, 8, 12];

@Component({
  selector: 'app-deck',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  styles: [S],
  template: `
    <div class="page">
      <!-- ── Header ── -->
      <div class="page-header">
        <div class="hd-left">
          @if (view() === 'decks') {
            <button class="back-btn" (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          }
          <div class="page-icon" [style.background]="headerGradient()">
            <span>{{ headerEmoji() }}</span>
          </div>
          <div>
            <h1 class="page-title">{{ headerTitle() }}</h1>
            @if (view() === 'subjects') {
              <p class="page-sub">{{ svc.subjects().length }} môn học</p>
            } @else {
              <div class="breadcrumb">
                <span>Flashcards</span>
                <span class="breadcrumb-sep">›</span>
                <span class="breadcrumb-active">{{ selectedSubject()?.name }}</span>
              </div>
            }
          </div>
        </div>
        @if (view() === 'subjects') {
          <button class="btn-brand" (click)="openCreateSubject()">
            <mat-icon>create_new_folder</mat-icon> Tạo môn học
          </button>
        } @else {
          <button class="btn-brand" (click)="openCreateDeck()">
            <mat-icon>add</mat-icon> Thêm bộ thẻ
          </button>
        }
      </div>

      <!-- Loading -->
      @if (svc.loading()) {
        <div class="spinner-wrap"><mat-spinner [diameter]="36" color="primary"></mat-spinner></div>
      }

      <!-- ── View: Subjects ── -->
      @if (!svc.loading() && view() === 'subjects') {
        @if (svc.subjects().length === 0) {
          <div class="glass">
            <div class="empty">
              <div class="empty-icon" style="background:rgba(99,102,241,.08)"><mat-icon style="color:#6366f1">folder_open</mat-icon></div>
              <p class="empty-title">Chưa có môn học nào</p>
              <p class="empty-desc">Tạo môn học để tổ chức bộ thẻ flashcard theo từng chủ đề.</p>
              <button class="btn-brand" style="margin-top:8px" (click)="openCreateSubject()">
                <mat-icon>create_new_folder</mat-icon> Tạo môn học
              </button>
            </div>
          </div>
        } @else {
          <div class="subject-grid">
            @for (sub of svc.subjects(); track sub.id) {
              <div class="subject-card" (click)="enterSubject(sub)">
                <div class="subject-cover" [style.background]="subjectGradient(sub.color)">
                  <div class="subject-cover-overlay"></div>
                  <span style="position:relative;z-index:1">{{ sub.emoji }}</span>
                </div>
                <div class="subject-body">
                  <p class="subject-name">{{ sub.name }}</p>
                  <div class="subject-meta">
                    <mat-icon>style</mat-icon>
                    {{ sub.deckCount }} bộ thẻ
                  </div>
                </div>
                <div class="subject-footer">
                  @if (sub.reminderEnabled) {
                    <span class="reminder-badge">
                      <mat-icon>notifications_active</mat-icon>
                      {{ reminderBadgeText(sub) }}
                    </span>
                  }
                  <span class="subject-footer-spacer"></span>
                  <button class="btn-icon" (click)="openEditSubject(sub, $event)"><mat-icon>edit</mat-icon></button>
                  <button class="btn-icon" (click)="confirmDeleteSubject(sub, $event)" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── View: Decks ── -->
      @if (!svc.loading() && view() === 'decks') {
        @if (svc.decks().length === 0) {
          <div class="glass">
            <div class="empty">
              <div class="empty-icon" style="background:rgba(6,182,212,.08)"><mat-icon style="color:#06b6d4">style</mat-icon></div>
              <p class="empty-title">Chưa có bộ thẻ nào</p>
              <p class="empty-desc">Tạo bộ thẻ đầu tiên trong môn "{{ selectedSubject()?.name }}".</p>
              <button class="btn-brand" style="margin-top:8px" (click)="openCreateDeck()">
                <mat-icon>add</mat-icon> Thêm bộ thẻ
              </button>
            </div>
          </div>
        } @else {
          <div class="deck-grid">
            @for (deck of svc.decks(); track deck.id) {
              <div class="deck-card" [class.active]="selectedDeck()?.id === deck.id" (click)="selectDeck(deck)">
                <div class="deck-cover" [style.background]="deck.coverColor"></div>
                <div class="deck-body">
                  <p class="deck-name">{{ deck.name }}</p>
                  @if (deck.description) { <p class="deck-desc">{{ deck.description }}</p> }
                  <div class="deck-meta"><mat-icon>credit_card</mat-icon>{{ deck.cardCount }} thẻ</div>
                </div>
                <div class="deck-footer">
                  <span class="deck-footer-spacer"></span>
                  <button class="btn-icon" (click)="openEditDeck(deck,$event)"><mat-icon>edit</mat-icon></button>
                  <button class="btn-icon" (click)="confirmDeleteDeck(deck,$event)" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Card panel -->
        @if (selectedDeck()) {
          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-header-left">
                <div class="panel-dot" [style.background]="selectedDeck()!.coverColor"></div>
                <div>
                  <div class="panel-name">{{ selectedDeck()!.name }}</div>
                  <div class="panel-count">{{ cards().length }} thẻ</div>
                </div>
              </div>
              <div class="panel-header-right">
                <button class="btn-ghost" (click)="openCreateCard()">
                  <mat-icon>add</mat-icon> Thêm thẻ
                </button>
                <button class="btn-icon" (click)="selectedDeck.set(null)"><mat-icon>close</mat-icon></button>
              </div>
            </div>

            @if (cardsLoading()) {
              <div class="spinner-wrap"><mat-spinner [diameter]="28" color="primary"></mat-spinner></div>
            } @else if (cards().length === 0) {
              <div class="empty">
                <div class="empty-icon" style="background:rgba(99,102,241,.08)"><mat-icon style="color:#6366f1">credit_card</mat-icon></div>
                <p class="empty-title">Chưa có thẻ nào</p>
                <button class="btn-brand" style="margin-top:8px" (click)="openCreateCard()">
                  <mat-icon>add</mat-icon> Thêm thẻ
                </button>
              </div>
            } @else {
              <div class="card-list">
                @for (card of cards(); track card.id) {
                  <div class="flash-card">
                    <div class="flash-content">
                      <div class="flash-front">{{ card.frontText }}</div>
                      <div class="flash-back">{{ card.backText }}</div>
                      @if (card.tags?.length) {
                        <div class="flash-tags">
                          @for (tag of card.tags; track tag) { <span class="tag-pill">{{ tag }}</span> }
                        </div>
                      }
                    </div>
                    <span class="state-badge" [class]="stateClass(card.fsrsState)">{{ stateLabel(card.fsrsState) }}</span>
                    <div class="flash-actions">
                      <button class="btn-icon" (click)="openEditCard(card)"><mat-icon>edit</mat-icon></button>
                      <button class="btn-icon" (click)="deleteCard(card)" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- ════ Subject Modal ════ -->
    @if (showSubjectModal()) {
      <div class="overlay" (click)="closeSubjectModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">
            <mat-icon>{{ editingSubject() ? 'edit' : 'create_new_folder' }}</mat-icon>
            {{ editingSubject() ? 'Chỉnh sửa môn học' : 'Tạo môn học mới' }}
          </div>

          <!-- Emoji -->
          <div class="form-group">
            <label class="form-label">Biểu tượng</label>
            <div class="emoji-row">
              @for (e of emojis; track e) {
                <div class="emoji-btn" [class.selected]="subjectForm.emoji === e"
                     (click)="subjectForm.emoji = e">{{ e }}</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tên môn học *</label>
            <input class="form-input" [(ngModel)]="subjectForm.name" placeholder="VD: Tiếng Anh, Toán học..." />
          </div>

          <div class="form-group">
            <label class="form-label">Màu sắc</label>
            <div class="color-row">
              @for (c of colors; track c) {
                <div class="color-dot" [class.selected]="subjectForm.color === c"
                     [style.background]="c" (click)="subjectForm.color = c"></div>
              }
            </div>
          </div>

          <!-- Reminder config -->
          <div class="form-group">
            <label class="form-label">Nhắc nhở học</label>
            <div class="reminder-section">
              <!-- Toggle on/off -->
              <div class="toggle-row" [style.margin-bottom]="subjectForm.reminderEnabled ? '14px' : '0'">
                <div class="toggle-wrap" (click)="subjectForm.reminderEnabled = !subjectForm.reminderEnabled">
                  <div class="toggle-track" [class.on]="subjectForm.reminderEnabled"></div>
                  <div class="toggle-thumb" [class.on]="subjectForm.reminderEnabled"></div>
                </div>
                <span class="toggle-label">{{ subjectForm.reminderEnabled ? 'Đang bật' : 'Tắt' }}</span>
              </div>

              @if (subjectForm.reminderEnabled) {
                <!-- Type tabs -->
                <div class="reminder-tabs">
                  @for (t of reminderTypes; track t.key) {
                    <button class="reminder-tab" [class.active]="subjectForm.reminderType === t.key"
                            (click)="subjectForm.reminderType = t.key">{{ t.label }}</button>
                  }
                </div>

                <!-- MINUTES -->
                @if (subjectForm.reminderType === 'MINUTES') {
                  <div class="form-label">Nhắc mỗi</div>
                  <div class="interval-pills">
                    @for (n of minuteOptions; track n) {
                      <div class="interval-pill" [class.selected]="subjectForm.reminderInterval === n"
                           (click)="subjectForm.reminderInterval = n">{{ n }} phút</div>
                    }
                  </div>
                  <p class="reminder-hint">Thông báo liên tục mỗi {{ subjectForm.reminderInterval }} phút khi đang học</p>
                }

                <!-- HOURS -->
                @if (subjectForm.reminderType === 'HOURS') {
                  <div class="form-label">Nhắc mỗi</div>
                  <div class="interval-pills">
                    @for (n of hourOptions; track n) {
                      <div class="interval-pill" [class.selected]="subjectForm.reminderInterval === n"
                           (click)="subjectForm.reminderInterval = n">{{ n }} giờ</div>
                    }
                  </div>
                  <p class="reminder-hint">Nhắc bạn học môn này mỗi {{ subjectForm.reminderInterval }} giờ</p>
                }

                <!-- DAILY -->
                @if (subjectForm.reminderType === 'DAILY') {
                  <div class="form-label" style="margin-bottom:6px">Nhắc lúc</div>
                  <input class="form-input" type="time" [(ngModel)]="subjectForm.reminderTime" style="max-width:160px" />
                  <p class="reminder-hint">Thông báo hằng ngày lúc {{ subjectForm.reminderTime }}</p>
                }

                <!-- WEEKLY -->
                @if (subjectForm.reminderType === 'WEEKLY') {
                  <div class="form-row" style="align-items:flex-end;gap:12px;margin-bottom:0">
                    <div class="form-group" style="margin-bottom:0;flex:0 0 auto">
                      <div class="form-label" style="margin-bottom:6px">Nhắc lúc</div>
                      <input class="form-input" type="time" [(ngModel)]="subjectForm.reminderTime" style="width:140px" />
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <div class="form-label" style="margin-bottom:6px">Các ngày</div>
                      <div class="days-row" style="margin-top:0">
                        @for (d of daysConfig; track d.key) {
                          <div class="day-btn" [class.selected]="isDaySelected(d.key)"
                               (click)="toggleDay(d.key)">{{ d.label }}</div>
                        }
                      </div>
                    </div>
                  </div>
                  <p class="reminder-hint">Nhắc vào lúc {{ subjectForm.reminderTime }} các ngày đã chọn</p>
                }
              }
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeSubjectModal()">Hủy</button>
            <button class="btn-submit" (click)="saveSubject()" [disabled]="!subjectForm.name.trim() || savingSubject()">
              {{ savingSubject() ? 'Đang lưu...' : (editingSubject() ? 'Lưu thay đổi' : 'Tạo môn học') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════ Deck Modal ════ -->
    @if (showDeckModal()) {
      <div class="overlay" (click)="closeDeckModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">
            <mat-icon>{{ editingDeck() ? 'edit' : 'add_circle' }}</mat-icon>
            {{ editingDeck() ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ mới' }}
          </div>
          <div class="form-group">
            <label class="form-label">Tên bộ thẻ *</label>
            <input class="form-input" [(ngModel)]="deckForm.name" placeholder="VD: Từ vựng Unit 1..." />
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea class="form-textarea" [(ngModel)]="deckForm.description" placeholder="Mô tả ngắn..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Màu sắc</label>
            <div class="color-row">
              @for (c of colors; track c) {
                <div class="color-dot" [class.selected]="deckForm.coverColor === c"
                     [style.background]="c" (click)="deckForm.coverColor = c"></div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeDeckModal()">Hủy</button>
            <button class="btn-submit" (click)="saveDeck()" [disabled]="!deckForm.name.trim() || savingDeck()">
              {{ savingDeck() ? 'Đang lưu...' : (editingDeck() ? 'Lưu thay đổi' : 'Tạo bộ thẻ') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════ Card Modal ════ -->
    @if (showCardModal()) {
      <div class="overlay" (click)="closeCardModal()">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-title">
            <mat-icon>{{ editingCard() ? 'edit' : 'add_circle' }}</mat-icon>
            {{ editingCard() ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới' }}
          </div>
          <div class="form-group">
            <label class="form-label">Mặt trước *</label>
            <textarea class="form-textarea" [(ngModel)]="cardForm.frontText" placeholder="Câu hỏi / từ cần học..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Mặt sau *</label>
            <textarea class="form-textarea" [(ngModel)]="cardForm.backText" placeholder="Câu trả lời / nghĩa..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (phân cách bằng dấu phẩy)</label>
            <input class="form-input" [(ngModel)]="cardTagsInput" placeholder="VD: grammar, unit1, verb" />
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCardModal()">Hủy</button>
            <button class="btn-submit" (click)="saveCard()"
                    [disabled]="!cardForm.frontText.trim() || !cardForm.backText.trim() || savingCard()">
              {{ savingCard() ? 'Đang lưu...' : (editingCard() ? 'Lưu thay đổi' : 'Thêm thẻ') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeckComponent implements OnInit {
  protected svc = inject(DeckService);

  view = signal<'subjects' | 'decks'>('subjects');
  selectedSubject = signal<Subject | null>(null);
  selectedDeck    = signal<Deck | null>(null);
  cards           = signal<Card[]>([]);
  cardsLoading    = signal(false);

  // Subject modal
  showSubjectModal = signal(false);
  editingSubject   = signal<Subject | null>(null);
  savingSubject    = signal(false);
  subjectForm: CreateSubjectRequest = {
    name: '', emoji: '📚', color: '#6366f1',
    reminderEnabled: false, reminderType: 'DAILY', reminderInterval: 30, reminderTime: '20:00'
  };
  selectedDays: string[] = [];

  // Deck modal
  showDeckModal = signal(false);
  editingDeck   = signal<Deck | null>(null);
  savingDeck    = signal(false);
  deckForm: CreateDeckRequest = { name: '', description: '', coverColor: '#6366f1' };

  // Card modal
  showCardModal = signal(false);
  editingCard   = signal<Card | null>(null);
  savingCard    = signal(false);
  cardForm      = { frontText: '', backText: '' };
  cardTagsInput = '';

  colors        = DECK_COLORS;
  emojis        = SUBJECT_EMOJIS;
  daysConfig    = DAYS;
  reminderTypes = REMINDER_TYPES;
  minuteOptions = MINUTE_OPTIONS;
  hourOptions   = HOUR_OPTIONS;

  ngOnInit() {
    this.svc.loadSubjects().subscribe();
  }

  // ── Navigation ──
  enterSubject(sub: Subject) {
    this.selectedSubject.set(sub);
    this.selectedDeck.set(null);
    this.cards.set([]);
    this.view.set('decks');
    this.svc.loadDecksBySubject(sub.id).subscribe();
  }

  goBack() {
    this.view.set('subjects');
    this.selectedSubject.set(null);
    this.selectedDeck.set(null);
    this.cards.set([]);
  }

  selectDeck(deck: Deck) {
    if (this.selectedDeck()?.id === deck.id) { this.selectedDeck.set(null); return; }
    this.selectedDeck.set(deck);
    this.loadCards(deck.id);
  }

  loadCards(deckId: string) {
    this.cardsLoading.set(true);
    this.svc.getCards(deckId).subscribe({
      next: res => { this.cards.set(res.data); this.cardsLoading.set(false); },
      error: ()  => this.cardsLoading.set(false),
    });
  }

  // ── Header helpers ──
  headerGradient() {
    if (this.view() === 'decks' && this.selectedSubject()) {
      return this.subjectGradient(this.selectedSubject()!.color);
    }
    return 'linear-gradient(135deg,#06b6d4,#22d3ee)';
  }
  headerEmoji() {
    return this.view() === 'decks' ? (this.selectedSubject()?.emoji ?? '📚') : '📚';
  }
  headerTitle() {
    return this.view() === 'decks' ? (this.selectedSubject()?.name ?? '') : 'Flashcards';
  }
  subjectGradient(color: string) {
    return `linear-gradient(135deg,${color},${color}cc)`;
  }

  // ── Subject CRUD ──
  openCreateSubject() {
    this.editingSubject.set(null);
    this.subjectForm = {
      name: '', emoji: '📚', color: '#6366f1',
      reminderEnabled: false,
      reminderType: 'DAILY',
      reminderInterval: 30,
      reminderTime: '20:00',
    };
    this.selectedDays = [];
    this.showSubjectModal.set(true);
  }

  openEditSubject(sub: Subject, e: Event) {
    e.stopPropagation();
    this.editingSubject.set(sub);
    this.subjectForm = {
      name: sub.name, emoji: sub.emoji, color: sub.color,
      reminderEnabled: sub.reminderEnabled,
      reminderType: sub.reminderType ?? 'DAILY',
      reminderInterval: sub.reminderInterval ?? 30,
      reminderTime: sub.reminderTime ?? '20:00',
      reminderDays: sub.reminderDays,
    };
    this.selectedDays = [...sub.reminderDays];
    this.showSubjectModal.set(true);
  }

  closeSubjectModal() { this.showSubjectModal.set(false); }

  saveSubject() {
    if (!this.subjectForm.name.trim()) return;
    this.savingSubject.set(true);
    const req: CreateSubjectRequest = {
      ...this.subjectForm,
      name: this.subjectForm.name.trim(),
      reminderDays: this.subjectForm.reminderType === 'WEEKLY' ? this.selectedDays : [],
      reminderInterval: ['MINUTES','HOURS'].includes(this.subjectForm.reminderType ?? '')
        ? this.subjectForm.reminderInterval : undefined,
      reminderTime: ['DAILY','WEEKLY'].includes(this.subjectForm.reminderType ?? '')
        ? this.subjectForm.reminderTime : undefined,
    };
    const op = this.editingSubject()
      ? this.svc.updateSubject(this.editingSubject()!.id, req)
      : this.svc.createSubject(req);
    op.subscribe({
      next: () => { this.savingSubject.set(false); this.closeSubjectModal(); },
      error: ()  => this.savingSubject.set(false),
    });
  }

  confirmDeleteSubject(sub: Subject, e: Event) {
    e.stopPropagation();
    if (!confirm(`Xóa môn học "${sub.name}"? Tất cả bộ thẻ trong môn này sẽ bị xóa.`)) return;
    this.svc.deleteSubject(sub.id).subscribe();
  }

  isDaySelected(key: string) { return this.selectedDays.includes(key); }
  toggleDay(key: string) {
    const idx = this.selectedDays.indexOf(key);
    if (idx >= 0) this.selectedDays.splice(idx, 1);
    else          this.selectedDays.push(key);
  }

  // ── Deck CRUD ──
  openCreateDeck() {
    this.editingDeck.set(null);
    this.deckForm = { name: '', description: '', coverColor: '#6366f1', subjectId: this.selectedSubject()?.id };
    this.showDeckModal.set(true);
  }

  openEditDeck(deck: Deck, e: Event) {
    e.stopPropagation();
    this.editingDeck.set(deck);
    this.deckForm = { name: deck.name, description: deck.description ?? '', coverColor: deck.coverColor };
    this.showDeckModal.set(true);
  }

  closeDeckModal() { this.showDeckModal.set(false); }

  saveDeck() {
    if (!this.deckForm.name.trim()) return;
    this.savingDeck.set(true);
    const op = this.editingDeck()
      ? this.svc.updateDeck(this.editingDeck()!.id, { name: this.deckForm.name.trim(), description: this.deckForm.description, coverColor: this.deckForm.coverColor })
      : this.svc.createDeck({ ...this.deckForm, name: this.deckForm.name.trim() });
    op.subscribe({
      next: () => { this.savingDeck.set(false); this.closeDeckModal(); },
      error: ()  => this.savingDeck.set(false),
    });
  }

  confirmDeleteDeck(deck: Deck, e: Event) {
    e.stopPropagation();
    if (!confirm(`Xóa bộ thẻ "${deck.name}"?`)) return;
    this.svc.deleteDeck(deck.id).subscribe(() => {
      if (this.selectedDeck()?.id === deck.id) this.selectedDeck.set(null);
      // Refresh subject deck count
      if (this.selectedSubject()) {
        this.svc.subjects.update(list => list.map(s =>
          s.id === this.selectedSubject()!.id ? {...s, deckCount: s.deckCount - 1} : s
        ));
      }
    });
  }

  // ── Card CRUD ──
  openCreateCard() {
    this.editingCard.set(null);
    this.cardForm = { frontText: '', backText: '' };
    this.cardTagsInput = '';
    this.showCardModal.set(true);
  }

  openEditCard(card: Card) {
    this.editingCard.set(card);
    this.cardForm = { frontText: card.frontText ?? '', backText: card.backText ?? '' };
    this.cardTagsInput = card.tags?.join(', ') ?? '';
    this.showCardModal.set(true);
  }

  closeCardModal() { this.showCardModal.set(false); }

  saveCard() {
    const deck = this.selectedDeck();
    if (!deck) return;
    const tags = this.cardTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const req: CreateCardRequest = {
      deckId: deck.id,
      frontText: this.cardForm.frontText.trim(),
      backText:  this.cardForm.backText.trim(),
      tags:      tags.length ? tags : undefined,
    };
    this.savingCard.set(true);
    const op = this.editingCard()
      ? this.svc.updateCard(deck.id, this.editingCard()!.id, req)
      : this.svc.createCard(deck.id, req);
    op.subscribe({
      next: res => {
        this.savingCard.set(false); this.closeCardModal();
        if (this.editingCard()) {
          this.cards.update(list => list.map(c => c.id === res.data.id ? res.data : c));
        } else {
          this.cards.update(list => [...list, res.data]);
          this.svc.decks.update(list => list.map(d => d.id === deck.id ? {...d, cardCount: d.cardCount + 1} : d));
        }
      },
      error: () => this.savingCard.set(false),
    });
  }

  deleteCard(card: Card) {
    const deck = this.selectedDeck();
    if (!deck || !confirm('Xóa thẻ này?')) return;
    this.svc.deleteCard(deck.id, card.id).subscribe(() => {
      this.cards.update(list => list.filter(c => c.id !== card.id));
      this.svc.decks.update(list => list.map(d => d.id === deck.id ? {...d, cardCount: d.cardCount - 1} : d));
    });
  }

  stateLabel(s: number) { return STATE_LABELS[s]  ?? 'Mới'; }
  stateClass(s: number) { return STATE_CLASSES[s] ?? 'state-new'; }

  reminderBadgeText(sub: Subject): string {
    if (!sub.reminderType) return '';
    switch (sub.reminderType) {
      case 'MINUTES': return `${sub.reminderInterval} phút`;
      case 'HOURS':   return `${sub.reminderInterval} giờ`;
      case 'DAILY':   return sub.reminderTime ?? 'Hằng ngày';
      case 'WEEKLY':  return sub.reminderTime ?? 'Hằng tuần';
      default:        return '';
    }
  }
}
