import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardService, DailyStat, GoalProgress, StreakData, TodayStats } from './dashboard.service';
import { User } from '../../core/models/auth.model';

interface HeatCell {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  isPlaceholder: boolean;
}

interface QuickAction {
  label: string;
  desc: string;
  icon: string;
  route: string;
  gradient: string;
  textColor: string;
  descColor: string;
}

/** Convert total seconds to "Xg Yp" or "Yp" display string */
function formatStudyTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0p';
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours}g ${remainingMinutes}p`;
  if (hours > 0) return `${hours}g`;
  return `${remainingMinutes}p`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="greeting">
            Xin chào, {{ profile()?.displayName ?? '...' }} 👋
          </h1>
          <p class="subtitle">Hãy tiếp tục duy trì thói quen học tập hôm nay!</p>
        </div>

        <div class="header-right">
          <!-- Coin balance -->
          @if (profile(); as p) {
            <div class="coin-badge">
              <mat-icon>monetization_on</mat-icon>
              <span>{{ p.coinBalance }} xu</span>
            </div>
          }

          <!-- Streak badge -->
          <div class="header-badge" [class.badge-active]="streakData()?.studiedToday">
            <mat-icon>local_fire_department</mat-icon>
            <span>{{ streakData()?.currentStreak ?? 0 }} ngày</span>
          </div>
        </div>
      </div>

      <!-- "Chưa học hôm nay" warning -->
      @if (!loading() && streakData() && !streakData()!.studiedToday && streakData()!.currentStreak > 0) {
        <div class="warning-banner">
          <mat-icon>warning_amber</mat-icon>
          <span>Bạn chưa học hôm nay — hãy giữ streak <strong>{{ streakData()!.currentStreak }} ngày</strong> của mình nhé!</span>
        </div>
      }

      <!-- Stats grid -->
      <div class="stats-grid">

        <!-- Loading skeleton -->
        @if (loading()) {
          @for (_ of skeletonItems; track $index) {
            <div class="stat-card skeleton-card">
              <div class="skeleton-icon"></div>
              <div class="skeleton-text">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line long"></div>
              </div>
            </div>
          }
        } @else {
          <!-- Streak hiện tại -->
          <a class="stat-card" routerLink="/timer">
            <div class="stat-icon" style="background: linear-gradient(135deg,#f97316,#fb923c)">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div>
              <p class="stat-value">{{ streakData()?.currentStreak ?? '-' }}</p>
              <p class="stat-label">Streak hiện tại</p>
            </div>
          </a>

          <!-- Thời gian hôm nay -->
          <a class="stat-card" routerLink="/timer">
            <div class="stat-icon" style="background: linear-gradient(135deg,#10b981,#34d399)">
              <mat-icon>schedule</mat-icon>
            </div>
            <div>
              <p class="stat-value">{{ todayTimeDisplay() }}</p>
              <p class="stat-label">Thời gian hôm nay</p>
            </div>
          </a>

          <!-- Thẻ cần ôn -->
          <a class="stat-card" routerLink="/review">
            <div class="stat-icon" style="background: linear-gradient(135deg,#06b6d4,#22d3ee)">
              <mat-icon>style</mat-icon>
            </div>
            <div>
              <p class="stat-value">{{ dueCount() ?? '-' }}</p>
              <p class="stat-label">Thẻ cần ôn</p>
            </div>
          </a>

          <!-- XP tổng -->
          <a class="stat-card" routerLink="/analytics">
            <div class="stat-icon" style="background: linear-gradient(135deg,#6366f1,#818cf8)">
              <mat-icon>bolt</mat-icon>
            </div>
            <div>
              <p class="stat-value">{{ profile()?.xpTotal ?? '-' }}</p>
              <p class="stat-label">XP tổng</p>
            </div>
          </a>
        }
      </div>

      <!-- Goal progress card -->
      @if (!loading() && goalProgress()) {
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-title-row">
              <mat-icon class="goal-icon">flag</mat-icon>
              <span class="goal-title">Mục tiêu hôm nay</span>
            </div>
            <a routerLink="/settings" class="goal-settings-link">
              <mat-icon>tune</mat-icon>
              Điều chỉnh
            </a>
          </div>

          <!-- Study minutes progress -->
          <div class="goal-item">
            <div class="goal-item-header">
              <span class="goal-item-label">Thời gian học</span>
              <span class="goal-item-value"
                [class.goal-met]="goalProgress()!.studyGoalMet">
                {{ goalProgress()!.actualStudyMinutesToday }} / {{ goalProgress()!.goalStudyMinutesPerDay }} phút
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill"
                [class.progress-fill--met]="goalProgress()!.studyGoalMet"
                [style.width.%]="goalProgress()!.progressStudyPercent">
              </div>
            </div>
            <p class="goal-sessions-text">
              {{ goalProgress()!.actualSessionsToday }} phiên học hôm nay
            </p>
          </div>
        </div>
      }

      <!-- Activity heatmap -->
      @if (!loading()) {
        <div class="heat-card">
          <div class="heat-header">
            <p class="heat-title">Hoạt động học tập</p>
            <span class="heat-count">{{ activeCount() }} ngày đã học trong năm qua</span>
          </div>

          <!-- Month labels -->
          <div class="heat-months-row">
            <div class="heat-day-spacer"></div>
            <div class="heat-months-inner">
              @for (m of monthLabels(); track m.label + m.col) {
                <span class="month-label" [style.left.px]="m.col * 15">{{ m.label }}</span>
              }
            </div>
          </div>

          <!-- Grid + day labels -->
          <div class="heat-body">
            <div class="heat-days">
              <span>T2</span><span></span><span>T4</span><span></span><span>T6</span><span></span><span>CN</span>
            </div>
            <div class="heat-grid" style="overflow-x: auto;">
              @for (week of heatmap(); track $index) {
                <div class="heat-col">
                  @for (day of week; track $index) {
                    <div
                      class="heat-cell"
                      [class.level-1]="day.level === 1"
                      [class.level-2]="day.level === 2"
                      [class.level-3]="day.level === 3"
                      [class.level-4]="day.level === 4"
                      [class.heat-placeholder]="day.isPlaceholder"
                      [title]="day.isPlaceholder ? '' : (day.date + ': ' + day.minutes + ' phút')"
                    ></div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Legend -->
          <div class="heat-legend">
            <span class="legend-text">Ít</span>
            <div class="heat-cell"></div>
            <div class="heat-cell level-1"></div>
            <div class="heat-cell level-2"></div>
            <div class="heat-cell level-3"></div>
            <div class="heat-cell level-4"></div>
            <span class="legend-text">Nhiều</span>
          </div>
        </div>
      }

      <!-- Quick actions -->
      <h2 class="section-title">Bắt đầu nhanh</h2>

      <div class="actions-grid">
        @for (action of quickActions; track action.route) {
          <a [routerLink]="action.route" class="action-card" [style.background]="action.gradient">
            <div class="action-icon">
              <mat-icon [style.color]="action.textColor">{{ action.icon }}</mat-icon>
            </div>
            <p class="action-label" [style.color]="action.textColor">{{ action.label }}</p>
            <p class="action-desc" [style.color]="action.descColor">{{ action.desc }}</p>
          </a>
        }
      </div>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .page {
      padding: 32px;
      max-width: 960px;
      margin: 0 auto;
    }

    /* ---- Header ---- */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 1.625rem;
      font-weight: 700;
      color: #1e1b4b;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 6px 0 0;
      font-size: 0.9375rem;
      color: #94a3b8;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .header-badge, .coin-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 50px;
      box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
      font-size: 0.875rem;
      font-weight: 600;
    }
    .header-badge {
      color: #94a3b8;
      transition: color 0.2s;
    }
    .header-badge.badge-active {
      color: #f97316;
    }
    .coin-badge {
      color: #d97706;
    }
    .header-badge mat-icon,
    .coin-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ---- Warning banner ---- */
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      margin-bottom: 20px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      border-radius: 14px;
      color: #92400e;
      font-size: 0.9rem;
    }
    .warning-banner mat-icon {
      color: #f59e0b;
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ---- Stats grid ---- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
      transition: transform 0.18s, box-shadow 0.18s;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(99, 102, 241, 0.12);
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 13px;
      color: white;
      flex-shrink: 0;
    }
    .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .stat-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e1b4b;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 2px 0 0;
      font-weight: 500;
    }

    /* ---- Skeleton loader ---- */
    .skeleton-card {
      pointer-events: none;
    }
    .skeleton-icon {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      flex-shrink: 0;
    }
    .skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skeleton-line.short { width: 50%; }
    .skeleton-line.long  { width: 75%; }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ---- Goal progress card ---- */
    .goal-card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
      padding: 22px 24px;
      margin-bottom: 32px;
    }
    .goal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .goal-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .goal-icon {
      color: #6366f1;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .goal-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #1e1b4b;
    }
    .goal-settings-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6366f1;
      text-decoration: none;
      padding: 4px 10px;
      border-radius: 8px;
      transition: background 0.15s;
    }
    .goal-settings-link:hover { background: rgba(99,102,241,0.08); }
    .goal-settings-link mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .goal-item { }
    .goal-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .goal-item-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }
    .goal-item-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e1b4b;
    }
    .goal-item-value.goal-met { color: #10b981; }

    .progress-track {
      height: 8px;
      border-radius: 4px;
      background: #e2e8f0;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.4s ease;
    }
    .progress-fill--met {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .goal-sessions-text {
      margin: 6px 0 0;
      font-size: 0.775rem;
      color: #94a3b8;
    }

    /* ---- Heatmap ---- */
    .heat-card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
      padding: 22px 24px;
      margin-bottom: 32px;
    }
    .heat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .heat-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #1e1b4b;
      margin: 0;
    }
    .heat-count {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .heat-months-row {
      display: flex;
      margin-bottom: 4px;
    }
    .heat-day-spacer {
      width: 26px;
      flex-shrink: 0;
    }
    .heat-months-inner {
      position: relative;
      flex: 1;
      height: 16px;
      overflow: hidden;
    }
    .month-label {
      position: absolute;
      font-size: 10px;
      color: #94a3b8;
      white-space: nowrap;
    }

    .heat-body {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .heat-days {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex-shrink: 0;
      width: 22px;
      padding-top: 0;
    }
    .heat-days span {
      height: 12px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 2px;
    }
    .heat-grid {
      display: flex;
      gap: 3px;
      flex: 1;
    }
    .heat-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .heat-cell {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      background: #e2e8f0;
      flex-shrink: 0;
      cursor: default;
    }
    .heat-cell.level-1 { background: rgba(99,102,241,0.22); }
    .heat-cell.level-2 { background: rgba(99,102,241,0.44); }
    .heat-cell.level-3 { background: rgba(99,102,241,0.70); }
    .heat-cell.level-4 { background: #6366f1; }
    .heat-cell.heat-placeholder { background: transparent; }

    .heat-legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
      margin-top: 10px;
    }
    .legend-text {
      font-size: 0.7rem;
      color: #94a3b8;
      margin: 0 3px;
    }

    /* ---- Quick actions ---- */
    .section-title {
      font-weight: 600;
      color: #64748b;
      margin: 0 0 14px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 0.75rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 640px) {
      .actions-grid { grid-template-columns: 1fr; }
    }
    .action-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 24px;
      border-radius: 20px;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      transition: transform 0.18s, box-shadow 0.18s;
    }
    .action-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.1);
    }
    .action-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .action-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .action-label {
      font-size: 1rem;
      font-weight: 700;
      margin: 4px 0 0;
      letter-spacing: -0.01em;
    }
    .action-desc {
      font-size: 0.8125rem;
      margin: 0;
      opacity: 0.85;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  // Signals for state
  loading = signal(true);
  profile = signal<User | null>(null);
  streakData = signal<StreakData | null>(null);
  todayStats = signal<TodayStats | null>(null);
  dueCount = signal<number | null>(null);
  goalProgress = signal<GoalProgress | null>(null);
  heatmapData = signal<DailyStat[]>([]);

  /** Placeholder array to render 4 skeleton cards while loading */
  readonly skeletonItems = [1, 2, 3, 4];

  /** Computed display string for today's study time */
  todayTimeDisplay(): string {
    const stats = this.todayStats();
    if (stats === null) return '-';
    return formatStudyTime(stats.totalSeconds);
  }

  // ── Heatmap ──────────────────────────────────────────────────────────────

  private calcLevel(mins: number): 0 | 1 | 2 | 3 | 4 {
    if (mins === 0) return 0;
    if (mins < 15) return 1;
    if (mins < 30) return 2;
    if (mins < 60) return 3;
    return 4;
  }

  /** Builds 53-column × 7-row heatmap grid (Mon at top) */
  heatmap = computed((): HeatCell[][] => {
    const data = this.heatmapData();
    const minuteMap = new Map<string, number>();
    for (const d of data) {
      minuteMap.set(d.date, Math.floor(d.totalSeconds / 60));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rewind to the Monday of the week 52 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    const dow = start.getDay(); // 0=Sun
    const toMon = dow === 0 ? 6 : dow - 1;
    start.setDate(start.getDate() - toMon);

    // Build cells from start → today
    const allCells: HeatCell[] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const dateStr = cur.toISOString().slice(0, 10);
      const mins = minuteMap.get(dateStr) ?? 0;
      allCells.push({ date: dateStr, minutes: mins, level: this.calcLevel(mins), isPlaceholder: false });
      cur.setDate(cur.getDate() + 1);
    }

    // Chunk into weeks of 7, padding last week with placeholders
    const weeks: HeatCell[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      const week = allCells.slice(i, i + 7);
      while (week.length < 7) {
        week.push({ date: '', minutes: 0, level: 0, isPlaceholder: true });
      }
      weeks.push(week);
    }
    return weeks;
  });

  /** Month labels: which column each month starts at */
  monthLabels = computed((): { label: string; col: number }[] => {
    const MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    this.heatmap().forEach((week, col) => {
      const first = week.find(c => !c.isPlaceholder);
      if (!first) return;
      const month = new Date(first.date + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], col });
        lastMonth = month;
      }
    });
    return labels;
  });

  /** Number of active study days in the past year */
  activeCount = computed(() => this.heatmapData().filter(d => d.totalSeconds > 0).length);

  readonly quickActions: QuickAction[] = [
    {
      label: 'Bắt đầu học',
      desc: 'Hẹn giờ Pomodoro',
      icon: 'timer',
      route: '/timer',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      textColor: 'rgba(255,255,255,0.97)',
      descColor: 'rgba(255,255,255,0.72)',
    },
    {
      label: 'Ôn tập thẻ',
      desc: 'Các thẻ đến hạn hôm nay',
      icon: 'quiz',
      route: '/review',
      gradient: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(238,242,255,0.85))',
      textColor: '#1e1b4b',
      descColor: '#94a3b8',
    },
    {
      label: 'Flashcards',
      desc: 'Quản lý bộ thẻ',
      icon: 'style',
      route: '/deck',
      gradient: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(238,242,255,0.85))',
      textColor: '#1e1b4b',
      descColor: '#94a3b8',
    },
  ];

  ngOnInit(): void {
    // Determine user timezone for today-stats API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    // Fetch all APIs in parallel; each stream has its own catchError so one
    // failure does not block the rest of the dashboard from rendering.
    forkJoin({
      profile:         this.dashboardService.getProfile().pipe(catchError(() => of(null))),
      streak:          this.dashboardService.getStreaks().pipe(catchError(() => of(null))),
      todayStats:      this.dashboardService.getTodayStats(timezone).pipe(catchError(() => of(null))),
      dueCount:        this.dashboardService.getDueCount().pipe(catchError(() => of(null))),
      goalProgress:    this.dashboardService.getGoalProgress().pipe(catchError(() => of(null))),
      yearlyActivity:  this.dashboardService.getYearlyActivity(timezone).pipe(catchError(() => of([]))),
    }).subscribe({
      next: results => {
        this.profile.set(results.profile);
        this.streakData.set(results.streak);
        this.todayStats.set(results.todayStats);
        this.dueCount.set(results.dueCount);
        this.goalProgress.set(results.goalProgress);
        this.heatmapData.set(results.yearlyActivity ?? []);
        this.loading.set(false);
      },
      error: () => {
        // Fallback: hide skeleton even on unexpected error
        this.loading.set(false);
      },
    });
  }
}
