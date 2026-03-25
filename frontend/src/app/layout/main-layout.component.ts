import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
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
        <router-outlet />
      </main>
    </div>
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
      overflow-y: auto; overflow-x: hidden;
    }

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
export class MainLayoutComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
  mobileOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',  route: '/dashboard', color: 'linear-gradient(135deg,#6366f1,#818cf8)' },
    { label: 'Flashcards', icon: 'style',       route: '/deck',      color: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
    { label: 'Hẹn giờ',   icon: 'timer',       route: '/timer',     color: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Ôn tập',    icon: 'quiz',         route: '/review',    color: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Thống kê',  icon: 'bar_chart',    route: '/analytics', color: 'linear-gradient(135deg,#ec4899,#f472b6)' },
    { label: 'Cài đặt',   icon: 'settings',     route: '/settings',  color: 'linear-gradient(135deg,#94a3b8,#cbd5e1)' },
  ];

  logout() {
    this.authService.logout();
  }
}
