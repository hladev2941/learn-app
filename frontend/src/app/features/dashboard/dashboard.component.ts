import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  icon: string;
  value: string;
  color: string;
  bg: string;
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="greeting">Xin chào, {{ user()?.displayName }} 👋</h1>
          <p class="subtitle">Hãy tiếp tục duy trì thói quen học tập hôm nay!</p>
        </div>
        <div class="header-badge">
          <mat-icon>local_fire_department</mat-icon>
          <span>0 ngày</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        @for (stat of stats; track stat.label) {
          <div class="stat-card">
            <div class="stat-icon" [style.background]="stat.color">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div>
              <p class="stat-value">{{ stat.value }}</p>
              <p class="stat-label">{{ stat.label }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Section title -->
      <h2 class="section-title">Bắt đầu nhanh</h2>

      <!-- Quick actions -->
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

    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
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
    .header-badge {
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
      color: #f97316;
    }
    .header-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Stats */
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
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(99, 102, 241, 0.12);
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px; height: 42px;
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

    /* Quick actions */
    .section-title {
      font-size: 1rem;
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
      width: 44px; height: 44px;
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
export class DashboardComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;

  stats: StatCard[] = [
    { label: 'Streak',       icon: 'local_fire_department', value: '0',  color: 'linear-gradient(135deg,#f97316,#fb923c)', bg: '' },
    { label: 'XP hôm nay',  icon: 'bolt',                  value: '0',  color: 'linear-gradient(135deg,#6366f1,#818cf8)', bg: '' },
    { label: 'Thẻ đến hạn', icon: 'style',                  value: '0',  color: 'linear-gradient(135deg,#06b6d4,#22d3ee)', bg: '' },
    { label: 'Phút học',    icon: 'schedule',               value: '0',  color: 'linear-gradient(135deg,#10b981,#34d399)', bg: '' },
  ];

  quickActions: QuickAction[] = [
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
}
