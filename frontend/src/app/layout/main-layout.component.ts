import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { NotificationBellComponent } from '../shared/components/notification-bell.component';
import { NotificationToastComponent } from '../shared/components/notification-toast.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule,
            NotificationBellComponent, NotificationToastComponent],
  template: `
    <!-- Mobile header -->
    <header class="mobile-header">
      <button class="hamburger" (click)="mobileOpen.set(true)">
        <mat-icon>menu</mat-icon>
      </button>
      <div class="mobile-brand">
        <div class="brand-mark-sm"><mat-icon>school</mat-icon></div>
        <span>LearnApp</span>
      </div>
      <div class="mobile-bell"><app-notification-bell /></div>
    </header>

    @if (mobileOpen()) {
      <div class="backdrop" (click)="mobileOpen.set(false)"></div>
    }

    <div class="layout-root">
      <aside class="sidebar" [class.mobile-open]="mobileOpen()">

        <!-- Header -->
        <div class="sidebar-header">
          <div class="brand-mark"><mat-icon>school</mat-icon></div>
          <span class="fade-text brand-name">LearnApp</span>
          <button class="mobile-close-btn" (click)="mobileOpen.set(false)">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="nav-active"
              class="nav-item"
              [title]="item.label"
              (click)="mobileOpen.set(false)"
            >
              <span class="nav-icon" [style.background]="item.color">
                <mat-icon>{{ item.icon }}</mat-icon>
              </span>
              <span class="fade-text nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar"><mat-icon>person</mat-icon></div>
            <div class="fade-text user-info">
              <p class="user-name">{{ user()?.displayName }}</p>
              <p class="user-xp">{{ user()?.xpTotal ?? 0 }} XP</p>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span class="fade-text">Đăng xuất</span>
          </button>
        </div>

      </aside>

      <main class="main-content">
        <!-- Notification top bar -->
        <div class="top-bar">

          <!-- Ticker: scrolling notification text -->
          <div class="ticker-wrap">
            <div class="ticker-label">
              <mat-icon class="ticker-icon">campaign</mat-icon>
              <span>Thông báo</span>
            </div>
            <div class="ticker-track">
              <span class="ticker-text" [style.animation-duration]="tickerDuration()">
                {{ tickerText() }}
              </span>
            </div>
          </div>

          <!-- Notification bell with badge -->
          <app-notification-bell />
        </div>

        <div class="content-area">
          <!-- Page content -->
          <div class="router-wrap">
            <router-outlet />
          </div>

          <!-- Right panel -->
          <aside class="right-panel">

            <!-- Date display -->
            <div class="rp-date-card">
              <p class="rp-weekday">{{ weekday() }}</p>
              <p class="rp-datestr">{{ dateStr() }}</p>
            </div>

            <!-- User XP card -->
            @if (user(); as u) {
              <div class="rp-user-card">
                <div class="rp-avatar">{{ initials() }}</div>
                <p class="rp-name">{{ u.displayName }}</p>
                <div class="rp-level-row">
                  <span class="rp-level-badge">Cấp {{ level() }}</span>
                  <span class="rp-xp-num">{{ u.xpTotal }} XP</span>
                </div>
                <div class="rp-xp-track">
                  <div class="rp-xp-fill" [style.width.%]="levelProgress()"></div>
                </div>
                <p class="rp-xp-hint">Còn {{ xpToNextLevel() }} XP đến cấp {{ level() + 1 }}</p>
              </div>
            }

            <!-- Study tip -->
            <div class="rp-tip-card">
              <p class="rp-section-label">💡 Mẹo học tập</p>
              <p class="rp-tip-text">{{ tips[currentTip()].text }}</p>
              <div class="rp-tip-dots">
                @for (t of tips; track $index) {
                  <div class="rp-dot" [class.rp-dot-active]="$index === currentTip()"></div>
                }
              </div>
            </div>

            <!-- Quick navigation -->
            <div class="rp-quick-card">
              <p class="rp-section-label">Truy cập nhanh</p>
              <a routerLink="/timer" class="rp-link">
                <span class="rp-link-icon" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                  <mat-icon>timer</mat-icon>
                </span>
                <span>Hẹn giờ</span>
              </a>
              <a routerLink="/review" class="rp-link">
                <span class="rp-link-icon" style="background:linear-gradient(135deg,#10b981,#34d399)">
                  <mat-icon>quiz</mat-icon>
                </span>
                <span>Ôn tập thẻ</span>
              </a>
              <a routerLink="/deck" class="rp-link">
                <span class="rp-link-icon" style="background:linear-gradient(135deg,#06b6d4,#22d3ee)">
                  <mat-icon>style</mat-icon>
                </span>
                <span>Flashcards</span>
              </a>
              <a routerLink="/analytics" class="rp-link">
                <span class="rp-link-icon" style="background:linear-gradient(135deg,#ec4899,#f472b6)">
                  <mat-icon>bar_chart</mat-icon>
                </span>
                <span>Thống kê</span>
              </a>
            </div>

          </aside>
        </div>
      </main>
    </div>

    <!-- Global toast overlay -->
    <app-notification-toast />
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    /* ── Mobile header ── */
    .mobile-header {
      display: none;
      align-items: center;
      gap: 12px;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 56px;
      padding: 0 16px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(199,210,254,0.4);
      z-index: 40;
    }
    .hamburger {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      border: none; background: none; cursor: pointer;
      color: #6366f1; border-radius: 10px;
      transition: background 0.2s;
    }
    .hamburger:hover { background: rgba(99,102,241,0.08); }
    .mobile-brand {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 1rem; color: #1e1b4b;
    }
    .brand-mark-sm {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 9px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .brand-mark-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .backdrop {
      position: fixed; inset: 0;
      background: rgba(30,27,75,0.35);
      backdrop-filter: blur(2px);
      z-index: 45;
    }

    /* ── Layout root ── */
    .layout-root {
      display: flex;
      height: 100vh;
      background: linear-gradient(145deg, #f5f3ff 0%, #ede9fe 40%, #e8eeff 100%);
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 64px;
      height: 100%;
      background: rgba(255,255,255,0.78);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-right: 1px solid rgba(255,255,255,0.85);
      box-shadow: 4px 0 24px rgba(99,102,241,0.07);
      padding: 20px 10px;
      overflow: hidden;
      flex-shrink: 0;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar:hover { width: 232px; }

    /* ── fade-text: takes zero space when collapsed ── */
    .fade-text {
      opacity: 0;
      max-width: 0;
      overflow: hidden;
      white-space: nowrap;
      transition: opacity 0.15s ease, max-width 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .sidebar:hover .fade-text {
      opacity: 1;
      max-width: 180px;
      transition: opacity 0.2s ease 0.12s, max-width 0.25s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Sidebar header ── */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding-bottom: 16px;
      margin-bottom: 8px;
      border-bottom: 1px solid rgba(199,210,254,0.3);
      flex-shrink: 0;
    }
    .sidebar:hover .sidebar-header { justify-content: flex-start; gap: 10px; }
    .brand-mark {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; flex-shrink: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
    }
    .brand-mark mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .brand-name {
      flex: 1;
      font-size: 1rem; font-weight: 700;
      color: #1e1b4b; letter-spacing: -0.01em;
    }

    /* Mobile close — hidden on desktop */
    .mobile-close-btn {
      display: none !important;
      align-items: center; justify-content: center;
      width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 8px;
      border: 1px solid rgba(199,210,254,0.5);
      background: rgba(255,255,255,0.6);
      cursor: pointer; color: #818cf8;
      transition: all 0.2s;
    }
    .mobile-close-btn:hover { background: rgba(99,102,241,0.08); color: #6366f1; }
    .mobile-close-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Nav ── */
    .sidebar-nav {
      flex: 1;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
      overflow: hidden;
    }
    .nav-item {
      display: flex; align-items: center; justify-content: center; gap: 0;
      padding: 8px 5px;
      border-radius: 13px;
      text-decoration: none;
      color: #64748b;
      font-size: 0.875rem; font-weight: 500;
      transition: background 0.18s, color 0.18s;
      flex-shrink: 0;
    }
    .sidebar:hover .nav-item { justify-content: flex-start; gap: 10px; }
    .nav-item:hover { background: rgba(99,102,241,0.07); color: #4f46e5; }
    .nav-item.nav-active {
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.1));
      color: #4f46e5;
    }
    .nav-icon {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; flex-shrink: 0;
      border-radius: 10px; color: white;
    }
    .nav-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .nav-label { font-size: 0.875rem; }

    /* ── Footer ── */
    .sidebar-footer {
      flex-shrink: 0;
      border-top: 1px solid rgba(199,210,254,0.3);
      padding-top: 12px;
      margin-top: 8px;
    }
    .user-card {
      display: flex; align-items: center; justify-content: center; gap: 0;
      padding: 7px 5px;
      border-radius: 13px;
      background: rgba(238,242,255,0.55);
      margin-bottom: 8px;
    }
    .sidebar:hover .user-card { justify-content: flex-start; gap: 10px; }
    .user-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #e0e7ff, #ede9fe);
      color: #6366f1;
    }
    .user-avatar mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .user-info { flex: 1; min-width: 0; }
    .user-name {
      font-size: 0.8125rem; font-weight: 600; color: #1e1b4b;
      white-space: nowrap; text-overflow: ellipsis; overflow: hidden;
      margin: 0;
    }
    .user-xp { font-size: 0.75rem; color: #818cf8; margin: 1px 0 0; }
    .logout-btn {
      display: flex; align-items: center; justify-content: center; gap: 0;
      width: 100%; padding: 8px 5px;
      border-radius: 12px;
      border: 1px solid rgba(254,202,202,0.4);
      background: rgba(255,241,242,0.5);
      color: #f87171; cursor: pointer;
      font-size: 0.8125rem; font-weight: 500; font-family: inherit;
      transition: all 0.18s;
    }
    .logout-btn:hover { background: rgba(254,226,226,0.75); border-color: rgba(252,165,165,0.6); }
    .sidebar:hover .logout-btn { justify-content: flex-start; gap: 8px; }
    .logout-btn mat-icon { font-size: 17px; width: 17px; height: 17px; flex-shrink: 0; }

    /* ── Main ── */
    .main-content {
      flex: 1; min-width: 0;
      overflow: hidden;
      display: flex; flex-direction: column;
    }

    /* ── Content area (router + right panel) ── */
    .content-area {
      flex: 1; display: flex; overflow: hidden;
    }
    .router-wrap {
      flex: 1; min-width: 0;
      overflow-y: auto; overflow-x: hidden;
    }

    /* ── Right panel ── */
    .right-panel {
      width: 240px; flex-shrink: 0;
      border-left: 1px solid rgba(199,210,254,0.4);
      background: rgba(255,255,255,0.45);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      overflow-y: auto;
      padding: 18px 14px;
      display: flex; flex-direction: column; gap: 12px;
    }
    @media (max-width: 1200px) { .right-panel { display: none; } }

    /* Date card */
    .rp-date-card {
      text-align: center;
      padding: 14px 12px;
      background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07));
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 14px;
    }
    .rp-weekday {
      font-size: 0.7rem; font-weight: 700; color: #6366f1;
      text-transform: uppercase; letter-spacing: 0.07em; margin: 0;
    }
    .rp-datestr {
      font-size: 1rem; font-weight: 700; color: #1e1b4b; margin: 3px 0 0;
    }

    /* User card */
    .rp-user-card {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(255,255,255,0.9);
      border-radius: 14px; padding: 16px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      box-shadow: 0 2px 12px rgba(99,102,241,0.08);
    }
    .rp-avatar {
      width: 46px; height: 46px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.0625rem; font-weight: 700;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
    }
    .rp-name {
      font-size: 0.875rem; font-weight: 600; color: #1e1b4b; margin: 0;
      text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 100%;
    }
    .rp-level-row {
      display: flex; align-items: center; gap: 6px; width: 100%; justify-content: space-between;
    }
    .rp-level-badge {
      font-size: 0.7rem; font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; padding: 2px 8px; border-radius: 20px;
    }
    .rp-xp-num { font-size: 0.75rem; font-weight: 600; color: #6366f1; }
    .rp-xp-track {
      width: 100%; height: 6px; border-radius: 3px;
      background: rgba(99,102,241,0.12); overflow: hidden;
    }
    .rp-xp-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.5s ease;
    }
    .rp-xp-hint { font-size: 0.7rem; color: #94a3b8; margin: 0; text-align: center; }

    /* Tip card */
    .rp-tip-card {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(255,255,255,0.9);
      border-radius: 14px; padding: 14px 12px;
      box-shadow: 0 2px 12px rgba(99,102,241,0.06);
    }
    .rp-section-label {
      font-size: 0.7rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;
    }
    .rp-tip-text {
      font-size: 0.8125rem; color: #374151; line-height: 1.55; margin: 0 0 10px;
    }
    .rp-tip-dots { display: flex; gap: 5px; justify-content: center; }
    .rp-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(99,102,241,0.18); transition: all 0.25s;
    }
    .rp-dot.rp-dot-active {
      background: #6366f1; width: 16px; border-radius: 3px;
    }

    /* Quick nav card */
    .rp-quick-card {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(255,255,255,0.9);
      border-radius: 14px; padding: 14px 12px;
      box-shadow: 0 2px 12px rgba(99,102,241,0.06);
      display: flex; flex-direction: column; gap: 4px;
    }
    .rp-link {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 8px; border-radius: 10px;
      text-decoration: none; color: #374151;
      font-size: 0.8125rem; font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .rp-link:hover { background: rgba(99,102,241,0.08); color: #4f46e5; }
    .rp-link-icon {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 8px;
      color: white; flex-shrink: 0;
    }
    .rp-link-icon mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ── Top bar ── */
    .top-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 0 16px;
      height: 48px; flex-shrink: 0;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(199,210,254,0.45);
      position: sticky; top: 0; z-index: 10;
      box-shadow: 0 1px 8px rgba(99,102,241,0.06);
    }

    /* ── Ticker ── */
    .ticker-wrap {
      flex: 1; display: flex; align-items: center; gap: 0;
      overflow: hidden; min-width: 0;
    }
    .ticker-label {
      display: flex; align-items: center; gap: 5px;
      flex-shrink: 0;
      padding: 0 10px 0 4px;
      border-right: 1px solid rgba(199,210,254,0.6);
      margin-right: 10px;
      color: #6366f1; font-size: 0.75rem; font-weight: 600;
      white-space: nowrap;
    }
    .ticker-icon { font-size: 15px; width: 15px; height: 15px; }
    .ticker-track {
      flex: 1; overflow: hidden;
      position: relative;
    }
    .ticker-text {
      display: inline-block;
      white-space: nowrap;
      font-size: 0.8rem; color: #4b5563; font-weight: 400;
      animation: ticker-scroll linear infinite;
      will-change: transform;
    }
    @keyframes ticker-scroll {
      0%   { transform: translateX(60vw); }
      100% { transform: translateX(-100%); }
    }

    /* ── Mobile bell ── */
    .mobile-bell { margin-left: auto; }

    /* ── Mobile ── */
    @media (max-width: 767px) {
      .mobile-header { display: flex; }
      .layout-root { height: calc(100vh - 56px); margin-top: 56px; }
      .sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0; height: 100vh;
        width: 260px;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      .sidebar:hover { width: 260px; }
      .sidebar.mobile-open { transform: translateX(0); }
      /* Show all text on mobile (drawer is always full width) */
      .fade-text { opacity: 1 !important; transition: none; }
      /* Show close button only on mobile */
      .mobile-close-btn { display: flex !important; }
    }
  `],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  user = this.authService.currentUser;
  mobileOpen = signal(false);

  // ── Right panel ──────────────────────────────────────────────────────────

  private tipInterval: ReturnType<typeof setInterval> | null = null;
  currentTip = signal(0);

  readonly tips = [
    { text: 'Học đều 25 phút mỗi ngày hiệu quả hơn học dồn vài tiếng vào cuối tuần.' },
    { text: 'Ôn tập thẻ đúng lúc sắp quên — đó là khi não hấp thụ kiến thức tốt nhất.' },
    { text: 'Nghỉ ngắn 5 phút sau mỗi Pomodoro giúp duy trì sự tập trung bền vững hơn.' },
    { text: 'Tạo flashcard ngay sau khi học bài mới, đừng để qua ngày hôm sau.' },
    { text: 'Đặt mục tiêu nhỏ, cụ thể từng ngày thay vì kế hoạch lớn mơ hồ.' },
    { text: 'Streak liên tiếp mỗi ngày là bí quyết số 1 để học ngôn ngữ thành công.' },
  ];

  weekday = signal('');
  dateStr = signal('');

  level         = computed(() => Math.floor((this.user()?.xpTotal ?? 0) / 200) + 1);
  levelProgress = computed(() => ((this.user()?.xpTotal ?? 0) % 200) / 200 * 100);
  xpToNextLevel = computed(() => 200 - ((this.user()?.xpTotal ?? 0) % 200));
  initials      = computed(() =>
    (this.user()?.displayName ?? '?')
      .split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
  );

  private updateDate(): void {
    const now = new Date();
    const DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    this.weekday.set(DAYS[now.getDay()]);
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    this.dateStr.set(`${d}/${m}/${now.getFullYear()}`);
  }

  /** Text shown in the ticker — join latest 5 notification titles */
  tickerText = computed(() => {
    const list = this.notificationService.notifications();
    if (list.length === 0) {
      return 'Chào mừng bạn đến với LearnApp! ✨ · Học đều mỗi ngày để duy trì streak 🔥 · Tạo flashcard để ôn tập hiệu quả 📚';
    }
    return list
      .slice(0, 5)
      .map(n => `${this.getTickerIcon(n.type)} ${n.title}`)
      .join('   ·   ');
  });

  /** Duration scales with text length so scroll speed stays constant */
  tickerDuration = computed(() => {
    const len = this.tickerText().length;
    return `${Math.max(15, len * 0.22)}s`;
  });

  private getTickerIcon(type: string): string {
    const map: Record<string, string> = { SUBJECT_REMINDER: '📚', STREAK_WARNING: '🔥', REVIEW_DUE: '🃏' };
    return map[type] ?? '🔔';
  }

  ngOnInit(): void {
    // Connect WebSocket when the layout (authenticated shell) is loaded
    try {
      this.notificationService.connect();
    } catch (e) {
      console.warn('[Layout] WS connect failed', e);
    }

    // Init right panel
    this.updateDate();
    this.tipInterval = setInterval(() => {
      this.currentTip.update(i => (i + 1) % this.tips.length);
    }, 8000);
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
    if (this.tipInterval) clearInterval(this.tipInterval);
  }

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',    route: '/dashboard',   color: 'linear-gradient(135deg,#6366f1,#818cf8)' },
    { label: 'Flashcards',   icon: 'style',         route: '/deck',        color: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
    { label: 'Hẹn giờ',     icon: 'timer',         route: '/timer',       color: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Ôn tập',      icon: 'quiz',           route: '/review',      color: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Thống kê',    icon: 'bar_chart',      route: '/analytics',   color: 'linear-gradient(135deg,#ec4899,#f472b6)' },
    { label: 'Xếp hạng',    icon: 'emoji_events',   route: '/leaderboard', color: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Cài đặt',     icon: 'settings',       route: '/settings',    color: 'linear-gradient(135deg,#94a3b8,#cbd5e1)' },
  ];

  logout() {
    this.authService.logout();
  }
}
