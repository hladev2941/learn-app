import { Component, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { interval, Subscription } from 'rxjs';
import { TimerService, TodayStats } from './timer.service';

type TimerMode = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK' | 'CUSTOM';
type TimerState = 'idle' | 'running' | 'paused' | 'done';

interface RewardPopup {
  xp: number;
  coins: number;
  streak: number;
  badgeName: string | null;
}

const PRESETS: Record<TimerMode, number> = {
  POMODORO: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  CUSTOM: 30 * 60,
};

const PAGE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .page { padding: 32px; max-width: 860px; margin: 0 auto; }
  @media (max-width: 640px) { .page { padding: 16px; } }

  .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
  .page-icon {
    display: flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; border-radius: 15px;
    background: linear-gradient(135deg,#f59e0b,#fbbf24);
    color: white; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(245,158,11,0.3);
  }
  .page-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
  .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -0.02em; }
  .page-sub { font-size: 0.875rem; color: #94a3b8; margin: 3px 0 0; }

  /* Mode tabs */
  .mode-tabs {
    display: flex; gap: 8px; margin-bottom: 28px;
    background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 16px; padding: 6px;
    box-shadow: 0 2px 12px rgba(99,102,241,0.06);
    flex-wrap: wrap;
  }
  .mode-tab {
    flex: 1; min-width: 80px; padding: 8px 14px;
    border: none; border-radius: 12px; cursor: pointer;
    font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
    background: transparent; color: #64748b;
    white-space: nowrap;
  }
  .mode-tab:hover { background: rgba(99,102,241,0.06); color: #4f46e5; }
  .mode-tab.active { background: linear-gradient(135deg,#f59e0b,#fbbf24); color: white; box-shadow: 0 3px 10px rgba(245,158,11,0.3); }
  .mode-tab.break-tab.active { background: linear-gradient(135deg,#22c55e,#4ade80); box-shadow: 0 3px 10px rgba(34,197,94,0.3); }
  .mode-tab.custom-tab.active { background: linear-gradient(135deg,#8b5cf6,#a78bfa); box-shadow: 0 3px 10px rgba(139,92,246,0.3); }

  /* Main card */
  .timer-card {
    background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8); border-radius: 24px;
    padding: 48px 32px; text-align: center; margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
  }

  /* SVG Ring */
  .ring-wrapper { position: relative; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 32px; }
  .ring-svg { transform: rotate(-90deg); }
  .ring-bg { fill: none; stroke: #f1f5f9; stroke-width: 8; }
  .ring-progress { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.9s ease, stroke 0.4s ease; }
  .ring-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .time-display { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.04em; color: #1e1b4b; line-height: 1; }
  .time-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-top: 6px; letter-spacing: 0.08em; text-transform: uppercase; }

  /* Controls */
  .controls { display: flex; align-items: center; justify-content: center; gap: 16px; }
  .btn-main {
    width: 64px; height: 64px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg,#f59e0b,#fbbf24);
    color: white; box-shadow: 0 6px 20px rgba(245,158,11,0.4);
    transition: all 0.2s; font-size: 0;
  }
  .btn-main:hover { transform: scale(1.07); box-shadow: 0 8px 24px rgba(245,158,11,0.5); }
  .btn-main:active { transform: scale(0.97); }
  .btn-main mat-icon { font-size: 28px; width: 28px; height: 28px; }
  .btn-main.break { background: linear-gradient(135deg,#22c55e,#4ade80); box-shadow: 0 6px 20px rgba(34,197,94,0.4); }
  .btn-main.custom { background: linear-gradient(135deg,#8b5cf6,#a78bfa); box-shadow: 0 6px 20px rgba(139,92,246,0.4); }
  .btn-main.running { background: linear-gradient(135deg,#f43f5e,#fb7185); box-shadow: 0 6px 20px rgba(244,63,94,0.4); }

  .btn-secondary {
    width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: rgba(99,102,241,0.06); color: #64748b;
    transition: all 0.2s; font-size: 0;
  }
  .btn-secondary:hover { background: rgba(99,102,241,0.12); color: #4f46e5; }
  .btn-secondary mat-icon { font-size: 20px; width: 20px; height: 20px; }

  /* Custom input */
  .custom-inputs {
    display: flex; gap: 16px; justify-content: center; align-items: center;
    margin-bottom: 24px; flex-wrap: wrap;
  }
  .input-group { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .input-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
  .input-field {
    width: 80px; padding: 8px 12px; border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-size: 1.1rem; font-weight: 700; color: #1e1b4b;
    text-align: center; outline: none; background: white; transition: border-color 0.2s;
  }
  .input-field:focus { border-color: #8b5cf6; }

  /* Stats bar */
  .stats-bar {
    display: flex; gap: 12px; flex-wrap: wrap;
  }
  .stat-card {
    flex: 1; min-width: 120px;
    background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8); border-radius: 16px;
    padding: 16px 20px; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 2px 12px rgba(99,102,241,0.06);
  }
  .stat-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .stat-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .stat-val { font-size: 1.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; }
  .stat-lbl { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

  /* Done overlay */
  .done-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg,#22c55e,#4ade80);
    color: white; border-radius: 50px; padding: 8px 20px;
    font-size: 0.875rem; font-weight: 700; margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(34,197,94,0.35);
  }
  .done-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .done-info { font-size: 0.875rem; color: #64748b; margin: 0; }

  /* Bottom row toggles */
  .bottom-row {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 16px; flex-wrap: wrap;
  }
  .toggle-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 50px; border: 1.5px solid #e2e8f0;
    background: white; cursor: pointer; font-size: 0.8rem; font-weight: 600;
    color: #64748b; transition: all 0.2s;
  }
  .toggle-btn:hover { border-color: #6366f1; color: #6366f1; }
  .toggle-btn.on { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.06); }
  .toggle-btn.auto-on { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }
  .toggle-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

  /* Auto-switch countdown banner */
  .auto-banner {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: 14px; padding: 10px 18px;
    background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #4f46e5;
    flex-wrap: wrap;
  }
  .auto-banner .countdown-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: #6366f1; color: white; font-size: 0.8rem; font-weight: 800;
  }
  .cancel-btn {
    padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0;
    background: white; cursor: pointer; font-size: 0.75rem; font-weight: 600;
    color: #64748b; transition: all 0.2s;
  }
  .cancel-btn:hover { border-color: #f43f5e; color: #f43f5e; }

  /* Next mode indicator dot on tabs */
  .mode-tab.next-up { box-shadow: inset 0 0 0 2px #6366f1; }

  /* Reward overlay */
  .reward-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: fadeIn 0.25s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .reward-card {
    background: white; border-radius: 28px;
    padding: 40px 48px; text-align: center;
    max-width: 360px; width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    cursor: pointer;
    position: relative; overflow: hidden;
  }
  @keyframes popIn {
    from { transform: scale(0.7); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .reward-emoji { font-size: 3.5rem; line-height: 1; margin-bottom: 8px; }
  .reward-title { font-size: 1.5rem; font-weight: 800; color: #1e1b4b; margin: 0 0 24px; }
  .reward-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
  .reward-item {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: rgba(99,102,241,0.05); border-radius: 12px; padding: 12px 20px;
  }
  .reward-item-icon { font-size: 1.5rem; }
  .reward-item-val { font-size: 1.25rem; font-weight: 800; color: #1e1b4b; }
  .reward-item-lbl { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
  .reward-progress-bar {
    position: absolute; bottom: 0; left: 0;
    height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6);
    transition: width 0.05s linear;
  }
  .reward-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 8px; }
`;

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatRippleModule],
  styles: [PAGE_STYLES],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-icon">
          <mat-icon>timer</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Hẹn giờ học</h1>
          <p class="page-sub">Pomodoro timer giúp bạn tập trung</p>
        </div>
      </div>

      <!-- Mode tabs -->
      <div class="mode-tabs">
        @for (m of modes; track m.key) {
          <button class="mode-tab"
            [class.active]="mode() === m.key"
            [class.break-tab]="m.isBreak"
            [class.custom-tab]="m.key === 'CUSTOM'"
            [class.next-up]="nextMode() === m.key && state() === 'done' && autoSwitch()"
            (click)="setMode(m.key)" [disabled]="state() === 'running'">
            {{ m.label }}
          </button>
        }
      </div>

      <!-- Timer card -->
      <div class="timer-card">
        @if (doneInfo()) {
          <div style="margin-bottom:20px">
            <div class="done-badge"><mat-icon>check_circle</mat-icon> Hoàn thành!</div>
            <p class="done-info">{{ doneInfo() }}</p>
          </div>
        }

        <!-- Custom mode inputs -->
        @if (mode() === 'CUSTOM' && state() === 'idle') {
          <div class="custom-inputs">
            <div class="input-group">
              <span class="input-label">Phút học</span>
              <input class="input-field" type="number" [(ngModel)]="customStudyMin" min="1" max="180"
                (ngModelChange)="onCustomChange()" />
            </div>
            <mat-icon style="color:#94a3b8">arrow_forward</mat-icon>
            <div class="input-group">
              <span class="input-label">Phút nghỉ</span>
              <input class="input-field" type="number" [(ngModel)]="customBreakMin" min="1" max="60"
                (ngModelChange)="onCustomChange()" />
            </div>
          </div>
        }

        <!-- Ring -->
        <div class="ring-wrapper">
          <svg class="ring-svg" width="220" height="220" viewBox="0 0 220 220">
            <circle class="ring-bg" cx="110" cy="110" r="96"/>
            <circle class="ring-progress"
              cx="110" cy="110" r="96"
              [attr.stroke]="ringColor()"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="dashOffset()"
            />
          </svg>
          <div class="ring-center">
            <div class="time-display">{{ timeDisplay() }}</div>
            <div class="time-label">{{ modeLabel() }}</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          @if (state() !== 'idle') {
            <button class="btn-secondary" (click)="reset()" matRipple title="Reset">
              <mat-icon>restart_alt</mat-icon>
            </button>
          }
          <button class="btn-main" [class.running]="state() === 'running'" [class.break]="isBreak() && state() !== 'running'" [class.custom]="mode() === 'CUSTOM' && state() !== 'running'"
            (click)="toggleTimer()" matRipple>
            <mat-icon>{{ state() === 'running' ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
          @if (state() !== 'idle') {
            <button class="btn-secondary" (click)="skip()" matRipple title="Bỏ qua">
              <mat-icon>skip_next</mat-icon>
            </button>
          }
        </div>

        <!-- Auto-switch countdown banner -->
        @if (autoSwitchCountdown() > 0) {
          <div class="auto-banner">
            <span>Chuyển sang <strong>{{ nextModeLabel() }}</strong> sau</span>
            <span class="countdown-num">{{ autoSwitchCountdown() }}</span>
            <button class="cancel-btn" (click)="cancelAutoSwitch()">Hủy</button>
          </div>
        }

        <!-- Bottom toggles -->
        <div class="bottom-row">
          <button class="toggle-btn" [class.on]="soundEnabled" (click)="soundEnabled = !soundEnabled">
            <mat-icon>{{ soundEnabled ? 'volume_up' : 'volume_off' }}</mat-icon>
            {{ soundEnabled ? 'Âm thanh bật' : 'Âm thanh tắt' }}
          </button>
          <button class="toggle-btn" [class.auto-on]="autoSwitch()" (click)="autoSwitch.set(!autoSwitch())">
            <mat-icon>{{ autoSwitch() ? 'autorenew' : 'block' }}</mat-icon>
            {{ autoSwitch() ? 'Tự chuyển bật' : 'Tự chuyển tắt' }}
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1)">
            <mat-icon style="color:#f59e0b">local_fire_department</mat-icon>
          </div>
          <div>
            <div class="stat-val">{{ pomodorosToday() }}</div>
            <div class="stat-lbl">Pomodoro hôm nay</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1)">
            <mat-icon style="color:#6366f1">schedule</mat-icon>
          </div>
          <div>
            <div class="stat-val">{{ studyTimeToday() }}</div>
            <div class="stat-lbl">Thời gian học hôm nay</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.1)">
            <mat-icon style="color:#22c55e">emoji_events</mat-icon>
          </div>
          <div>
            <div class="stat-val">{{ pomodorosThisSession }}</div>
            <div class="stat-lbl">Phiên này</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reward popup overlay -->
    @if (showReward()) {
      <div class="reward-overlay" (click)="dismissReward()">
        <div class="reward-card">
          <div class="reward-emoji">🎉</div>
          <h2 class="reward-title">Tuyệt vời!</h2>
          <div class="reward-items">
            @if (showReward()!.xp > 0) {
              <div class="reward-item">
                <span class="reward-item-icon">⭐</span>
                <span class="reward-item-val">+{{ showReward()!.xp }}</span>
                <span class="reward-item-lbl">XP</span>
              </div>
            }
            @if (showReward()!.coins > 0) {
              <div class="reward-item">
                <span class="reward-item-icon">🪙</span>
                <span class="reward-item-val">+{{ showReward()!.coins }}</span>
                <span class="reward-item-lbl">Coin</span>
              </div>
            }
            <div class="reward-item">
              <span class="reward-item-icon">🔥</span>
              <span class="reward-item-val">{{ showReward()!.streak }}</span>
              <span class="reward-item-lbl">ngày streak</span>
            </div>
            @if (showReward()!.badgeName) {
              <div class="reward-item" style="background:rgba(245,158,11,0.08)">
                <span class="reward-item-icon">🏆</span>
                <span class="reward-item-val" style="font-size:1rem">{{ showReward()!.badgeName }}</span>
              </div>
            }
          </div>
          <p class="reward-hint">Nhấn để đóng</p>
          <div class="reward-progress-bar" [style.width.%]="rewardProgress()"></div>
        </div>
      </div>
    }
  `,
})
export class TimerComponent implements OnDestroy {
  private timerSvc = inject(TimerService);

  modes = [
    { key: 'POMODORO' as TimerMode, label: 'Pomodoro 25', isBreak: false },
    { key: 'SHORT_BREAK' as TimerMode, label: 'Nghỉ ngắn 5\'', isBreak: true },
    { key: 'LONG_BREAK' as TimerMode, label: 'Nghỉ dài 15\'', isBreak: true },
    { key: 'CUSTOM' as TimerMode, label: 'Tự chọn', isBreak: false },
  ];

  mode = signal<TimerMode>('POMODORO');
  state = signal<TimerState>('idle');
  remaining = signal(PRESETS['POMODORO']);

  customStudyMin = 30;
  customBreakMin = 10;
  soundEnabled = true;
  pomodorosThisSession = 0;
  doneInfo = signal('');

  autoSwitch = signal(true);
  autoSwitchCountdown = signal(0);
  nextMode = signal<TimerMode | null>(null);

  // Reward popup state
  showReward = signal<RewardPopup | null>(null);
  rewardProgress = signal(100); // countdown bar: 100→0

  // Tracks completed pomodoros to decide short vs long break
  private pomodorosCompleted = 0;
  // CUSTOM mode phase: 'study' | 'break'
  private customPhase: 'study' | 'break' = 'study';
  private autoSwitchTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private rewardTimer: ReturnType<typeof setInterval> | null = null;

  // Today stats
  private todayStats = signal<{ totalSeconds: number; sessionCount: number } | null>(null);

  pomodorosToday = computed(() => this.todayStats()?.sessionCount ?? 0);
  studyTimeToday = computed(() => {
    const s = this.todayStats()?.totalSeconds ?? 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}g ${m}p` : `${m}p`;
  });

  isBreak = computed(() =>
    this.mode() === 'SHORT_BREAK' ||
    this.mode() === 'LONG_BREAK' ||
    (this.mode() === 'CUSTOM' && this.customPhase === 'break')
  );

  readonly circumference = 2 * Math.PI * 96; // r=96

  totalDuration = signal(PRESETS['POMODORO']);

  dashOffset = computed(() => {
    const ratio = this.remaining() / this.totalDuration();
    return this.circumference * (1 - ratio);
  });

  ringColor = computed(() => {
    if (this.mode() === 'SHORT_BREAK' || this.mode() === 'LONG_BREAK') return '#22c55e';
    if (this.mode() === 'CUSTOM' && this.customPhase === 'break') return '#22c55e';
    if (this.mode() === 'CUSTOM') return '#8b5cf6';
    return '#f59e0b';
  });

  timeDisplay = computed(() => {
    const r = this.remaining();
    const m = Math.floor(r / 60).toString().padStart(2, '0');
    const s = (r % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  modeLabel = computed(() => {
    if (this.mode() === 'CUSTOM') return this.customPhase === 'break' ? 'NGHỈ' : 'TỰ CHỌN';
    const labels: Record<TimerMode, string> = {
      POMODORO: 'FOCUS',
      SHORT_BREAK: 'NGHỈ NGẮN',
      LONG_BREAK: 'NGHỈ DÀI',
      CUSTOM: 'TỰ CHỌN',
    };
    return labels[this.mode()];
  });

  nextModeLabel = computed(() => {
    const next = this.nextMode();
    if (!next) return '';
    if (next === 'CUSTOM') {
      return this.customPhase === 'study' ? 'Nghỉ' : 'Tự chọn';
    }
    return { POMODORO: 'Pomodoro', SHORT_BREAK: 'Nghỉ ngắn', LONG_BREAK: 'Nghỉ dài', CUSTOM: 'Tự chọn' }[next];
  });

  private sub: Subscription | null = null;
  private startedAt: Date | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadStats();
  }

  setMode(m: TimerMode) {
    if (this.state() === 'running') return;
    this.clearAutoSwitch();
    if (m === 'CUSTOM') this.customPhase = 'study';
    this.mode.set(m);
    const dur = m === 'CUSTOM' ? this.customStudyMin * 60 : PRESETS[m];
    this.totalDuration.set(dur);
    this.remaining.set(dur);
    this.state.set('idle');
    this.doneInfo.set('');
    this.nextMode.set(null);
    this.clearTimer();
  }

  onCustomChange() {
    if (this.state() !== 'idle') return;
    const dur = this.customStudyMin * 60;
    this.totalDuration.set(dur);
    this.remaining.set(dur);
  }

  toggleTimer() {
    if (this.state() === 'running') {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (!this.startedAt) this.startedAt = new Date();
    this.state.set('running');
    this.doneInfo.set('');
    this.sub = interval(1000).subscribe(() => {
      const r = this.remaining();
      if (r <= 0) {
        this.onTimerDone();
        return;
      }
      this.remaining.set(r - 1);
    });
  }

  pauseTimer() {
    this.state.set('paused');
    this.clearTimer();
  }

  reset() {
    this.clearTimer();
    this.clearAutoSwitch();
    this.startedAt = null;
    this.state.set('idle');
    this.doneInfo.set('');
    this.nextMode.set(null);
    if (this.mode() === 'CUSTOM') this.customPhase = 'study';
    const dur = this.mode() === 'CUSTOM' ? this.customStudyMin * 60 : PRESETS[this.mode()];
    this.totalDuration.set(dur);
    this.remaining.set(dur);
  }

  skip() {
    this.clearTimer();
    this.onTimerDone();
  }

  private onTimerDone() {
    this.clearTimer();
    this.state.set('done');
    if (this.soundEnabled) this.playDoneSound();

    const endedAt = new Date();
    const startedAt = this.startedAt ?? endedAt;
    const durationSecs = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
    const wasBreak = this.isBreak();

    if (!wasBreak && durationSecs >= 60) {
      this.pomodorosThisSession++;
      this.pomodorosCompleted++;
      const sessionType = this.mode() === 'CUSTOM' ? 'CUSTOM' : 'POMODORO';
      this.timerSvc.completeSession(durationSecs, sessionType, startedAt, endedAt).subscribe({
        next: (res) => {
          const xp = res.reward?.xpGranted ?? 0;
          const coins = res.reward?.coinGranted ?? 0;
          const streak = res.streak?.currentStreak ?? 0;
          const badgeName = res.reward?.badgeName ?? null;
          this.showRewardPopup({ xp, coins, streak, badgeName });
          this.loadStats();
        },
        error: () => {
          this.doneInfo.set('Phiên học đã lưu.');
          this.loadStats();
        },
      });
    } else {
      this.doneInfo.set(wasBreak ? 'Thời gian nghỉ kết thúc!' : 'Hoàn thành!');
    }

    this.startedAt = null;

    // Determine next mode
    const next = this.determineNextMode();
    this.nextMode.set(next);

    if (this.autoSwitch()) {
      this.startAutoSwitchCountdown(next);
    } else {
      // Just reset current mode after 3s
      this.autoSwitchTimer = setTimeout(() => this.applyMode(this.mode()), 3000);
    }
  }

  private determineNextMode(): TimerMode {
    const cur = this.mode();
    if (cur === 'CUSTOM') {
      // Toggle between study and break
      return 'CUSTOM';
    }
    if (cur === 'SHORT_BREAK' || cur === 'LONG_BREAK') return 'POMODORO';
    // After pomodoro: every 4th → long break
    return (this.pomodorosCompleted % 4 === 0) ? 'LONG_BREAK' : 'SHORT_BREAK';
  }

  private startAutoSwitchCountdown(next: TimerMode) {
    this.autoSwitchCountdown.set(5);
    this.countdownInterval = setInterval(() => {
      const c = this.autoSwitchCountdown() - 1;
      this.autoSwitchCountdown.set(c);
      if (c <= 0) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        this.applyMode(next);
      }
    }, 1000);
  }

  cancelAutoSwitch() {
    this.clearAutoSwitch();
    // Reset to current mode idle
    const dur = this.mode() === 'CUSTOM' ? this.customStudyMin * 60 : PRESETS[this.mode()];
    this.totalDuration.set(dur);
    this.remaining.set(dur);
    this.state.set('idle');
  }

  private applyMode(next: TimerMode) {
    this.nextMode.set(null);
    if (next === 'CUSTOM') {
      // Toggle custom phase
      this.customPhase = this.customPhase === 'study' ? 'break' : 'study';
      const dur = this.customPhase === 'study' ? this.customStudyMin * 60 : this.customBreakMin * 60;
      this.mode.set('CUSTOM');
      this.totalDuration.set(dur);
      this.remaining.set(dur);
    } else {
      this.mode.set(next);
      const dur = PRESETS[next];
      this.totalDuration.set(dur);
      this.remaining.set(dur);
    }
    this.doneInfo.set('');
    this.state.set('idle');
  }

  private clearAutoSwitch() {
    if (this.autoSwitchTimer) { clearTimeout(this.autoSwitchTimer); this.autoSwitchTimer = null; }
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.autoSwitchCountdown.set(0);
  }

  private loadStats() {
    this.timerSvc.getTodayStats().subscribe({
      next: s => this.todayStats.set(s),
      error: () => {},
    });
  }

  showRewardPopup(reward: RewardPopup) {
    this.showReward.set(reward);
    this.rewardProgress.set(100);
    let elapsed = 0;
    const total = 4000; // 4 seconds
    const step = 50;
    this.rewardTimer = setInterval(() => {
      elapsed += step;
      this.rewardProgress.set(Math.max(0, 100 - (elapsed / total) * 100));
      if (elapsed >= total) {
        this.dismissReward();
      }
    }, step);
  }

  dismissReward() {
    if (this.rewardTimer) { clearInterval(this.rewardTimer); this.rewardTimer = null; }
    this.showReward.set(null);
  }

  private clearTimer() {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  private playDoneSound() {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const ctx = this.audioCtx;
      const notes = [523, 659, 784, 1047]; // C E G C
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch { /* ignore */ }
  }

  ngOnDestroy() {
    this.clearTimer();
    this.clearAutoSwitch();
    this.dismissReward();
    this.audioCtx?.close();
  }
}
