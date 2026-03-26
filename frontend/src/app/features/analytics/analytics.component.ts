import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyStat {
  date: string;          // ISO: "2026-03-20"
  totalSeconds: number;
  sessionCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .page { padding: 32px; max-width: 960px; margin: 0 auto; }
  @media (max-width: 640px) { .page { padding: 16px; } }

  /* Header */
  .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
  .page-icon {
    display: flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; border-radius: 15px;
    color: white; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }
  .page-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
  .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -0.02em; }
  .page-sub { font-size: 0.875rem; color: #94a3b8; margin: 3px 0 0; }

  /* Glass card */
  .glass-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.9);
    padding: 24px;
    margin-bottom: 20px;
  }

  /* Toggle buttons */
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }
  .section-title { font-size: 1rem; font-weight: 600; color: #1e1b4b; margin: 0; }
  .toggle-group { display: flex; gap: 6px; }
  .toggle-btn {
    padding: 6px 16px; border-radius: 10px; border: 1.5px solid rgba(99,102,241,0.25);
    font-size: 0.8125rem; font-weight: 500; cursor: pointer;
    background: transparent; color: #6366f1; transition: all 0.18s;
  }
  .toggle-btn:hover { background: rgba(99,102,241,0.07); }
  .toggle-btn.active {
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: white; border-color: transparent;
    box-shadow: 0 2px 10px rgba(99,102,241,0.35);
  }

  /* Loading */
  .loading-wrap {
    display: flex; align-items: center; justify-content: center;
    height: 220px; gap: 10px; color: #94a3b8; font-size: 0.875rem;
  }
  .spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2.5px solid rgba(99,102,241,0.15);
    border-top-color: #6366f1;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Empty state */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 200px; gap: 8px; color: #cbd5e1;
  }
  .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  .empty-title { font-size: 1rem; font-weight: 600; color: #94a3b8; margin: 0; }
  .empty-hint { font-size: 0.8125rem; color: #cbd5e1; margin: 0; }

  /* SVG chart wrapper */
  .chart-wrap { position: relative; width: 100%; }
  .chart-svg { width: 100%; display: block; }

  /* Bar hover tooltip */
  .bar-group { cursor: pointer; }
  .bar-group .bar-fill { transition: opacity 0.15s; }
  .bar-group:hover .bar-fill { opacity: 0.82; }

  /* Tooltip */
  .tooltip {
    position: absolute; pointer-events: none;
    background: rgba(30,27,75,0.9); backdrop-filter: blur(8px);
    color: white; border-radius: 10px; padding: 8px 12px;
    font-size: 0.78rem; font-weight: 500; white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    transform: translateX(-50%) translateY(-100%);
    margin-top: -8px; transition: opacity 0.12s;
    z-index: 10;
  }
  .tooltip.hidden { opacity: 0; }

  /* Summary stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }
  .stat-item {
    background: rgba(99,102,241,0.05);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 14px; padding: 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .stat-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-size: 1.25rem; font-weight: 700; color: #1e1b4b; }
  .stat-unit { font-size: 0.75rem; color: #94a3b8; }
`;

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styles: [STYLES],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-icon" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
          <mat-icon>bar_chart</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Thống kê</h1>
          <p class="page-sub">Theo dõi tiến độ học tập của bạn</p>
        </div>
      </div>

      <!-- Chart card -->
      <div class="glass-card">
        <div class="toggle-row">
          <p class="section-title">Thời gian học mỗi ngày</p>
          <div class="toggle-group">
            <button class="toggle-btn" [class.active]="selectedDays() === 7" (click)="selectDays(7)">7 ngày</button>
            <button class="toggle-btn" [class.active]="selectedDays() === 30" (click)="selectDays(30)">30 ngày</button>
          </div>
        </div>

        <!-- Loading state -->
        @if (loading()) {
          <div class="loading-wrap">
            <div class="spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        }

        <!-- Chart -->
        @if (!loading()) {
          @if (allEmpty()) {
            <!-- Empty state -->
            <div class="empty-state">
              <mat-icon>bar_chart</mat-icon>
              <p class="empty-title">Chưa có dữ liệu</p>
              <p class="empty-hint">Hoàn thành một phiên học để xem thống kê tại đây</p>
            </div>
          } @else {
            <div class="chart-wrap" #chartWrap>
              <svg class="chart-svg" [attr.viewBox]="'0 0 ' + SVG_W + ' ' + SVG_H" [attr.height]="SVG_H">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6366f1"/>
                    <stop offset="100%" stop-color="#8b5cf6"/>
                  </linearGradient>
                </defs>

                <!-- Y-axis grid lines -->
                @for (line of yLines(); track line.y) {
                  <line
                    [attr.x1]="PAD_LEFT"
                    [attr.x2]="SVG_W - PAD_RIGHT"
                    [attr.y1]="line.y"
                    [attr.y2]="line.y"
                    stroke="rgba(99,102,241,0.1)" stroke-width="1"
                    stroke-dasharray="4 4"
                  />
                  <text
                    [attr.x]="PAD_LEFT - 6"
                    [attr.y]="line.y + 4"
                    text-anchor="end"
                    font-size="10"
                    fill="#94a3b8"
                  >{{ line.label }}</text>
                }

                <!-- Bars (only render when totalSeconds > 0) -->
                @for (bar of bars(); track bar.date) {
                  <g class="bar-group"
                     (mouseenter)="showTooltip($event, bar)"
                     (mouseleave)="hideTooltip()">

                    @if (bar.totalSeconds > 0) {
                      <rect
                        class="bar-fill"
                        [attr.x]="bar.x"
                        [attr.y]="bar.barY"
                        [attr.width]="bar.w"
                        [attr.height]="bar.barH"
                        rx="4"
                        fill="url(#barGrad)"
                      />
                    }

                    <text
                      [attr.x]="bar.x + bar.w / 2"
                      [attr.y]="SVG_H - PAD_BOTTOM + 14"
                      text-anchor="middle"
                      font-size="10"
                      fill="#94a3b8"
                    >{{ bar.label }}</text>
                  </g>
                }

                <!-- X axis line -->
                <line
                  [attr.x1]="PAD_LEFT"
                  [attr.x2]="SVG_W - PAD_RIGHT"
                  [attr.y1]="CHART_AREA_TOP + CHART_AREA_H"
                  [attr.y2]="CHART_AREA_TOP + CHART_AREA_H"
                  stroke="rgba(99,102,241,0.2)" stroke-width="1"
                />
              </svg>

              <!-- Tooltip -->
              <div class="tooltip"
                   [class.hidden]="!tooltip().visible"
                   [style.left.px]="tooltip().x"
                   [style.top.px]="tooltip().y">
                {{ tooltip().text }}
              </div>
            </div>
          }
        }
      </div>

      <!-- Summary stats -->
      @if (!loading()) {
        <div class="glass-card">
          <p class="section-title" style="margin-bottom:16px">Tóm tắt</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Tổng thời gian</span>
              <span class="stat-value">{{ summary().totalMin }}<span class="stat-unit"> phút</span></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Ngày học nhiều nhất</span>
              <span class="stat-value">{{ summary().maxMin }}<span class="stat-unit"> phút</span></span>
              @if (summary().maxDate) {
                <span class="stat-unit">{{ summary().maxDate }}</span>
              }
            </div>
            <div class="stat-item">
              <span class="stat-label">Trung bình / ngày</span>
              <span class="stat-value">{{ summary().avgMin }}<span class="stat-unit"> phút</span></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Số ngày học</span>
              <span class="stat-value">{{ summary().activeDays }}<span class="stat-unit"> / {{ selectedDays() }} ngày</span></span>
            </div>
          </div>
        </div>
      }

      <!-- Review stats card -->
      @if (!reviewLoading()) {
        <div class="glass-card">
          <div class="toggle-row">
            <p class="section-title">Thống kê ôn tập thẻ</p>
            <div class="toggle-group">
              <button class="toggle-btn" [class.active]="selectedDays() === 7" (click)="selectDays(7)">7 ngày</button>
              <button class="toggle-btn" [class.active]="selectedDays() === 30" (click)="selectDays(30)">30 ngày</button>
            </div>
          </div>

          @if (reviewAllEmpty()) {
            <div class="empty-state">
              <mat-icon>style</mat-icon>
              <p class="empty-title">Chưa có lượt ôn tập</p>
              <p class="empty-hint">Ôn thẻ để xem thống kê retention tại đây</p>
            </div>
          } @else {
            <svg class="chart-svg" [attr.viewBox]="'0 0 ' + SVG_W + ' ' + (SVG_H - 40)" [attr.height]="SVG_H - 40">
              <defs>
                <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#34d399"/>
                </linearGradient>
              </defs>
              @for (bar of reviewBars(); track bar.date) {
                <g (mouseenter)="showReviewTooltip($event, bar)" (mouseleave)="hideTooltip()">
                  @if (bar.reviewCount > 0) {
                    <rect class="bar-fill" [attr.x]="bar.x" [attr.y]="bar.barY"
                          [attr.width]="bar.w" [attr.height]="bar.barH"
                          rx="4" fill="url(#reviewGrad)" />
                  }
                  <text [attr.x]="bar.x + bar.w/2" [attr.y]="SVG_H - PAD_BOTTOM - 22"
                        text-anchor="middle" font-size="10" fill="#94a3b8">{{ bar.label }}</text>
                </g>
              }
              <line [attr.x1]="PAD_LEFT" [attr.x2]="SVG_W - PAD_RIGHT"
                    [attr.y1]="CHART_AREA_TOP + CHART_AREA_H - 40" [attr.y2]="CHART_AREA_TOP + CHART_AREA_H - 40"
                    stroke="rgba(16,185,129,0.2)" stroke-width="1"/>
            </svg>
          }

          <!-- Review summary -->
          <div class="stats-grid" style="margin-top:16px">
            <div class="stat-item">
              <span class="stat-label">Tổng lượt ôn</span>
              <span class="stat-value">{{ reviewSummary().total }}<span class="stat-unit"> thẻ</span></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Retention rate</span>
              <span class="stat-value" [style.color]="reviewSummary().retention >= 80 ? '#10b981' : reviewSummary().retention >= 60 ? '#f59e0b' : '#ef4444'">
                {{ reviewSummary().retention }}<span class="stat-unit">%</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Ngày tốt nhất</span>
              <span class="stat-value">{{ reviewSummary().maxDay }}<span class="stat-unit"> thẻ</span></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Ngày ôn tập</span>
              <span class="stat-value">{{ reviewSummary().activeDays }}<span class="stat-unit"> / {{ selectedDays() }} ngày</span></span>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class AnalyticsComponent implements OnInit {

  // ── Constants ──────────────────────────────────────────────────────────────
  readonly SVG_W         = 800;
  readonly SVG_H         = 280;
  readonly PAD_LEFT      = 40;
  readonly PAD_RIGHT     = 16;
  readonly PAD_BOTTOM    = 32;
  readonly PAD_TOP       = 12;
  readonly CHART_AREA_H  = this.SVG_H - this.PAD_BOTTOM - this.PAD_TOP;
  readonly CHART_AREA_TOP = this.PAD_TOP;

  // ── State ──────────────────────────────────────────────────────────────────
  private http = inject(HttpClient);

  selectedDays  = signal<7 | 30>(7);
  loading       = signal(true);
  rawData       = signal<DailyStat[]>([]);
  reviewLoading = signal(true);
  reviewData    = signal<{ date: string; reviewCount: number; goodCount: number; retentionPercent: number }[]>([]);
  tooltip       = signal<{ visible: boolean; x: number; y: number; text: string }>({
    visible: false, x: 0, y: 0, text: '',
  });

  // ── Computed ───────────────────────────────────────────────────────────────

  allEmpty = computed(() => this.rawData().every(d => d.totalSeconds === 0));

  /** Max seconds across all days (at least 1 to avoid divide-by-zero) */
  private maxSeconds = computed(() =>
    Math.max(1, ...this.rawData().map(d => d.totalSeconds))
  );

  /** Nice y-axis max (rounded up) */
  private yMax = computed(() => {
    const raw = this.maxSeconds();
    const rawMin = raw / 60;
    // Round up to nearest nice number
    const nice = rawMin <= 10 ? 10
               : rawMin <= 20 ? 20
               : rawMin <= 30 ? 30
               : rawMin <= 60 ? 60
               : rawMin <= 90 ? 90
               : rawMin <= 120 ? 120
               : Math.ceil(rawMin / 30) * 30;
    return nice * 60; // back to seconds
  });

  /** Y grid lines (4 lines) */
  yLines = computed(() => {
    const lines: { y: number; label: string }[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const seconds  = this.yMax() * fraction;
      const y        = this.CHART_AREA_TOP + this.CHART_AREA_H - (fraction * this.CHART_AREA_H);
      lines.push({ y, label: Math.round(seconds / 60) + 'p' });
    }
    return lines;
  });

  /** Bar positions & sizes */
  bars = computed(() => {
    const data      = this.rawData();
    const n         = data.length;
    if (n === 0) return [];

    const availW    = this.SVG_W - this.PAD_LEFT - this.PAD_RIGHT;
    const gap       = n > 15 ? 2 : 4;
    const barW      = Math.max(4, availW / n - gap);

    return data.map((d, i) => {
      const fraction = d.totalSeconds / this.yMax();
      const barH     = Math.max(0, fraction * this.CHART_AREA_H);
      const barY     = this.CHART_AREA_TOP + this.CHART_AREA_H - barH;
      const x        = this.PAD_LEFT + i * (barW + gap);

      return {
        date: d.date,
        totalSeconds: d.totalSeconds,
        sessionCount: d.sessionCount,
        x,
        w: barW,
        barH,
        barY,
        label: this.buildLabel(d.date, n),
      };
    });
  });

  // ── Review computed ────────────────────────────────────────────────────────

  reviewAllEmpty = computed(() => this.reviewData().every(d => d.reviewCount === 0));

  private maxReviews = computed(() =>
    Math.max(1, ...this.reviewData().map(d => d.reviewCount))
  );

  reviewBars = computed(() => {
    const data = this.reviewData();
    const n = data.length;
    if (n === 0) return [];

    const availW  = this.SVG_W - this.PAD_LEFT - this.PAD_RIGHT;
    const gap     = n > 15 ? 2 : 4;
    const barW    = Math.max(4, availW / n - gap);
    const chartH  = this.CHART_AREA_H - 40;

    return data.map((d, i) => {
      const fraction = d.reviewCount / this.maxReviews();
      const barH     = Math.max(0, fraction * chartH);
      const barY     = this.CHART_AREA_TOP + chartH - barH;
      return {
        date: d.date,
        reviewCount: d.reviewCount,
        retentionPercent: d.retentionPercent,
        x: this.PAD_LEFT + i * (barW + gap),
        w: barW,
        barH,
        barY,
        label: this.buildLabel(d.date, n),
      };
    });
  });

  reviewSummary = computed(() => {
    const data = this.reviewData();
    const total      = data.reduce((s, d) => s + d.reviewCount, 0);
    const good       = data.reduce((s, d) => s + d.goodCount, 0);
    const maxDay     = Math.max(0, ...data.map(d => d.reviewCount));
    const activeDays = data.filter(d => d.reviewCount > 0).length;
    return {
      total,
      retention: total === 0 ? 0 : Math.round(good / total * 100),
      maxDay,
      activeDays,
    };
  });

  summary = computed(() => {
    const data = this.rawData();
    if (data.length === 0) return { totalMin: 0, maxMin: 0, maxDate: '', avgMin: 0, activeDays: 0 };

    const totalSec   = data.reduce((s, d) => s + d.totalSeconds, 0);
    const maxEntry   = data.reduce((a, b) => a.totalSeconds >= b.totalSeconds ? a : b);
    const activeDays = data.filter(d => d.totalSeconds > 0).length;

    const fmt = (sec: number) => Math.round(sec / 60);

    return {
      totalMin:   fmt(totalSec),
      maxMin:     fmt(maxEntry.totalSeconds),
      maxDate:    maxEntry.totalSeconds > 0 ? this.formatDisplayDate(maxEntry.date) : '',
      avgMin:     fmt(totalSec / data.length),
      activeDays,
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit() {
    this.loadData();
    this.loadReviewData();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  selectDays(days: 7 | 30) {
    if (this.selectedDays() === days) return;
    this.selectedDays.set(days);
    this.loadData();
    this.loadReviewData();
  }

  showTooltip(event: MouseEvent, bar: { date: string; totalSeconds: number; sessionCount: number }) {
    const target   = event.currentTarget as Element;
    const svg      = target.closest('svg') as SVGSVGElement;
    const wrap     = svg?.parentElement as HTMLElement;
    if (!wrap) return;

    const wrapRect = wrap.getBoundingClientRect();
    const evX      = event.clientX - wrapRect.left;
    const evY      = event.clientY - wrapRect.top;

    const min   = Math.floor(bar.totalSeconds / 60);
    const sec   = bar.totalSeconds % 60;
    const label = this.formatDisplayDate(bar.date);
    const text  = bar.totalSeconds > 0
      ? `${label}: ${min}p ${sec}s (${bar.sessionCount} phiên)`
      : `${label}: Chưa học`;

    this.tooltip.set({ visible: true, x: evX, y: evY - 4, text });
  }

  hideTooltip() {
    this.tooltip.update(t => ({ ...t, visible: false }));
  }

  showReviewTooltip(event: MouseEvent, bar: { date: string; reviewCount: number; retentionPercent: number }) {
    const target   = event.currentTarget as Element;
    const svg      = target.closest('svg') as SVGSVGElement;
    const wrap     = svg?.parentElement as HTMLElement;
    if (!wrap) return;

    const wrapRect = wrap.getBoundingClientRect();
    const evX      = event.clientX - wrapRect.left;
    const evY      = event.clientY - wrapRect.top;

    const label = this.formatDisplayDate(bar.date);
    const text  = bar.reviewCount > 0
      ? `${label}: ${bar.reviewCount} thẻ (retention ${bar.retentionPercent}%)`
      : `${label}: Chưa ôn`;

    this.tooltip.set({ visible: true, x: evX, y: evY - 4, text });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private loadData() {
    this.loading.set(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    const url = `${environment.apiUrl}/analytics/study?days=${this.selectedDays()}&timezone=${encodeURIComponent(tz)}`;

    this.http.get<ApiResponse<DailyStat[]>>(url).subscribe({
      next: (res) => {
        this.rawData.set(res.success ? res.data : []);
        this.loading.set(false);
      },
      error: () => {
        this.rawData.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadReviewData() {
    this.reviewLoading.set(true);
    const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    const url = `${environment.apiUrl}/reviews/analytics?days=${this.selectedDays()}&timezone=${encodeURIComponent(tz)}`;

    this.http.get<ApiResponse<{ date: string; reviewCount: number; goodCount: number; retentionPercent: number }[]>>(url).subscribe({
      next: (res) => {
        this.reviewData.set(res.success ? res.data : []);
        this.reviewLoading.set(false);
      },
      error: () => {
        this.reviewData.set([]);
        this.reviewLoading.set(false);
      },
    });
  }

  /** Build short X-axis label: "T2"–"CN" for 7 days, "dd/MM" for 30 days */
  private buildLabel(isoDate: string, totalBars: number): string {
    if (totalBars <= 7) {
      const dow = new Date(isoDate + 'T00:00:00').getDay(); // 0=Sun
      const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return names[dow];
    }
    // For 30 days show every 5th label to avoid crowding
    const [, month, day] = isoDate.split('-');
    return `${day}/${month}`;
  }

  private formatDisplayDate(isoDate: string): string {
    const [, month, day] = isoDate.split('-');
    return `${day}/${month}`;
  }
}
