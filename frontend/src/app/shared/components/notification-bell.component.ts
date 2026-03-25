import { Component, inject, signal, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

/** Route to navigate to when clicking a notification by type */
const ROUTE_MAP: Record<string, string> = {
  SUBJECT_REMINDER: '/deck',
  STREAK_WARNING:   '/dashboard',
  REVIEW_DUE:       '/review',
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [MatIconModule, DatePipe],
  template: `
    <div class="bell-wrapper">

      <!-- Bell button -->
      <button class="bell-btn" (click)="toggle()" title="Thông báo">
        <mat-icon>notifications</mat-icon>
        @if (notifService.unreadCount() > 0) {
          <span class="badge">
            {{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}
          </span>
        }
      </button>

      <!-- Notification panel -->
      @if (open()) {
        <div class="panel glass-panel" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="panel-header">
            <div class="panel-title-row">
              <mat-icon class="panel-icon">notifications</mat-icon>
              <span class="panel-title">Thông báo</span>
              @if (notifService.unreadCount() > 0) {
                <span class="unread-chip">{{ notifService.unreadCount() }} chưa đọc</span>
              }
            </div>
            @if (notifService.unreadCount() > 0) {
              <button class="mark-read-btn" (click)="notifService.markAllRead()">
                Đánh dấu tất cả đã đọc
              </button>
            }
          </div>

          <!-- List -->
          <div class="panel-list">
            @for (n of notifService.notifications(); track n.id) {
              <div
                class="notif-item"
                [class.unread]="!n.isRead"
                (click)="navigate(n)"
                [title]="n.title"
              >
                <div class="notif-icon-wrap">
                  <span class="notif-emoji">{{ getIcon(n.type) }}</span>
                  @if (!n.isRead) { <span class="unread-dot"></span> }
                </div>
                <div class="notif-body">
                  <p class="notif-title">{{ n.title }}</p>
                  @if (n.message) {
                    <p class="notif-msg">{{ n.message }}</p>
                  }
                  <p class="notif-time">{{ n.sentAt | date:'HH:mm · dd/MM/yyyy' }}</p>
                </div>
                <mat-icon class="nav-arrow">chevron_right</mat-icon>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <p class="empty-title">Không có thông báo</p>
                <p class="empty-sub">Thông báo mới sẽ xuất hiện tại đây</p>
              </div>
            }
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .bell-wrapper { position: relative; display: inline-flex; }

    /* ── Bell button ── */
    .bell-btn {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px;
      border: none; cursor: pointer;
      border-radius: 12px;
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(199,210,254,0.5);
      color: #6366f1;
      transition: all 0.2s;
    }
    .bell-btn:hover {
      background: rgba(238,242,255,0.9);
      box-shadow: 0 2px 12px rgba(99,102,241,0.15);
    }
    .bell-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }

    /* ── Badge ── */
    .badge {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; padding: 0 5px;
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white; border-radius: 9px;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white;
      line-height: 1; letter-spacing: 0;
      box-shadow: 0 2px 6px rgba(239,68,68,0.4);
      animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes badge-pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    /* ── Panel ── */
    .panel {
      position: absolute;
      top: calc(100% + 10px); right: 0;
      width: 360px; max-height: 480px;
      display: flex; flex-direction: column;
      border-radius: 20px; overflow: hidden;
      z-index: 200;
      animation: panel-in 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes panel-in {
      0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .glass-panel {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(199,210,254,0.6);
      box-shadow: 0 16px 48px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.06);
    }

    /* ── Panel header ── */
    .panel-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid rgba(199,210,254,0.35);
      flex-shrink: 0;
    }
    .panel-title-row {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .panel-icon { font-size: 18px; width: 18px; height: 18px; color: #6366f1; }
    .panel-title { font-size: 1rem; font-weight: 700; color: #1e1b4b; flex: 1; }
    .unread-chip {
      font-size: 0.6875rem; font-weight: 600;
      background: rgba(99,102,241,0.12); color: #6366f1;
      padding: 2px 8px; border-radius: 20px;
    }
    .mark-read-btn {
      width: 100%; padding: 7px 12px;
      font-size: 0.8125rem; font-weight: 500; color: #6366f1;
      border: 1px solid rgba(99,102,241,0.2);
      background: rgba(238,242,255,0.6);
      border-radius: 10px; cursor: pointer;
      font-family: inherit; transition: all 0.18s;
      text-align: center;
    }
    .mark-read-btn:hover { background: rgba(99,102,241,0.1); }

    /* ── List ── */
    .panel-list { overflow-y: auto; flex: 1; }
    .panel-list::-webkit-scrollbar { width: 4px; }
    .panel-list::-webkit-scrollbar-track { background: transparent; }
    .panel-list::-webkit-scrollbar-thumb { background: rgba(199,210,254,0.6); border-radius: 4px; }

    /* ── Notification item ── */
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px;
      cursor: pointer; transition: background 0.15s;
      border-bottom: 1px solid rgba(199,210,254,0.2);
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: rgba(238,242,255,0.7); }
    .notif-item.unread { background: rgba(238,242,255,0.5); }
    .notif-item:hover .nav-arrow { opacity: 1; transform: translateX(0); }

    .notif-icon-wrap {
      position: relative; flex-shrink: 0;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(238,242,255,0.9);
      border-radius: 12px;
    }
    .notif-emoji { font-size: 20px; line-height: 1; }
    .unread-dot {
      position: absolute; top: -2px; right: -2px;
      width: 8px; height: 8px;
      background: #6366f1; border-radius: 50%;
      border: 2px solid white;
    }

    .notif-body { flex: 1; min-width: 0; }
    .notif-title {
      font-size: 0.8125rem; font-weight: 600; color: #1e1b4b;
      margin: 0 0 3px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-item.unread .notif-title { color: #312e81; }
    .notif-msg {
      font-size: 0.75rem; color: #64748b; margin: 0 0 4px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
      line-height: 1.4;
    }
    .notif-time { font-size: 0.6875rem; color: #94a3b8; margin: 0; }

    .nav-arrow {
      font-size: 18px; width: 18px; height: 18px;
      color: #a5b4fc; flex-shrink: 0; align-self: center;
      opacity: 0; transform: translateX(-4px);
      transition: all 0.18s;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 20px; gap: 6px;
    }
    .empty-icon { font-size: 36px; line-height: 1; margin-bottom: 4px; opacity: 0.5; }
    .empty-title { font-size: 0.9rem; font-weight: 600; color: #64748b; margin: 0; }
    .empty-sub { font-size: 0.8rem; color: #94a3b8; margin: 0; text-align: center; }
  `],
})
export class NotificationBellComponent {
  protected notifService = inject(NotificationService);
  private router = inject(Router);
  protected open = signal(false);

  /** Close panel when clicking outside */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.open.set(false);
  }

  protected toggle(): void {
    this.open.update(v => !v);
  }

  protected navigate(n: AppNotification): void {
    this.notifService.markRead(n.id);
    this.open.set(false);
    const route = ROUTE_MAP[n.type] ?? '/dashboard';
    this.router.navigate([route]);
  }

  protected getIcon(type: string): string {
    const icons: Record<string, string> = {
      SUBJECT_REMINDER: '📚',
      STREAK_WARNING:   '🔥',
      REVIEW_DUE:       '🃏',
    };
    return icons[type] ?? '🔔';
  }
}
