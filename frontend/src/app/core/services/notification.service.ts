import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

interface ApiResponse<T> { success: boolean; data: T; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

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

  /** Fetch existing notifications from server. */
  fetchNotifications(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<ApiResponse<AppNotification[]>>(`${environment.apiUrl}/notifications`, { headers })
      .subscribe({
        next: res => {
          this._notifications.set(res.data ?? []);
          console.debug('[Notif] Loaded', res.data?.length ?? 0, 'notifications from server');
        },
        error: err => console.warn('[Notif] Failed to load notifications', err),
      });
  }

  markAllRead(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.patch<void>(`${environment.apiUrl}/notifications/read-all`, {}, { headers })
      .subscribe({ error: err => console.warn('[Notif] markAllRead failed', err) });

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
    console.debug('[WS] Connected — fetching existing notifications + subscribing');
    // Load existing notifications from server
    this.fetchNotifications();

    // Subscribe to real-time notifications
    this.client?.subscribe('/user/queue/notifications', msg => {
      const notification: AppNotification = { ...JSON.parse(msg.body), isRead: false };
      // Avoid duplicates if backend also persists via WS
      this._notifications.update(list => {
        if (list.some(n => n.id === notification.id)) return list;
        return [notification, ...list].slice(0, 50);
      });
      // Show toast then clear after 5 seconds
      this._toast.set(notification);
      setTimeout(() => this._toast.set(null), 5000);
    });
  }
}
