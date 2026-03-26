import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../core/models/api.model';
import { User } from '../../core/models/auth.model';
import { environment } from '../../../environments/environment';

interface BadgeDto {
  code: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  earnedAt: string | null;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .page { padding: 32px; max-width: 720px; margin: 0 auto; }
  @media (max-width: 640px) { .page { padding: 16px; } }

  /* Page header */
  .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
  .page-icon {
    display: flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; border-radius: 15px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99,102,241,0.30);
  }
  .page-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
  .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -0.02em; }
  .page-sub  { font-size: 0.875rem; color: #94a3b8; margin: 3px 0 0; }

  /* Card base */
  .card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.9);
    padding: 28px 32px;
    margin-bottom: 20px;
  }
  @media (max-width: 640px) { .card { padding: 20px 16px; } }

  /* Profile card */
  .profile-card { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .avatar {
    width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 2rem; font-weight: 700;
    box-shadow: 0 6px 20px rgba(99,102,241,0.35);
    user-select: none;
  }
  .profile-info { flex: 1; min-width: 0; }
  .profile-name { font-size: 1.15rem; font-weight: 700; color: #1e1b4b; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-email { font-size: 0.875rem; color: #64748b; margin: 0 0 8px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
  }
  .badge-role  { background: rgba(99,102,241,0.1); color: #6366f1; }
  .badge-xp    { background: rgba(245,158,11,0.1); color: #d97706; }
  .badge-coin  { background: rgba(16,185,129,0.1); color: #059669; }

  /* Section title */
  .section-title {
    font-size: 1rem; font-weight: 700; color: #1e1b4b;
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(99,102,241,0.1);
    display: flex; align-items: center; gap: 8px;
  }
  .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6366f1; }

  /* Form */
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 6px; letter-spacing: 0.04em; text-transform: uppercase; }
  .form-control {
    width: 100%; padding: 10px 14px;
    background: rgba(255,255,255,0.9);
    border: 1.5px solid rgba(99,102,241,0.2);
    border-radius: 10px;
    font-size: 0.9rem; color: #1e293b;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .form-control:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .form-control:disabled { opacity: 0.55; cursor: not-allowed; background: rgba(241,245,249,0.8); }
  select.form-control { cursor: pointer; }

  /* Buttons */
  .btn-save {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-weight: 600; font-size: 0.9rem;
    border: none; border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(99,102,241,0.30);
    transition: opacity 0.2s, transform 0.1s;
  }
  .btn-save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .btn-save:active:not(:disabled) { transform: translateY(0); }
  .btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
  .btn-save mat-icon { font-size: 18px; width: 18px; height: 18px; }

  /* Alerts */
  .alert {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 10px;
    font-size: 0.875rem; font-weight: 500;
    margin-bottom: 16px;
  }
  .alert mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .alert-success { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
  .alert-error   { background: rgba(239,68,68,0.08);  color: #dc2626; border: 1px solid rgba(239,68,68,0.15); }

  /* Badge gallery */
  .badge-count {
    margin-left: auto; font-size: 0.8rem; font-weight: 600;
    color: #6366f1; background: rgba(99,102,241,0.1);
    padding: 2px 10px; border-radius: 20px;
  }
  .badge-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  .badge-tile {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px; border-radius: 14px; text-align: center;
    border: 1px solid transparent; transition: all 0.18s; cursor: default;
  }
  .badge-earned {
    background: rgba(255,255,255,0.85);
    border-color: rgba(99,102,241,0.25);
    box-shadow: 0 2px 12px rgba(99,102,241,0.1);
  }
  .badge-earned:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.15); }
  .badge-locked {
    background: rgba(148,163,184,0.06);
    border-color: rgba(148,163,184,0.2);
    filter: grayscale(1); opacity: 0.55;
  }
  .badge-emoji { font-size: 1.75rem; line-height: 1; }
  .badge-name { font-size: 0.75rem; font-weight: 700; color: #1e1b4b; margin: 0; }
  .badge-date { font-size: 0.65rem; color: #6366f1; margin: 0; font-weight: 500; }
  .badge-hint { font-size: 0.65rem; color: #94a3b8; margin: 0; line-height: 1.3; }

  .badges-loading { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
  .badge-skeleton {
    height: 100px; border-radius: 14px;
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%; animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Password field with toggle */
  .pw-field-wrap { position: relative; }
  .pw-field-wrap .form-control { padding-right: 44px; }
  .pw-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; padding: 4px;
    color: #94a3b8; display: flex; align-items: center;
    transition: color 0.15s;
  }
  .pw-toggle:hover { color: #6366f1; }
  .pw-toggle mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .field-hint { font-size: 0.78rem; margin: 5px 0 0; font-weight: 500; }
  .field-hint.error { color: #dc2626; }

  /* Coming soon banner */
  .coming-soon {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    background: rgba(148,163,184,0.08);
    border: 1.5px dashed rgba(148,163,184,0.4);
    border-radius: 12px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .coming-soon mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

  /* Read-only info row */
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(99,102,241,0.06); }
  .info-row:last-child { border-bottom: none; padding-bottom: 0; }
  .info-label { font-size: 0.85rem; color: #64748b; font-weight: 500; }
  .info-value { font-size: 0.875rem; color: #1e293b; font-weight: 600; text-align: right; }
  .verified-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
  }
  .verified-badge.yes { background: rgba(16,185,129,0.1); color: #059669; }
  .verified-badge.no  { background: rgba(239,68,68,0.08);  color: #dc2626; }
  .verified-badge mat-icon { font-size: 13px; width: 13px; height: 13px; }

  /* Loading skeleton */
  .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

// ─── Timezone list ────────────────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (GMT+7)' },
  { value: 'Asia/Bangkok',     label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Singapore',   label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo',       label: 'Tokyo (GMT+9)' },
  { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
  { value: 'Europe/London',    label: 'London (GMT+0/+1)' },
  { value: 'UTC',              label: 'UTC (GMT+0)' },
];

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  styles: [STYLES],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-icon">
          <mat-icon>settings</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Cài đặt</h1>
          <p class="page-sub">Tuỳ chỉnh thông tin cá nhân và tài khoản</p>
        </div>
      </div>

      <!-- ── 1. Profile card ─────────────────────────────────────────────── -->
      <div class="card">
        @if (loading()) {
          <!-- skeleton -->
          <div class="profile-card">
            <div class="skeleton" style="width:72px;height:72px;border-radius:50%;"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
              <div class="skeleton" style="height:18px;width:50%;"></div>
              <div class="skeleton" style="height:14px;width:70%;"></div>
              <div style="display:flex;gap:8px;">
                <div class="skeleton" style="height:22px;width:60px;border-radius:20px;"></div>
                <div class="skeleton" style="height:22px;width:60px;border-radius:20px;"></div>
              </div>
            </div>
          </div>
        } @else if (profile()) {
          <div class="profile-card">
            <div class="avatar">{{ initials() }}</div>
            <div class="profile-info">
              <p class="profile-name">{{ profile()!.displayName }}</p>
              <p class="profile-email">{{ profile()!.email }}</p>
              <div class="badges">
                <span class="badge badge-role">
                  <mat-icon style="font-size:12px;width:12px;height:12px;">
                    {{ profile()!.role === 'ADMIN' ? 'admin_panel_settings' : 'person' }}
                  </mat-icon>
                  {{ profile()!.role }}
                </span>
                <span class="badge badge-xp">
                  <mat-icon style="font-size:12px;width:12px;height:12px;">bolt</mat-icon>
                  {{ profile()!.xpTotal | number }} XP
                </span>
                <span class="badge badge-coin">
                  <mat-icon style="font-size:12px;width:12px;height:12px;">monetization_on</mat-icon>
                  {{ profile()!.coinBalance | number }}
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── 2. Edit profile form ────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title">
          <mat-icon>edit</mat-icon>
          Chỉnh sửa hồ sơ
        </h2>

        @if (saveSuccess()) {
          <div class="alert alert-success">
            <mat-icon>check_circle</mat-icon>
            Đã lưu thành công
          </div>
        }
        @if (saveError()) {
          <div class="alert alert-error">
            <mat-icon>error</mat-icon>
            {{ saveError() }}
          </div>
        }

        <div class="form-group">
          <label class="form-label">Tên hiển thị</label>
          <input
            class="form-control"
            type="text"
            placeholder="Nhập tên hiển thị"
            [ngModel]="editName()"
            (ngModelChange)="editName.set($event)"
            [disabled]="loading() || saving()"
            minlength="2"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Múi giờ</label>
          <select
            class="form-control"
            [ngModel]="editTimezone()"
            (ngModelChange)="editTimezone.set($event)"
            [disabled]="loading() || saving()"
          >
            @for (tz of timezones; track tz.value) {
              <option [value]="tz.value">{{ tz.label }}</option>
            }
          </select>
        </div>

        <button
          class="btn-save"
          (click)="save()"
          [disabled]="loading() || saving() || editName().trim().length < 2"
        >
          @if (saving()) {
            <mat-icon style="animation:spin 1s linear infinite;">sync</mat-icon>
            Đang lưu...
          } @else {
            <mat-icon>save</mat-icon>
            Lưu thay đổi
          }
        </button>

        <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
      </div>

      <!-- ── 3. Goal section ────────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title">
          <mat-icon>flag</mat-icon>
          Mục tiêu học tập
        </h2>

        @if (goalSaveSuccess()) {
          <div class="alert alert-success">
            <mat-icon>check_circle</mat-icon>
            Đã lưu mục tiêu
          </div>
        }
        @if (goalSaveError()) {
          <div class="alert alert-error">
            <mat-icon>error</mat-icon>
            {{ goalSaveError() }}
          </div>
        }

        <div class="form-group">
          <label class="form-label">Phút học mỗi ngày</label>
          <input
            class="form-control"
            type="number"
            min="10"
            max="480"
            step="5"
            placeholder="Ví dụ: 60"
            [ngModel]="goalMinutes()"
            (ngModelChange)="goalMinutes.set($event)"
            [disabled]="goalLoading() || goalSaving()"
          />
        </div>

        <button
          class="btn-save"
          (click)="saveGoal()"
          [disabled]="goalLoading() || goalSaving() || goalMinutes() < 10 || goalMinutes() > 480"
        >
          @if (goalSaving()) {
            <mat-icon style="animation:spin 1s linear infinite;">sync</mat-icon>
            Đang lưu...
          } @else {
            <mat-icon>save</mat-icon>
            Lưu mục tiêu
          }
        </button>
      </div>

      <!-- ── 5. Badge gallery ───────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title">
          <mat-icon>military_tech</mat-icon>
          Huy hiệu của bạn
          <span class="badge-count">{{ earnedBadgeCount() }} / {{ badges().length }}</span>
        </h2>

        @if (badgesLoading()) {
          <div class="badges-loading">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="badge-skeleton"></div>
            }
          </div>
        } @else {
          <div class="badge-grid">
            @for (b of badges(); track b.code) {
              <div class="badge-tile" [class.badge-earned]="b.earned" [class.badge-locked]="!b.earned" [title]="b.description">
                <div class="badge-emoji">{{ b.emoji }}</div>
                <p class="badge-name">{{ b.name }}</p>
                @if (b.earned) {
                  <p class="badge-date">{{ formatBadgeDate(b.earnedAt) }}</p>
                } @else {
                  <p class="badge-hint">{{ b.description }}</p>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- ── 6. Password section ─────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title">
          <mat-icon>lock</mat-icon>
          Đổi mật khẩu
        </h2>

        @if (pwSuccess()) {
          <div class="alert alert-success">
            <mat-icon>check_circle</mat-icon>
            Đổi mật khẩu thành công
          </div>
        }
        @if (pwError()) {
          <div class="alert alert-error">
            <mat-icon>error</mat-icon>
            {{ pwError() }}
          </div>
        }

        <div class="form-group">
          <label class="form-label">Mật khẩu hiện tại</label>
          <div class="pw-field-wrap">
            <input
              class="form-control"
              [type]="showCurrentPw() ? 'text' : 'password'"
              placeholder="Nhập mật khẩu hiện tại"
              [ngModel]="currentPw()"
              (ngModelChange)="currentPw.set($event)"
              [disabled]="pwSaving()"
              autocomplete="current-password"
            />
            <button type="button" class="pw-toggle" (click)="showCurrentPw.set(!showCurrentPw())" tabindex="-1">
              <mat-icon>{{ showCurrentPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mật khẩu mới</label>
          <div class="pw-field-wrap">
            <input
              class="form-control"
              [type]="showNewPw() ? 'text' : 'password'"
              placeholder="Tối thiểu 6 ký tự"
              [ngModel]="newPw()"
              (ngModelChange)="newPw.set($event)"
              [disabled]="pwSaving()"
              autocomplete="new-password"
            />
            <button type="button" class="pw-toggle" (click)="showNewPw.set(!showNewPw())" tabindex="-1">
              <mat-icon>{{ showNewPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          @if (newPw().length > 0 && newPw().length < 6) {
            <p class="field-hint error">Mật khẩu phải có ít nhất 6 ký tự</p>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Xác nhận mật khẩu mới</label>
          <div class="pw-field-wrap">
            <input
              class="form-control"
              [type]="showConfirmPw() ? 'text' : 'password'"
              placeholder="Nhập lại mật khẩu mới"
              [ngModel]="confirmPw()"
              (ngModelChange)="confirmPw.set($event)"
              [disabled]="pwSaving()"
              autocomplete="new-password"
            />
            <button type="button" class="pw-toggle" (click)="showConfirmPw.set(!showConfirmPw())" tabindex="-1">
              <mat-icon>{{ showConfirmPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          @if (confirmPw().length > 0 && confirmPw() !== newPw()) {
            <p class="field-hint error">Mật khẩu không khớp</p>
          }
        </div>

        <button
          class="btn-save"
          (click)="changePassword()"
          [disabled]="pwSaving() || !pwFormValid()"
        >
          @if (pwSaving()) {
            <mat-icon style="animation:spin 1s linear infinite;">sync</mat-icon>
            Đang lưu...
          } @else {
            <mat-icon>lock_reset</mat-icon>
            Đổi mật khẩu
          }
        </button>
      </div>

      <!-- ── 6. Account info (read-only) ────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title">
          <mat-icon>info</mat-icon>
          Thông tin tài khoản
        </h2>

        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="info-row">
              <div class="skeleton" style="height:14px;width:30%;"></div>
              <div class="skeleton" style="height:14px;width:40%;"></div>
            </div>
          }
        } @else if (profile()) {
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ profile()!.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Thành viên từ</span>
            <span class="info-value">{{ formatDate(profile()!.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Xác minh email</span>
            <span [class]="'verified-badge ' + (profile()!.emailVerified ? 'yes' : 'no')">
              <mat-icon>{{ profile()!.emailVerified ? 'verified' : 'cancel' }}</mat-icon>
              {{ profile()!.emailVerified ? 'Đã xác minh' : 'Chưa xác minh' }}
            </span>
          </div>
        }
      </div>

    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);

  // ─── Exposed timezone list for template ───────────────────────────────────
  readonly timezones = TIMEZONES;

  // ─── State signals ────────────────────────────────────────────────────────
  profile    = signal<User | null>(null);
  loading    = signal(true);
  saving     = signal(false);
  saveSuccess = signal(false);
  saveError   = signal<string | null>(null);
  editName     = signal('');
  editTimezone = signal('');

  // ─── Badge signals ────────────────────────────────────────────────────────
  badges        = signal<BadgeDto[]>([]);
  badgesLoading = signal(false);
  earnedBadgeCount = () => this.badges().filter(b => b.earned).length;

  // ─── Password change signals ──────────────────────────────────────────────
  currentPw    = signal('');
  newPw        = signal('');
  confirmPw    = signal('');
  showCurrentPw = signal(false);
  showNewPw    = signal(false);
  showConfirmPw = signal(false);
  pwSaving     = signal(false);
  pwSuccess    = signal(false);
  pwError      = signal<string | null>(null);
  pwFormValid  = () =>
    this.currentPw().length > 0 &&
    this.newPw().length >= 6 &&
    this.confirmPw() === this.newPw();

  // ─── Goal signals ─────────────────────────────────────────────────────────
  goalMinutes    = signal<number>(60);
  goalLoading    = signal(false);
  goalSaving     = signal(false);
  goalSaveSuccess = signal(false);
  goalSaveError   = signal<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────
  initials() {
    const name = this.profile()?.displayName ?? '';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProfile();
    this.loadGoal();
    this.loadBadges();
  }

  // ─── Load profile from API ───────────────────────────────────────────────
  private loadProfile(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/me`).subscribe({
      next: res => {
        this.profile.set(res.data);
        this.editName.set(res.data.displayName);
        this.editTimezone.set(res.data.timezone ?? 'Asia/Ho_Chi_Minh');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // ─── Save PATCH /api/v1/users/me ─────────────────────────────────────────
  save(): void {
    if (this.saving() || this.editName().trim().length < 2) return;

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    const body: { displayName?: string; timezone?: string } = {
      displayName: this.editName().trim(),
      timezone: this.editTimezone(),
    };

    this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, body).subscribe({
      next: res => {
        this.profile.set(res.data);
        this.saving.set(false);
        this.saveSuccess.set(true);
        // Auto-hide success banner after 3 seconds
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: err => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
        this.saveError.set(msg);
      },
    });
  }

  // ─── Change password PATCH /api/v1/users/me/password ─────────────────────
  changePassword(): void {
    if (this.pwSaving() || !this.pwFormValid()) return;

    this.pwSaving.set(true);
    this.pwSuccess.set(false);
    this.pwError.set(null);

    this.http.patch<{ success: boolean }>(
      `${environment.apiUrl}/users/me/password`,
      { currentPassword: this.currentPw(), newPassword: this.newPw() }
    ).subscribe({
      next: () => {
        this.pwSaving.set(false);
        this.pwSuccess.set(true);
        this.currentPw.set('');
        this.newPw.set('');
        this.confirmPw.set('');
        setTimeout(() => this.pwSuccess.set(false), 3000);
      },
      error: err => {
        this.pwSaving.set(false);
        const msg = err?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
        this.pwError.set(msg);
      },
    });
  }

  // ─── Load current goal from API ──────────────────────────────────────────
  private loadGoal(): void {
    this.goalLoading.set(true);
    this.http.get<{ success: boolean; data: { goalStudyMinutesPerDay: number } }>(
      `${environment.apiUrl}/goals/me`
    ).subscribe({
      next: res => {
        this.goalMinutes.set(res.data.goalStudyMinutesPerDay);
        this.goalLoading.set(false);
      },
      error: () => {
        this.goalLoading.set(false);
      },
    });
  }

  // ─── Save goal via PUT /api/v1/goals/me ──────────────────────────────────
  saveGoal(): void {
    const minutes = this.goalMinutes();
    if (this.goalSaving() || minutes < 10 || minutes > 480) return;

    this.goalSaving.set(true);
    this.goalSaveSuccess.set(false);
    this.goalSaveError.set(null);

    this.http.put<{ success: boolean }>(
      `${environment.apiUrl}/goals/me`,
      { goalStudyMinutesPerDay: minutes, goalCardsPerDay: 20 }
    ).subscribe({
      next: () => {
        this.goalSaving.set(false);
        this.goalSaveSuccess.set(true);
        // Auto-hide success banner after 3 seconds
        setTimeout(() => this.goalSaveSuccess.set(false), 3000);
      },
      error: err => {
        this.goalSaving.set(false);
        const msg = err?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
        this.goalSaveError.set(msg);
      },
    });
  }

  // ─── Load badges ─────────────────────────────────────────────────────────
  private loadBadges(): void {
    this.badgesLoading.set(true);
    this.http.get<ApiResponse<BadgeDto[]>>(`${environment.apiUrl}/badges/me`).subscribe({
      next: res => {
        this.badges.set(res.data ?? []);
        this.badgesLoading.set(false);
      },
      error: () => this.badgesLoading.set(false),
    });
  }

  formatBadgeDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  // ─── Format createdAt → "Tháng M năm YYYY" ───────────────────────────────
  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `Tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  }
}
