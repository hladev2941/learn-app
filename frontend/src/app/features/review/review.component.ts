import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const PAGE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .page { padding: 32px; max-width: 960px; margin: 0 auto; }
  @media (max-width: 640px) { .page { padding: 16px; } }
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
  .empty-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 64px 24px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.9);
    text-align: center;
  }
  .empty-icon {
    display: flex; align-items: center; justify-content: center;
    width: 64px; height: 64px; border-radius: 20px; margin-bottom: 4px;
  }
  .empty-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
  .empty-title { font-size: 1rem; font-weight: 600; color: #475569; margin: 0; }
  .empty-desc { font-size: 0.875rem; color: #94a3b8; margin: 0; max-width: 320px; line-height: 1.5; }
`;

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [MatIconModule],
  styles: [PAGE_STYLES],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-icon" style="background:linear-gradient(135deg,#10b981,#34d399)">
          <mat-icon>quiz</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Ôn tập thẻ</h1>
          <p class="page-sub">Ôn lại các thẻ đến hạn hôm nay</p>
        </div>
      </div>
      <div class="empty-card">
        <div class="empty-icon" style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(52,211,153,0.08))">
          <mat-icon style="color:#10b981">quiz</mat-icon>
        </div>
        <p class="empty-title">Tính năng đang phát triển</p>
        <p class="empty-desc">Chức năng ôn tập thẻ theo thuật toán FSRS sẽ sớm ra mắt.</p>
      </div>
    </div>
  `,
})
export class ReviewComponent {}
