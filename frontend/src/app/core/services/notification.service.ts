import { Injectable, inject, signal, computed } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authService = inject(AuthService);

  private _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length);

  /** Latest notification — set briefly to trigger toast, cleared after 5s. */
  private _toast = signal<AppNotification | null>(null);
  readonly toast = this._toast.asReadonly();

  private client: Client | null = null;

  connect(): void {
    const token = this.authService.getAccessToken();
    if (!token || this.client?.connected) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => this.onConnected(),
      onStompError: frame => console.error('[WS] STOMP error', frame),
      onDisconnect: () => console.debug('[WS] Disconnected'),
    });

    this.client.activate();
    console.debug('[WS] Connecting...');
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this._notifications.set([]);
    this._toast.set(null);
  }

  markAllRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, isRead: true })));
  }

  markRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  dismissToast(): void {
    this._toast.set(null);
  }

  private onConnected(): void {
    console.debug('[WS] Connected — subscribing to notifications');
    this.client?.subscribe('/user/queue/notifications', msg => {
      const notification: AppNotification = { ...JSON.parse(msg.body), isRead: false };
      this._notifications.update(list => [notification, ...list].slice(0, 50));
      // Show toast then clear after 5 seconds
      this._toast.set(notification);
      setTimeout(() => this._toast.set(null), 5000);
    });
  }
}
