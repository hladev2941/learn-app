import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Card, Deck, Subject } from '../../core/models/deck.model';
import { CreateCardRequest, CreateDeckRequest, CreateSubjectRequest, DeckService, GeneratedCard } from './deck.service';

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
const SUBJECT_EMOJIS = ['📚','🧮','🌍','🔬','🎨','💻','🎵','📖','✏️','🏛️','⚗️','🌱'];
const REMINDER_TYPES = [
  { key: 'MINUTES', label: 'Phút' },
  { key: 'HOURS',   label: 'Giờ' },
  { key: 'DAILY',   label: 'Hằng ngày' },
  { key: 'WEEKLY',  label: 'Hằng tuần' },
];
const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];
const HOUR_OPTIONS   = [1, 2, 3, 4, 6, 8, 12];

// ─── Styles ──────────────────────────────────────────────────
const S = `
*, *::before, *::after { box-sizing: border-box; }

.page { padding: 32px; max-width: 1100px; margin: 0 auto; }
@media (max-width: 640px) { .page { padding: 16px; } }

/* ── Header ── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
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
.hd-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

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
  cursor: pointer; transition: background .15s; text-decoration: none;
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
.btn-review {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg,#10b981,#34d399); color: white;
  border: none; border-radius: 8px; padding: 6px 12px;
  font-size: .75rem; font-weight: 700; cursor: pointer;
  text-decoration: none; transition: opacity .15s, transform .1s;
}
.btn-review:hover { opacity: .9; transform: translateY(-1px); }
.btn-review mat-icon { font-size: 14px; width: 14px; height: 14px; }

/* ── Search & Sort bar ── */
.toolbar {
  display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-wrap {
  flex: 1; min-width: 200px; position: relative;
}
.search-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-size: 18px; width: 18px; height: 18px; pointer-events: none;
}
.search-input {
  width: 100%; padding: 9px 12px 9px 36px;
  background: rgba(255,255,255,.72); backdrop-filter: blur(16px);
  border: 1.5px solid rgba(199,210,254,.7); border-radius: 12px;
  font-size: .875rem; color: #1e1b4b; outline: none;
  transition: border-color .15s;
}
.search-input:focus { border-color: #6366f1; }
.search-input::placeholder { color: #cbd5e1; }
.sort-select {
  padding: 9px 12px; border-radius: 12px;
  background: rgba(255,255,255,.72); border: 1.5px solid rgba(199,210,254,.7);
  font-size: .8125rem; color: #475569; outline: none; cursor: pointer;
}
.sort-select:focus { border-color: #6366f1; }

/* ── Overview stats bar ── */
.stats-bar {
  display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
}
.stat-chip {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.72); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.85); border-radius: 12px;
  padding: 10px 16px; font-size: .8125rem; font-weight: 600;
  box-shadow: 0 2px 10px rgba(99,102,241,.05);
}
.stat-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
.stat-chip-val { font-size: 1rem; font-weight: 700; }
.chip-total { color: #6366f1; }
.chip-due   { color: #ef4444; }
.chip-master{ color: #10b981; }
.chip-new   { color: #f59e0b; }

/* ── Glass ── */
.glass {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.8); border-radius: 20px;
  box-shadow: 0 4px 20px rgba(99,102,241,.07), inset 0 1px 0 rgba(255,255,255,.9);
}

/* ── Subject grid ── */
.subject-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
  gap: 16px; margin-bottom: 8px;
}
.subject-card {
  background: rgba(255,255,255,.72); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.85); border-radius: 22px;
  box-shadow: 0 4px 20px rgba(99,102,241,.07);
  overflow: hidden; cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  display: flex; flex-direction: column;
}
.subject-card:hover { transform: translateY(-4px); box-shadow: 0 10px 36px rgba(99,102,241,.14); }

.subject-cover {
  height: 72px; display: flex; align-items: center; justify-content: center;
  font-size: 2rem; position: relative; flex-shrink: 0;
}
.subject-cover-overlay {
  position: absolute; inset: 0; opacity: .15;
  background: repeating-linear-gradient(45deg, rgba(255,255,255,.3) 0, rgba(255,255,255,.3) 1px, transparent 0, transparent 50%);
  background-size: 10px 10px;
}

.subject-body { padding: 12px 14px 8px; flex: 1; }
.subject-name { font-size: .9375rem; font-weight: 700; color: #1e1b4b; margin: 0 0 6px; }
.subject-meta-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
}
.subject-meta-item {
  display: flex; align-items: center; gap: 3px;
  font-size: .72rem; color: #64748b; font-weight: 500;
}
.subject-meta-item mat-icon { font-size: 12px; width: 12px; height: 12px; }
.due-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: rgba(239,68,68,.1); color: #ef4444;
  font-size: .72rem; font-weight: 700; border-radius: 100px; padding: 2px 8px;
}
.due-badge mat-icon { font-size: 11px; width: 11px; height: 11px; }

/* Progress bar */
.progress-wrap { margin-bottom: 10px; }
.progress-label { display: flex; justify-content: space-between; font-size: .7rem; color: #94a3b8; margin-bottom: 4px; }
.progress-track {
  height: 5px; background: rgba(99,102,241,.1); border-radius: 100px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: linear-gradient(90deg,#10b981,#34d399);
  border-radius: 100px; transition: width .5s ease;
}

.subject-footer {
  display: flex; align-items: center; padding: 8px 10px;
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
  gap: 14px; margin-bottom: 20px;
}
.deck-card {
  background: rgba(255,255,255,.72); backdrop-filter: blur(20px);
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
.deck-cover { height: 6px; }
.deck-body   { padding: 14px; flex: 1; }
.deck-name   { font-size: .875rem; font-weight: 700; color: #1e1b4b; margin: 0 0 3px; }
.deck-desc   { font-size: .75rem; color: #94a3b8; margin: 0 0 8px; line-height: 1.4;
               max-height: 2.6em; overflow: hidden; }
.deck-chips  { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.deck-chip {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: .72rem; font-weight: 600;
  border-radius: 100px; padding: 2px 8px;
}
.deck-chip mat-icon { font-size: 11px; width: 11px; height: 11px; }
.chip-cards  { background: rgba(99,102,241,.08); color: #6366f1; }
.chip-due2   { background: rgba(239,68,68,.1); color: #ef4444; }
.chip-mastered { background: rgba(16,185,129,.1); color: #10b981; }
.deck-footer { display: flex; align-items: center; padding: 6px 10px; border-top: 1px solid rgba(99,102,241,.06); gap: 4px; }
.deck-footer-spacer { flex: 1; }

/* ── Card list panel ── */
.card-panel {
  background: rgba(255,255,255,.72); backdrop-filter: blur(20px);
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
.panel-header-right { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

/* Card search bar */
.card-search-wrap { padding: 10px 14px 0; }
.card-search {
  width: 100%; padding: 8px 12px 8px 36px;
  background: rgba(248,250,252,.9); border: 1.5px solid rgba(199,210,254,.6);
  border-radius: 10px; font-size: .8125rem; color: #1e1b4b; outline: none;
  transition: border-color .15s;
}
.card-search:focus { border-color: #6366f1; }
.card-search::placeholder { color: #cbd5e1; }
.card-search-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-size: 16px; width: 16px; height: 16px; pointer-events: none;
}
.card-search-container { position: relative; }

/* Sort chips */
.card-sort-row { display: flex; gap: 6px; padding: 10px 14px 0; flex-wrap: wrap; }
.sort-chip {
  padding: 4px 12px; border-radius: 100px; font-size: .72rem; font-weight: 600;
  border: 1.5px solid rgba(199,210,254,.6); background: transparent; color: #94a3b8;
  cursor: pointer; transition: all .15s;
}
.sort-chip.active { background: rgba(99,102,241,.1); color: #6366f1; border-color: rgba(99,102,241,.3); }

.card-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

/* Flash card item */
.flash-card {
  background: rgba(248,250,252,.85); border: 1px solid rgba(199,210,254,.5);
  border-radius: 14px; overflow: hidden;
  transition: box-shadow .15s;
}
.flash-card:hover { box-shadow: 0 3px 14px rgba(99,102,241,.1); }
.flash-card-header {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; cursor: pointer;
}
.flash-content { flex: 1; min-width: 0; }
.flash-front { font-size: .8125rem; font-weight: 600; color: #1e1b4b; margin-bottom: 3px; }
.flash-back-preview { font-size: .75rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.flash-tags  { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px; }
.tag-pill { font-size: .6875rem; font-weight: 600; color: #6366f1; background: rgba(99,102,241,.1); border-radius: 100px; padding: 1px 7px; }
.flash-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.flash-actions { display: flex; gap: 2px; }

/* Expanded card back */
.flash-back-full {
  border-top: 1px solid rgba(199,210,254,.4);
  padding: 10px 14px 12px;
  background: rgba(241,245,249,.5);
  font-size: .8125rem; color: #475569; line-height: 1.5;
}
.back-label { font-size: .7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }

/* Next review badge */
.review-date-badge {
  font-size: .65rem; font-weight: 700; border-radius: 100px; padding: 2px 7px;
  white-space: nowrap;
}
.review-due    { background: rgba(239,68,68,.1); color: #ef4444; }
.review-today  { background: rgba(245,158,11,.1); color: #d97706; }
.review-soon   { background: rgba(99,102,241,.08); color: #6366f1; }
.review-later  { background: rgba(100,116,139,.08); color: #94a3b8; }

.state-badge { font-size: .625rem; font-weight: 700; border-radius: 100px; padding: 2px 7px; flex-shrink: 0; }
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
  background: rgba(255,255,255,.97); backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,.9); border-radius: 24px;
  box-shadow: 0 20px 60px rgba(30,27,75,.18);
  padding: 28px; width: 100%; max-width: 480px;
  animation: slideUp .2s cubic-bezier(.4,0,.2,1);
  max-height: 90vh; overflow-y: auto;
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
  background: transparent; cursor: pointer; transition: all .15s; text-align: center;
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

/* ── AI Button ── */
.btn-ai {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg,#7c3aed,#a855f7); color: white;
  border: none; border-radius: 12px; padding: 10px 18px;
  font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.btn-ai:hover { opacity: .9; transform: translateY(-1px); }
.btn-ai mat-icon { font-size: 18px; width: 18px; height: 18px; }
.btn-ai:disabled { opacity: .5; cursor: not-allowed; transform: none; }

/* ── AI Modal ── */
.modal-ai { max-width: 560px; }
.ai-result-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; margin-top: 4px; padding-right: 4px; }
.ai-result-item {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(248,250,252,.9); border: 1px solid rgba(199,210,254,.5);
  border-radius: 12px; padding: 10px 12px; cursor: pointer; transition: background .12s;
}
.ai-result-item:hover { background: rgba(237,233,254,.6); }
.ai-result-item.selected { border-color: rgba(124,58,237,.4); background: rgba(237,233,254,.5); }
.ai-result-checkbox { flex-shrink: 0; width: 18px; height: 18px; accent-color: #7c3aed; margin-top: 2px; cursor: pointer; }
.ai-result-content { flex: 1; min-width: 0; }
.ai-result-front { font-size: .8125rem; font-weight: 600; color: #1e1b4b; margin-bottom: 3px; }
.ai-result-back  { font-size: .75rem; color: #64748b; line-height: 1.4; }
.ai-error {
  background: rgba(254,226,226,.8); border: 1px solid rgba(252,165,165,.5);
  border-radius: 10px; padding: 10px 14px; font-size: .8125rem; color: #dc2626; margin-top: 8px;
}
.ai-count-label { font-size: .8125rem; color: #64748b; margin: 0 0 6px; }
.ai-spinner-row { display: flex; align-items: center; gap: 10px; padding: 24px 0; justify-content: center; }
.ai-spinner-text { font-size: .875rem; color: #7c3aed; font-weight: 500; }
.btn-ai-submit {
  background: linear-gradient(135deg,#7c3aed,#a855f7); color: white;
  border: none; border-radius: 10px; padding: 9px 20px;
  font-size: .875rem; font-weight: 600; cursor: pointer; transition: opacity .15s;
}
.btn-ai-submit:hover { opacity: .9; }
.btn-ai-submit:disabled { opacity: .5; cursor: not-allowed; }

/* ── No results ── */
.no-results { text-align: center; padding: 32px; color: #94a3b8; font-size: .875rem; }

/* ── Format toolbar ── */
.format-toolbar {
  display: flex; align-items: center; gap: 2px;
  background: rgba(248,250,252,.95); border: 1.5px solid rgba(199,210,254,.7);
  border-radius: 10px 10px 0 0; padding: 5px 8px; flex-wrap: wrap;
}
.fmt-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: transparent; border: none; cursor: pointer; color: #475569;
  font-size: .875rem; transition: background .12s;
}
.fmt-btn:hover { background: rgba(99,102,241,.1); color: #6366f1; }
.fmt-btn.active { background: rgba(99,102,241,.15); color: #6366f1; }
.fmt-sep { width: 1px; height: 18px; background: rgba(199,210,254,.5); margin: 0 3px; }
.fmt-select {
  height: 26px; padding: 0 6px; border-radius: 6px;
  background: rgba(248,250,252,.9); border: 1px solid rgba(199,210,254,.7);
  font-size: .75rem; color: #475569; outline: none; cursor: pointer;
}
.fmt-select:focus { border-color: #6366f1; }
.fmt-color {
  width: 26px; height: 26px; padding: 2px; border-radius: 6px;
  background: rgba(248,250,252,.9); border: 1px solid rgba(199,210,254,.7);
  cursor: pointer; overflow: hidden;
}
.fmt-color::-webkit-color-swatch-wrapper { padding: 0; }
.fmt-color::-webkit-color-swatch { border: none; border-radius: 4px; }

/* ── Card source display ── */
.card-source {
  display: flex; align-items: center; gap: 3px;
  font-size: .6875rem; color: #94a3b8; margin-top: 3px;
}
.card-source mat-icon { font-size: 11px; width: 11px; height: 11px; }

/* ── Card modal — larger, scrollable ── */
.modal-card-editor {
  align-items: flex-start;
  padding-top: 4vh;
}
.modal-card-editor .modal {
  width: 640px;
  max-width: 100%;
  max-height: 90vh;
  padding: 28px;
  overflow-y: auto;
}

/* ── Rich text editor (inside modal card form) ── */
.form-editor {
  min-height: 120px;
  padding: 10px 12px;
  border: 1.5px solid rgba(199,210,254,.9);
  border-radius: 0 0 12px 12px;
  background: rgba(248,250,252,.8);
  outline: none;
  line-height: 1.55;
  font-size: .875rem;
  color: #1e1b4b;
  font-family: inherit;
  max-height: none;
  overflow-y: auto;
  resize: none;
}
.format-toolbar {
  border-radius: 12px 12px 0 0;
  border-bottom: none;
}
.form-editor:focus { border-color: #6366f1; }
.form-editor:empty:before {
  content: attr(data-placeholder); color: #9ca3af; pointer-events: none;
}
.form-editor b, .form-editor i, .form-editor u, .form-editor s { cursor: text; }
.form-editor[contenteditable="true"] { user-select: text; -webkit-user-select: text; }
`;

