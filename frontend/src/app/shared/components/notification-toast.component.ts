import { Component, inject } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [MatIconModule],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(8px)' })),
      ]),
    ]),
  ],
  template: `
    @if (toast()) {
      <div class="toast glass-toast" [@toastAnim]>
        <div class="toast-icon">{{ getIcon(toast()!.type) }}</div>
        <div class="toast-body">
          <p class="toast-title">{{ toast()!.title }}</p>
          @if (toast()!.message) {
            <p class="toast-msg">{{ toast()!.message }}</p>
          }
        </div>
        <button class="close-btn" (click)="dismiss()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed; bottom: 24px; right: 24px;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px;
      border-radius: 16px;
      min-width: 280px; max-width: 360px;
      pointer-events: all;
    }
    .glass-toast {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(199,210,254,0.6);
      box-shadow: 0 8px 32px rgba(99,102,241,0.18);
    }

    .toast-icon {
      font-size: 22px; flex-shrink: 0;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(238,242,255,0.8); border-radius: 12px;
    }
    .toast-body { flex: 1; min-width: 0; }
    .toast-title {
      font-size: 0.875rem; font-weight: 700; color: #1e1b4b;
      margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .toast-msg {
      font-size: 0.8125rem; color: #475569; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .close-btn {
      flex-shrink: 0; align-self: center;
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px;
      border: none; background: none; cursor: pointer;
      border-radius: 6px; color: #94a3b8;
      transition: all 0.2s;
    }
    .close-btn:hover { background: rgba(99,102,241,0.08); color: #6366f1; }
    .close-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class NotificationToastComponent {
  private notifService = inject(NotificationService);
  protected toast = this.notifService.toast;

  protected getIcon(type: string): string {
    const icons: Record<string, string> = {
      SUBJECT_REMINDER: '📚',
      STREAK_WARNING: '🔥',
      REVIEW_DUE: '🃏',
    };
    return icons[type] ?? '🔔';
  }

  protected dismiss(): void {
    this.notifService.dismissToast();
  }
}
