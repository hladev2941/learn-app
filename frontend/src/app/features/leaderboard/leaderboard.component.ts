import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  xpTotal: number;
  coinBalance: number;
  isCurrentUser: boolean;
}

interface ApiResponse<T> { success: boolean; data: T; }

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];  // gold, silver, bronze
const RANK_LABELS = ['🥇', '🥈', '🥉'];

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="page-icon">
          <mat-icon>emoji_events</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Bảng Xếp Hạng</h1>
          <p class="page-sub">Top người học XP cao nhất</p>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <span>Đang tải...</span>
        </div>
      }

      @if (!loading()) {

        <!-- Top 3 podium -->
        @if (top3().length > 0) {
          <div class="podium">
            @for (entry of top3(); track entry.rank) {
              <div class="podium-item" [class.podium-first]="entry.rank === 1"
                   [class.me]="entry.isCurrentUser">
                <div class="podium-rank">{{ rankLabel(entry.rank) }}</div>
                <div class="podium-avatar" [style.background]="avatarGradient(entry.rank)">
                  {{ initials(entry.displayName) }}
                </div>
                <p class="podium-name">{{ entry.displayName }}</p>
                <div class="podium-xp">
                  <mat-icon>bolt</mat-icon>
                  <span>{{ entry.xpTotal }} XP</span>
                </div>
                @if (entry.isCurrentUser) {
                  <span class="me-badge">Bạn</span>
                }
              </div>
            }
          </div>
        }

        <!-- Rank 4–10 list -->
        @if (rest().length > 0) {
          <div class="rank-list">
            @for (entry of rest(); track entry.rank) {
              <div class="rank-item" [class.me]="entry.isCurrentUser">
                <span class="rank-num">#{{ entry.rank }}</span>
                <div class="rank-avatar">{{ initials(entry.displayName) }}</div>
                <span class="rank-name">
                  {{ entry.displayName }}
                  @if (entry.isCurrentUser) { <span class="me-tag">Bạn</span> }
                </span>
                <div class="rank-right">
                  <span class="rank-xp">
                    <mat-icon>bolt</mat-icon>{{ entry.xpTotal }}
                  </span>
                </div>

                <!-- XP progress bar relative to #1 -->
                <div class="rank-bar-wrap">
                  <div class="rank-bar" [style.width.%]="barWidth(entry.xpTotal)"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (entries().length === 0) {
          <div class="empty">
            <mat-icon>leaderboard</mat-icon>
            <p>Chưa có dữ liệu xếp hạng</p>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .page { padding: 32px; max-width: 680px; margin: 0 auto; }

    /* Header */
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .page-icon {
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 15px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white; flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(245,158,11,0.35);
    }
    .page-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 0; letter-spacing: -0.02em; }
    .page-sub  { font-size: 0.875rem; color: #94a3b8; margin: 3px 0 0; }

    /* Loading */
    .loading-wrap { display: flex; align-items: center; justify-content: center; height: 200px; gap: 10px; color: #94a3b8; }
    .spinner { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(99,102,241,0.15); border-top-color: #6366f1; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Podium */
    .podium {
      display: flex; justify-content: center; align-items: flex-end;
      gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
    }
    .podium-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 20px 16px 16px;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.85);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(99,102,241,0.08);
      min-width: 140px;
      position: relative;
      transition: transform 0.2s;
    }
    .podium-item:hover { transform: translateY(-3px); }
    .podium-first {
      order: -1;
      padding-top: 28px;
      box-shadow: 0 8px 32px rgba(245,158,11,0.25);
      border-color: rgba(245,158,11,0.3);
    }
    .podium-item.me {
      border-color: rgba(99,102,241,0.4);
      box-shadow: 0 4px 24px rgba(99,102,241,0.18);
    }
    .podium-rank { font-size: 1.75rem; line-height: 1; }
    .podium-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }
    .podium-first .podium-avatar { width: 68px; height: 68px; font-size: 1.5rem; }
    .podium-name {
      font-size: 0.875rem; font-weight: 600; color: #1e1b4b;
      margin: 0; text-align: center;
      max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .podium-xp {
      display: flex; align-items: center; gap: 3px;
      font-size: 0.8125rem; font-weight: 700; color: #6366f1;
    }
    .podium-xp mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .me-badge {
      position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white;
      font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
      border-radius: 20px; white-space: nowrap;
    }

    /* Rank list */
    .rank-list {
      display: flex; flex-direction: column; gap: 8px;
    }
    .rank-item {
      display: grid;
      grid-template-columns: 36px 36px 1fr auto;
      grid-template-rows: auto 4px;
      align-items: center;
      gap: 0 12px;
      padding: 14px 18px;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.85);
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(99,102,241,0.05);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .rank-item:hover { transform: translateX(4px); box-shadow: 0 4px 20px rgba(99,102,241,0.1); }
    .rank-item.me {
      border-color: rgba(99,102,241,0.35);
      background: rgba(238,242,255,0.6);
    }
    .rank-num { font-size: 0.875rem; font-weight: 700; color: #94a3b8; text-align: center; }
    .rank-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8125rem; font-weight: 700;
    }
    .rank-name { font-size: 0.875rem; font-weight: 500; color: #1e1b4b; display: flex; align-items: center; gap: 6px; }
    .me-tag {
      font-size: 0.65rem; font-weight: 700; color: #6366f1;
      background: rgba(99,102,241,0.1); padding: 1px 6px; border-radius: 8px;
    }
    .rank-right { display: flex; align-items: center; }
    .rank-xp {
      display: flex; align-items: center; gap: 2px;
      font-size: 0.8125rem; font-weight: 700; color: #6366f1;
    }
    .rank-xp mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Bar spans full grid width */
    .rank-bar-wrap {
      grid-column: 1 / -1;
      height: 3px; border-radius: 2px;
      background: rgba(99,102,241,0.08);
      overflow: hidden;
      margin-top: 6px;
    }
    .rank-bar {
      height: 100%; border-radius: 2px;
      background: linear-gradient(90deg,#6366f1,#8b5cf6);
      transition: width 0.5s ease;
    }

    /* Empty */
    .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; color: #94a3b8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class LeaderboardComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  entries = signal<LeaderboardEntry[]>([]);

  top3 = () => this.entries().filter(e => e.rank <= 3).sort((a,b) => {
    // Display order: 2nd, 1st, 3rd
    const order: Record<number,number> = {1:1, 2:0, 3:2};
    return (order[a.rank] ?? a.rank) - (order[b.rank] ?? b.rank);
  });

  rest = () => this.entries().filter(e => e.rank > 3);

  private maxXp = () => {
    const top = this.entries().find(e => e.rank === 1);
    return top?.xpTotal ?? 1;
  };

  barWidth(xp: number): number {
    const max = this.maxXp();
    return max === 0 ? 0 : Math.round(xp / max * 100);
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(w => w[0] ?? '').join('').slice(0,2).toUpperCase();
  }

  rankLabel(rank: number): string { return RANK_LABELS[rank - 1] ?? `#${rank}`; }

  avatarGradient(rank: number): string {
    const g = ['linear-gradient(135deg,#f59e0b,#fbbf24)',
               'linear-gradient(135deg,#94a3b8,#cbd5e1)',
               'linear-gradient(135deg,#b45309,#d97706)'];
    return g[rank - 1] ?? 'linear-gradient(135deg,#6366f1,#8b5cf6)';
  }

  ngOnInit(): void {
    this.http.get<ApiResponse<LeaderboardEntry[]>>(`${environment.apiUrl}/users/leaderboard`)
      .subscribe({
        next: res => {
          this.entries.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