@Component({
  selector: 'app-deck',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
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
              <p class="page-sub">{{ svc.subjects().length }} môn học · {{ totalSubjectCards() }} thẻ</p>
            } @else {
              <div class="breadcrumb">
                <span>Flashcards</span>
                <span class="breadcrumb-sep">›</span>
                <span class="breadcrumb-active">{{ selectedSubject()?.name }}</span>
              </div>
            }
          </div>
        </div>
        <div class="hd-right">
          @if (view() === 'subjects') {
            <button class="btn-brand" (click)="openCreateSubject()">
              <mat-icon>create_new_folder</mat-icon> Tạo môn học
            </button>
          } @else {
            <a class="btn-ghost" routerLink="/review">
              <mat-icon>play_arrow</mat-icon> Ôn tập ngay
            </a>
            <button class="btn-brand" (click)="openCreateDeck()">
              <mat-icon>add</mat-icon> Thêm bộ thẻ
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (svc.loading()) {
        <div class="spinner-wrap"><mat-spinner [diameter]="36" color="primary"></mat-spinner></div>
      }

      <!-- ── View: Subjects ── -->
      @if (!svc.loading() && view() === 'subjects') {

        @if (svc.subjects().length > 0) {
          <!-- Stats overview -->
          <div class="stats-bar">
            <div class="stat-chip chip-total">
              <mat-icon>style</mat-icon>
              <span class="stat-chip-val">{{ totalSubjectCards() }}</span>
              <span>tổng thẻ</span>
            </div>
            <div class="stat-chip chip-due">
              <mat-icon>schedule</mat-icon>
              <span class="stat-chip-val">{{ totalDueCards() }}</span>
              <span>cần ôn hôm nay</span>
            </div>
            <div class="stat-chip chip-master">
              <mat-icon>verified</mat-icon>
              <span class="stat-chip-val">{{ totalMasteredCards() }}</span>
              <span>đã thành thạo</span>
            </div>
            <div class="stat-chip chip-new">
              <mat-icon>fiber_new</mat-icon>
              <span class="stat-chip-val">{{ totalNewCards() }}</span>
              <span>thẻ mới</span>
            </div>
          </div>

          <!-- Search bar -->
          <div class="toolbar">
            <div class="search-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input class="search-input" [(ngModel)]="subjectSearch"
                     placeholder="Tìm môn học..." />
            </div>
          </div>
        }

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
        } @else if (filteredSubjects().length === 0) {
          <div class="no-results">Không tìm thấy môn học nào phù hợp</div>
        } @else {
          <div class="subject-grid">
            @for (sub of filteredSubjects(); track sub.id) {
              <div class="subject-card" (click)="enterSubject(sub)">
                <div class="subject-cover" [style.background]="subjectGradient(sub.color)">
                  <div class="subject-cover-overlay"></div>
                  <span style="position:relative;z-index:1">{{ sub.emoji }}</span>
                </div>
                <div class="subject-body">
                  <p class="subject-name">{{ sub.name }}</p>
                  <div class="subject-meta-row">
                    <span class="subject-meta-item">
                      <mat-icon>style</mat-icon>{{ sub.deckCount }} bộ thẻ
                    </span>
                    <span class="subject-meta-item">
                      <mat-icon>credit_card</mat-icon>{{ sub.totalCardCount }} thẻ
                    </span>
                    @if (sub.dueCardCount > 0) {
                      <span class="due-badge">
                        <mat-icon>schedule</mat-icon>{{ sub.dueCardCount }} cần ôn
                      </span>
                    }
                  </div>
                  @if (sub.totalCardCount > 0) {
                    <div class="progress-wrap">
                      <div class="progress-label">
                        <span>Thành thạo</span>
                        <span>{{ sub.masteredCardCount }}/{{ sub.totalCardCount }}</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill"
                             [style.width.%]="progressPct(sub.masteredCardCount, sub.totalCardCount)"></div>
                      </div>
                    </div>
                  }
                </div>
                <div class="subject-footer">
                  @if (sub.reminderEnabled) {
                    <span class="reminder-badge">
                      <mat-icon>notifications_active</mat-icon>
                      {{ reminderBadgeText(sub) }}
                    </span>
                  }
                  <span class="subject-footer-spacer"></span>
                  <button class="btn-icon" title="Chỉnh sửa" (click)="openEditSubject(sub, $event)"><mat-icon>edit</mat-icon></button>
                  <button class="btn-icon" title="Xóa" (click)="confirmDeleteSubject(sub, $event)" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── View: Decks ── -->
      @if (!svc.loading() && view() === 'decks') {

        @if (svc.decks().length > 0) {
          <!-- Stats bar for this subject -->
          <div class="stats-bar">
            <div class="stat-chip chip-total">
              <mat-icon>credit_card</mat-icon>
              <span class="stat-chip-val">{{ selectedSubject()?.totalCardCount ?? 0 }}</span>
              <span>thẻ</span>
            </div>
            <div class="stat-chip chip-due">
              <mat-icon>schedule</mat-icon>
              <span class="stat-chip-val">{{ selectedSubject()?.dueCardCount ?? 0 }}</span>
              <span>cần ôn</span>
            </div>
            <div class="stat-chip chip-master">
              <mat-icon>verified</mat-icon>
              <span class="stat-chip-val">{{ selectedSubject()?.masteredCardCount ?? 0 }}</span>
              <span>thành thạo</span>
            </div>
            <div class="stat-chip chip-new">
              <mat-icon>fiber_new</mat-icon>
              <span class="stat-chip-val">{{ deckNewCards() }}</span>
              <span>thẻ mới</span>
            </div>
          </div>

          <!-- Search + Sort toolbar -->
          <div class="toolbar">
            <div class="search-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input class="search-input" [(ngModel)]="deckSearch"
                     placeholder="Tìm bộ thẻ..." />
            </div>
            <select class="sort-select" [(ngModel)]="deckSort">
              <option value="recent">Gần nhất</option>
              <option value="name">Tên A-Z</option>
              <option value="cards">Nhiều thẻ nhất</option>
              <option value="due">Cần ôn nhiều nhất</option>
            </select>
          </div>
        }

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
        } @else if (filteredDecks().length === 0) {
          <div class="no-results">Không tìm thấy bộ thẻ nào phù hợp</div>
        } @else {
          <div class="deck-grid">
            @for (deck of filteredDecks(); track deck.id) {
              <div class="deck-card" [class.active]="selectedDeck()?.id === deck.id" (click)="selectDeck(deck)">
                <div class="deck-cover" [style.background]="deck.coverColor"></div>
                <div class="deck-body">
                  <p class="deck-name">{{ deck.name }}</p>
                  @if (deck.description) { <p class="deck-desc">{{ deck.description }}</p> }
                  <div class="deck-chips">
                    <span class="deck-chip chip-cards">
                      <mat-icon>credit_card</mat-icon>{{ deck.cardCount }} thẻ
                    </span>
                    @if (deck.dueCardCount > 0) {
                      <span class="deck-chip chip-due2">
                        <mat-icon>schedule</mat-icon>{{ deck.dueCardCount }} cần ôn
                      </span>
                    }
                    @if (deck.masteredCardCount > 0) {
                      <span class="deck-chip chip-mastered">
                        <mat-icon>verified</mat-icon>{{ deck.masteredCardCount }} thành thạo
                      </span>
                    }
                  </div>
                  @if (deck.cardCount > 0) {
                    <div class="progress-track">
                      <div class="progress-fill"
                           [style.width.%]="progressPct(deck.masteredCardCount, deck.cardCount)"></div>
                    </div>
                  }
                </div>
                <div class="deck-footer">
                  <span class="deck-footer-spacer"></span>
                  <button class="btn-icon" title="Chỉnh sửa" (click)="openEditDeck(deck,$event)"><mat-icon>edit</mat-icon></button>
                  <button class="btn-icon" title="Xóa" (click)="confirmDeleteDeck(deck,$event)" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
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
                  <div class="panel-count">{{ filteredCards().length }} / {{ cards().length }} thẻ</div>
                </div>
              </div>
              <div class="panel-header-right">
                <button class="btn-ai" (click)="openAiModal()">
                  <mat-icon>auto_awesome</mat-icon> Tạo bằng AI
                </button>
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
              <!-- Card search + sort -->
              <div class="card-search-wrap">
                <div class="card-search-container">
                  <mat-icon class="card-search-icon">search</mat-icon>
                  <input class="card-search" [(ngModel)]="cardSearch"
                         placeholder="Tìm thẻ..." />
                </div>
              </div>
              <div class="card-sort-row">
                <button class="sort-chip" [class.active]="cardSort === 'default'" (click)="cardSort = 'default'">Mặc định</button>
                <button class="sort-chip" [class.active]="cardSort === 'due'" (click)="cardSort = 'due'">Cần ôn trước</button>
                <button class="sort-chip" [class.active]="cardSort === 'state'" (click)="cardSort = 'state'">Theo trạng thái</button>
                <button class="sort-chip" [class.active]="cardSort === 'alpha'" (click)="cardSort = 'alpha'">A-Z</button>
              </div>

              @if (filteredCards().length === 0) {
                <div class="no-results">Không tìm thấy thẻ nào</div>
              } @else {
                <div class="card-list">
                  @for (card of filteredCards(); track card.id) {
                    <div class="flash-card">
                      <div class="flash-card-header" (click)="toggleCardExpand(card.id)">
                        <div class="flash-content">
                          <div class="flash-front">{{ card.frontText }}</div>
                          @if (expandedCardId() !== card.id) {
                            <div class="flash-back-preview">{{ card.backText }}</div>
                          }
                          @if (card.source) {
                            <div class="card-source">
                              <mat-icon>source</mat-icon>
                              {{ card.source }}
                            </div>
                          }
                          @if (card.tags && card.tags.length) {
                            <div class="flash-tags">
                              @for (tag of card.tags; track tag) { <span class="tag-pill">{{ tag }}</span> }
                            </div>
                          }
                        </div>
                        <div class="flash-meta">
                          <span class="state-badge" [class]="stateClass(card.fsrsState)">{{ stateLabel(card.fsrsState) }}</span>
                          <span class="review-date-badge" [class]="reviewDateClass(card)">{{ reviewDateLabel(card) }}</span>
                        </div>
                        <div class="flash-actions">
                          <button class="btn-icon" (click)="openEditCard(card);$event.stopPropagation()"><mat-icon>edit</mat-icon></button>
                          <button class="btn-icon" (click)="deleteCard(card);$event.stopPropagation()" style="color:#f43f5e"><mat-icon>delete_outline</mat-icon></button>
                        </div>
                      </div>
                      @if (expandedCardId() === card.id) {
                        <div class="flash-back-full">
                          <div class="back-label">Mặt sau</div>
                          {{ card.backText }}
                        </div>
                      }
                    </div>
                  }
                </div>
              }
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

          <div class="form-group">
            <label class="form-label">Nhắc nhở học</label>
            <div class="reminder-section">
              <div class="toggle-row" [style.margin-bottom]="subjectForm.reminderEnabled ? '14px' : '0'">
                <div class="toggle-wrap" (click)="subjectForm.reminderEnabled = !subjectForm.reminderEnabled">
                  <div class="toggle-track" [class.on]="subjectForm.reminderEnabled"></div>
                  <div class="toggle-thumb" [class.on]="subjectForm.reminderEnabled"></div>
                </div>
                <span class="toggle-label">{{ subjectForm.reminderEnabled ? 'Đang bật' : 'Tắt' }}</span>
              </div>

              @if (subjectForm.reminderEnabled) {
                <div class="reminder-tabs">
                  @for (t of reminderTypes; track t.key) {
                    <button class="reminder-tab" [class.active]="subjectForm.reminderType === t.key"
                            (click)="subjectForm.reminderType = t.key">{{ t.label }}</button>
                  }
                </div>

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

                @if (subjectForm.reminderType === 'DAILY') {
                  <div class="form-label" style="margin-bottom:6px">Nhắc lúc</div>
                  <input class="form-input" type="time" [(ngModel)]="subjectForm.reminderTime" style="max-width:160px" />
                  <p class="reminder-hint">Thông báo hằng ngày lúc {{ subjectForm.reminderTime }}</p>
                }

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
      <div class="overlay modal-card-editor" (click)="closeCardModal()">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-title">
            <mat-icon>{{ editingCard() ? 'edit' : 'add_circle' }}</mat-icon>
            {{ editingCard() ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới' }}
          </div>
          <div class="form-group">
            <label class="form-label">Mặt trước *</label>
            <div class="format-toolbar">
              <button class="fmt-btn" (click)="formatText('bold')" title="Tô đậm"><b>B</b></button>
              <button class="fmt-btn" (click)="formatText('italic')" title="In nghiêng"><i>I</i></button>
              <button class="fmt-btn" (click)="formatText('underline')" title="Gạch chân"><u>U</u></button>
              <button class="fmt-btn" (click)="formatText('strike')" title="Gạch ngang"><s>S</s></button>
              <span class="fmt-sep"></span>
              <select class="fmt-select" (change)="formatText('fontSize', $event)">
                <option value="">Cỡ</option>
                <option value="small">Nhỏ</option>
                <option value="medium">Vừa</option>
                <option value="large">Lớn</option>
                <option value="xlarge">Rất lớn</option>
              </select>
              <span class="fmt-sep"></span>
              <input type="color" class="fmt-color" title="Màu chữ" (change)="formatText('color', $event)" />
              <input type="color" class="fmt-color" title="Màu nền" (change)="formatText('highlight', $event)" value="#fef08a" />
            </div>
            <div class="form-editor" contenteditable="true" #frontEditor
                 [innerHTML]="cardForm.frontText"
                 (input)="onEditorInput($event, 'frontText', frontEditor)"
                 data-placeholder="Câu hỏi / từ cần học..."></div>
          </div>
          <div class="form-group">
            <label class="form-label">Mặt sau *</label>
            <div class="format-toolbar">
              <button class="fmt-btn" (click)="formatText('bold')" title="Tô đậm"><b>B</b></button>
              <button class="fmt-btn" (click)="formatText('italic')" title="In nghiêng"><i>I</i></button>
              <button class="fmt-btn" (click)="formatText('underline')" title="Gạch chân"><u>U</u></button>
              <button class="fmt-btn" (click)="formatText('strike')" title="Gạch ngang"><s>S</s></button>
              <span class="fmt-sep"></span>
              <select class="fmt-select" (change)="formatText('fontSize', $event)">
                <option value="">Cỡ</option>
                <option value="small">Nhỏ</option>
                <option value="medium">Vừa</option>
                <option value="large">Lớn</option>
                <option value="xlarge">Rất lớn</option>
              </select>
              <span class="fmt-sep"></span>
              <input type="color" class="fmt-color" title="Màu chữ" (change)="formatText('color', $event)" />
              <input type="color" class="fmt-color" title="Màu nền" (change)="formatText('highlight', $event)" value="#fef08a" />
            </div>
            <div class="form-editor" contenteditable="true" #backEditor
                 [innerHTML]="cardForm.backText"
                 (input)="onEditorInput($event, 'backText', backEditor)"
                 data-placeholder="Câu trả lời / nghĩa..."></div>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (phân cách bằng dấu phẩy)</label>
            <input class="form-input" [(ngModel)]="cardTagsInput" placeholder="VD: grammar, unit1, verb" />
          </div>
          <div class="form-group">
            <label class="form-label">Nguồn tài liệu</label>
            <input class="form-input" [(ngModel)]="cardForm.source"
                   placeholder="VD: Unit 3 - English Grammar, Wikipedia: Photosynthesis..." />
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

    <!-- ════ AI Generation Modal ════ -->
    @if (showAiModal()) {
      <div class="overlay" (click)="closeAiModal()">
        <div class="modal modal-ai" (click)="$event.stopPropagation()">
          <div class="modal-title">
            <mat-icon style="color:#7c3aed">auto_awesome</mat-icon>
            Tạo flashcard bằng AI
          </div>

          <div class="form-group">
            <label class="form-label">Văn bản nguồn *</label>
            <textarea class="form-textarea" style="min-height:120px"
                      [(ngModel)]="aiText"
                      [disabled]="aiGenerating()"
                      placeholder="Dán văn bản bạn muốn học..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Số thẻ tối đa (1–20)</label>
            <input class="form-input" type="number" min="1" max="20"
                   [(ngModel)]="aiMaxCards"
                   [disabled]="aiGenerating()"
                   style="max-width:100px" />
          </div>

          @if (!aiGenerating() && aiResults().length === 0) {
            <button class="btn-ai-submit" style="width:100%;margin-bottom:4px"
                    (click)="generateAiCards()"
                    [disabled]="!aiText.trim()">
              <mat-icon style="font-size:16px;vertical-align:middle;margin-right:4px">auto_awesome</mat-icon>
              Tạo thẻ
            </button>
          }

          @if (aiGenerating()) {
            <div class="ai-spinner-row">
              <mat-spinner [diameter]="24" color="primary"></mat-spinner>
              <span class="ai-spinner-text">AI đang tạo thẻ...</span>
            </div>
          }

          @if (aiError()) {
            <div class="ai-error">{{ aiError() }}</div>
          }

          @if (aiResults().length > 0) {
            <div class="form-group" style="margin-top:8px">
              <p class="ai-count-label">{{ aiResults().length }} thẻ được tạo — chọn những thẻ muốn lưu:</p>
              <div class="ai-result-list">
                @for (card of aiResults(); track $index) {
                  <div class="ai-result-item" [class.selected]="aiSelected()[$index]"
                       (click)="toggleAiCard($index)">
                    <input type="checkbox" class="ai-result-checkbox"
                           [checked]="aiSelected()[$index]"
                           (click)="$event.stopPropagation()"
                           (change)="toggleAiCard($index)" />
                    <div class="ai-result-content">
                      <div class="ai-result-front">{{ card.front }}</div>
                      <div class="ai-result-back">{{ card.back }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAiModal()">Đóng</button>
            @if (aiResults().length > 0) {
              <button class="btn-cancel" style="margin-right:4px" (click)="resetAiModal()">Tạo lại</button>
              <button class="btn-ai-submit" (click)="saveAiCards()"
                      [disabled]="aiSaving() || selectedAiCount() === 0">
                {{ aiSaving() ? 'Đang lưu...' : 'Thêm ' + selectedAiCount() + ' thẻ đã chọn' }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class DeckComponent implements OnInit {
  protected svc = inject(DeckService);

  view            = signal<'subjects' | 'decks'>('subjects');
  selectedSubject = signal<Subject | null>(null);
  selectedDeck    = signal<Deck | null>(null);
  cards           = signal<Card[]>([]);
  cardsLoading    = signal(false);
  expandedCardId  = signal<string | null>(null);

  // Search & sort state
  subjectSearch = '';
  deckSearch    = '';
  deckSort      = 'recent';
  cardSearch    = '';
  cardSort      = 'default';

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
  showCardModal  = signal(false);
  editingCard    = signal<Card | null>(null);
  savingCard     = signal(false);
  cardSaveError  = signal<string | null>(null);
  cardsLoadError = signal<string | null>(null);
  cardForm       = { frontText: '', backText: '', source: '', contentFormat: 'plain' };
  cardTagsInput  = '';

  // AI generation modal
  showAiModal  = signal(false);
  aiText       = '';
  aiMaxCards   = 10;
  aiGenerating = signal(false);
  aiResults    = signal<GeneratedCard[]>([]);
  aiSelected   = signal<boolean[]>([]);
  aiSaving     = signal(false);
  aiError      = signal<string | null>(null);

  colors        = DECK_COLORS;
  emojis        = SUBJECT_EMOJIS;
  daysConfig    = DAYS;
  reminderTypes = REMINDER_TYPES;
  minuteOptions = MINUTE_OPTIONS;
  hourOptions   = HOUR_OPTIONS;

  // ── Global subject stats ──────────────────────────────────────────────────
  totalSubjectCards  = computed(() => this.svc.subjects().reduce((s, sub) => s + (sub.totalCardCount ?? 0), 0));
  totalDueCards      = computed(() => this.svc.subjects().reduce((s, sub) => s + (sub.dueCardCount ?? 0), 0));
  totalMasteredCards = computed(() => this.svc.subjects().reduce((s, sub) => s + (sub.masteredCardCount ?? 0), 0));
  totalNewCards = computed(() =>
    Math.max(0, this.totalSubjectCards() - this.totalMasteredCards())
  );

  // New cards per deck view = total - mastered in subject
  deckNewCards = computed(() => {
    const sub = this.selectedSubject();
    if (!sub) return 0;
    return Math.max(0, (sub.totalCardCount ?? 0) - (sub.masteredCardCount ?? 0));
  });

  // ── Filtered lists ────────────────────────────────────────────────────────
  filteredSubjects = computed(() => {
    const q = this.subjectSearch.toLowerCase().trim();
    const list = q ? this.svc.subjects().filter(s => s.name.toLowerCase().includes(q)) : this.svc.subjects();
    return list;
  });

  filteredDecks = computed(() => {
    const q = this.deckSearch.toLowerCase().trim();
    let list = q ? this.svc.decks().filter(d => d.name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q)) : [...this.svc.decks()];
    switch (this.deckSort) {
      case 'name':  list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'cards': list.sort((a, b) => b.cardCount - a.cardCount); break;
      case 'due':   list.sort((a, b) => b.dueCardCount - a.dueCardCount); break;
    }
    return list;
  });

  filteredCards = computed(() => {
    const q = this.cardSearch.toLowerCase().trim();
    let list = q
      ? this.cards().filter(c =>
          (c.frontText ?? '').toLowerCase().includes(q) ||
          (c.backText ?? '').toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q)))
      : [...this.cards()];

    const today = new Date(); today.setHours(0,0,0,0);
    switch (this.cardSort) {
      case 'due':
        list.sort((a, b) => {
          const da = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
          const db = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
          return da - db;
        });
        break;
      case 'state':
        list.sort((a, b) => a.fsrsState - b.fsrsState);
        break;
      case 'alpha':
        list.sort((a, b) => (a.frontText ?? '').localeCompare(b.frontText ?? ''));
        break;
    }
    return list;
  });

  ngOnInit() {
    this.svc.loadSubjects().subscribe();
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  enterSubject(sub: Subject) {
    this.selectedSubject.set(sub);
    this.selectedDeck.set(null);
    this.cards.set([]);
    this.deckSearch = '';
    this.view.set('decks');
    this.svc.loadDecksBySubject(sub.id).subscribe();
  }

  goBack() {
    this.view.set('subjects');
    this.selectedSubject.set(null);
    this.selectedDeck.set(null);
    this.cards.set([]);
    this.deckSearch = '';
    this.cardSearch = '';
  }

  selectDeck(deck: Deck) {
    if (this.selectedDeck()?.id === deck.id) { this.selectedDeck.set(null); return; }
    this.selectedDeck.set(deck);
    this.cardSearch = '';
    this.cardSort = 'default';
    this.expandedCardId.set(null);
    this.loadCards(deck.id);
  }

  loadCards(deckId: string) {
    this.cardsLoading.set(true);
    this.cards.set([]);
    this.svc.getCards(deckId).subscribe({
      next: res => { this.cards.set(res.data ?? []); this.cardsLoading.set(false); },
      error: ()  => { this.cards.set([]); this.cardsLoading.set(false); },
    });
  }

  toggleCardExpand(id: string) {
    this.expandedCardId.update(cur => cur === id ? null : id);
  }

  // ── Header helpers ────────────────────────────────────────────────────
  headerGradient() {
    if (this.view() === 'decks' && this.selectedSubject())
      return this.subjectGradient(this.selectedSubject()!.color);
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
  progressPct(mastered: number, total: number): number {
    return total > 0 ? Math.round(mastered / total * 100) : 0;
  }

  // ── Card state helpers ─────────────────────────────────────────────────
  stateLabel(state: number): string { return STATE_LABELS[state] ?? 'Không rõ'; }
  stateClass(state: number): string { return STATE_CLASSES[state] ?? ''; }

  reviewDateLabel(card: Card): string {
    if (!card.nextReviewDate) return 'Mới';
    const today = new Date(); today.setHours(0,0,0,0);
    const due   = new Date(card.nextReviewDate + 'T00:00:00');
    const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0)  return `Quá hạn ${-diff} ngày`;
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    if (diff <= 7)  return `${diff} ngày nữa`;
    return `${diff} ngày`;
  }
  reviewDateClass(card: Card): string {
    if (!card.nextReviewDate) return 'review-later';
    const today = new Date(); today.setHours(0,0,0,0);
    const due   = new Date(card.nextReviewDate + 'T00:00:00');
    const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0)  return 'review-due';
    if (diff === 0) return 'review-today';
    if (diff <= 3)  return 'review-soon';
    return 'review-later';
  }

  reminderBadgeText(sub: Subject): string {
    if (!sub.reminderEnabled) return '';
    switch (sub.reminderType) {
      case 'MINUTES': return `${sub.reminderInterval} phút`;
      case 'HOURS':   return `${sub.reminderInterval} giờ`;
      case 'DAILY':   return sub.reminderTime ?? 'Hằng ngày';
      case 'WEEKLY':  return 'Hằng tuần';
      default:        return 'Nhắc nhở';
    }
  }

  // ── Subject CRUD ──────────────────────────────────────────────────────
  openCreateSubject() {
    this.editingSubject.set(null);
    this.subjectForm = {
      name: '', emoji: '📚', color: '#6366f1',
      reminderEnabled: false, reminderType: 'DAILY', reminderInterval: 30, reminderTime: '20:00',
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

  // ── Deck CRUD ─────────────────────────────────────────────────────────
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
      if (this.selectedSubject()) {
        this.svc.subjects.update(list => list.map(s =>
          s.id === this.selectedSubject()!.id ? {...s, deckCount: s.deckCount - 1} : s
        ));
      }
    });
  }

  // ── Card CRUD ─────────────────────────────────────────────────────────
  openCreateCard() {
    this.editingCard.set(null);
    this.cardForm = { frontText: '', backText: '', source: '', contentFormat: 'plain' };
    this.cardTagsInput = '';
    this.showCardModal.set(true);
  }

  openEditCard(card: Card) {
    this.editingCard.set(card);
    this.cardForm = {
      frontText: card.frontText ?? '',
      backText: card.backText ?? '',
      source: card.source ?? '',
      contentFormat: card.contentFormat ?? 'plain',
    };
    this.cardTagsInput = card.tags?.join(', ') ?? '';
    this.showCardModal.set(true);
  }

  closeCardModal() { this.showCardModal.set(false); this.editingCard.set(null); }

  saveCard() {
    const deck = this.selectedDeck();
    if (!deck) return;
    const tags = this.cardTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const req: CreateCardRequest = {
      deckId: deck.id,
      frontText: this.cardForm.frontText.trim(),
      backText:  this.cardForm.backText.trim(),
      tags:      tags.length ? tags : undefined,
      source:    this.cardForm.source?.trim() || undefined,
      contentFormat: this.cardForm.contentFormat,
    };
    this.savingCard.set(true);
    const isEditing = !!this.editingCard();
    const op = isEditing
      ? this.svc.updateCard(deck.id, this.editingCard()!.id, req)
      : this.svc.createCard(deck.id, req);
    op.subscribe({
      next: res => {
        this.savingCard.set(false); this.closeCardModal();
        if (isEditing) {
          this.cards.update(list => list.map(c => c.id === res.data.id ? res.data : c));
        } else {
          this.cards.update(list => [...list, res.data]);
          this.svc.decks.update(list => list.map(d => d.id === deck.id ? {...d, cardCount: d.cardCount + 1} : d));
        }
      },
      error: () => this.savingCard.set(false),
    });
  }

  // ── Rich Text Formatting ─────────────────────────────────────────────
  deleteCard(card: Card) {
    const deck = this.selectedDeck();
    if (!deck || !confirm('Xóa thẻ này?')) return;
    this.svc.deleteCard(deck.id, card.id).subscribe(() => {
      this.cards.update(list => list.filter(c => c.id !== card.id));
      this.svc.decks.update(list => list.map(d => d.id === deck.id ? {...d, cardCount: d.cardCount - 1} : d));
    });
  }

  formatText(format: string, event?: Event) {
    const FONT_SIZE_MAP: Record<string, string> = {
      small: '2', medium: '3', large: '4', xlarge: '5',
    };
    switch (format) {
      case 'bold':      document.execCommand('bold', false); break;
      case 'italic':    document.execCommand('italic', false); break;
      case 'underline': document.execCommand('underline', false); break;
      case 'strike':    document.execCommand('strikeThrough', false); break;
      case 'fontSize': {
        const val = (event!.target as HTMLSelectElement).value;
        if (val) document.execCommand('fontSize', false, FONT_SIZE_MAP[val] ?? '3');
        break;
      }
      case 'color': {
        const val = (event!.target as HTMLInputElement).value;
        if (val) document.execCommand('foreColor', false, val);
        break;
      }
      case 'highlight': {
        const val = (event!.target as HTMLInputElement).value;
        if (val) document.execCommand('hiliteColor', false, val);
        break;
      }
    }
  }

  onEditorInput(event: Event, field: 'frontText' | 'backText', editorEl: HTMLElement) {
    this.cardForm[field] = editorEl.innerHTML;
    // Auto-set contentFormat to html if any tag detected
    if (!this.cardForm.contentFormat || this.cardForm.contentFormat === 'plain') {
      const hasHtml = /<[^>]+>/.test(editorEl.innerHTML);
      if (hasHtml) this.cardForm.contentFormat = 'html';
    }
  }

  // ── AI Generation ─────────────────────────────────────────────────────
  openAiModal() {
    this.resetAiModal();
    this.showAiModal.set(true);
  }

  closeAiModal() { this.showAiModal.set(false); }

  resetAiModal() {
    this.aiText = '';
    this.aiMaxCards = 10;
    this.aiResults.set([]);
    this.aiSelected.set([]);
    this.aiError.set(null);
    this.aiGenerating.set(false);
    this.aiSaving.set(false);
  }

  generateAiCards() {
    const deck = this.selectedDeck();
    if (!deck || !this.aiText.trim()) return;
    const maxCards = Math.min(Math.max(1, this.aiMaxCards), 20);
    this.aiGenerating.set(true);
    this.aiError.set(null);
    this.aiResults.set([]);
    this.aiSelected.set([]);
    this.svc.generateCards(this.aiText.trim(), deck.id, maxCards).subscribe({
      next: res => {
        const cards = res.data ?? [];
        this.aiResults.set(cards);
        this.aiSelected.set(cards.map(() => true));
        this.aiGenerating.set(false);
      },
      error: err => {
        this.aiError.set(err?.error?.message ?? 'Không thể tạo thẻ. Vui lòng thử lại.');
        this.aiGenerating.set(false);
      },
    });
  }

  toggleAiCard(index: number) {
    this.aiSelected.update(arr => { const c = [...arr]; c[index] = !c[index]; return c; });
  }

  selectedAiCount(): number { return this.aiSelected().filter(Boolean).length; }

  saveAiCards() {
    const deck = this.selectedDeck();
    if (!deck) return;
    const toSave = this.aiResults().filter((_, i) => this.aiSelected()[i]);
    if (toSave.length === 0) return;
    this.aiSaving.set(true);
    let saved = 0; let failed = 0;
    const saveNext = (idx: number) => {
      if (idx >= toSave.length) {
        this.aiSaving.set(false);
        if (failed > 0) {
          this.aiError.set(`Lưu thất bại ${failed} thẻ. Đã lưu ${saved} thẻ.`);
        } else {
          this.svc.decks.update(list => list.map(d => d.id === deck.id ? { ...d, cardCount: d.cardCount + saved } : d));
          this.loadCards(deck.id);
          this.closeAiModal();
        }
        return;
      }
      const c = toSave[idx];
      this.svc.createCard(deck.id, { deckId: deck.id, frontText: c.front, backText: c.back }).subscribe({
        next: () => { saved++; saveNext(idx + 1); },
        error: () => { failed++; saveNext(idx + 1); },
      });
    };
    saveNext(0);
  }
}
