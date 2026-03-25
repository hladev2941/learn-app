import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="auth-page">
      <div class="blob blob-top"></div>
      <div class="blob blob-bottom"></div>

      <div class="auth-container">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="brand-icon">
            <mat-icon>school</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-indigo-950 mt-4 tracking-tight">LearnApp</h1>
          <p class="text-slate-500 mt-1.5 text-sm">Bắt đầu hành trình học của bạn</p>
        </div>

        <!-- Glass card -->
        <div class="glass-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <div class="field-group">
              <label class="field-label">Tên hiển thị</label>
              <input
                type="text"
                formControlName="displayName"
                class="glass-input"
                placeholder="Nguyễn Văn A"
                autocomplete="name"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Email</label>
              <input
                type="email"
                formControlName="email"
                class="glass-input"
                placeholder="you@example.com"
                autocomplete="email"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Mật khẩu</label>
              <div class="relative">
                <input
                  [type]="showPw() ? 'text' : 'password'"
                  formControlName="password"
                  class="glass-input pr-12"
                  placeholder="Tối thiểu 8 ký tự"
                  autocomplete="new-password"
                />
                <button type="button" (click)="showPw.set(!showPw())" class="pw-toggle">
                  <mat-icon class="text-lg">{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <p class="hint">Tối thiểu 8 ký tự</p>
            </div>

            @if (errorMsg()) {
              <div class="error-box">
                <mat-icon class="text-base">error_outline</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="btn-brand w-full mt-6">
              @if (loading()) {
                <mat-icon class="spin text-base">refresh</mat-icon>
                Đang tạo tài khoản...
              } @else {
                Tạo tài khoản
                <mat-icon class="text-base">arrow_forward</mat-icon>
              }
            </button>
          </form>

          <div class="divider">
            <span>Đã có tài khoản?</span>
            <a routerLink="/auth/login" class="link-brand">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: linear-gradient(145deg, #f5f3ff 0%, #ede9fe 35%, #e0e7ff 70%, #f0f9ff 100%);
      position: relative;
      overflow: hidden;
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .blob-top {
      top: -160px; right: -100px;
      width: 520px; height: 520px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, transparent 70%);
    }
    .blob-bottom {
      bottom: -120px; left: -80px;
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, transparent 70%);
    }
    .auth-container {
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
    }
    .brand-icon {
      display: inline-flex;
      width: 56px; height: 56px;
      border-radius: 18px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.38);
      color: white;
    }
    .brand-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .glass-card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.78);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 8px 40px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .field-group { margin-bottom: 18px; }
    .field-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #4338ca;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .glass-input {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.6);
      border: 1.5px solid rgba(199, 210, 254, 0.9);
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 0.9375rem;
      font-family: inherit;
      color: #1e1b4b;
      outline: none;
      transition: all 0.2s ease;
      backdrop-filter: blur(8px);
    }
    .glass-input:focus {
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    .glass-input::placeholder { color: #c4b5fd; }
    .hint {
      margin: 6px 0 0 4px;
      font-size: 0.75rem;
      color: #a5b4fc;
    }
    .pw-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #a5b4fc;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 8px;
      transition: color 0.2s;
    }
    .pw-toggle:hover { color: #6366f1; }
    .error-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(254, 226, 226, 0.8);
      border: 1px solid rgba(252, 165, 165, 0.5);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.875rem;
      color: #dc2626;
      margin-top: 8px;
    }
    .btn-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-weight: 600;
      font-size: 0.9375rem;
      font-family: inherit;
      border: none;
      border-radius: 14px;
      padding: 13px 24px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.38);
      transition: all 0.2s ease;
    }
    .btn-brand:not(:disabled):hover {
      box-shadow: 0 6px 22px rgba(99, 102, 241, 0.5);
      transform: translateY(-1px);
    }
    .btn-brand:not(:disabled):active { transform: translateY(0); }
    .btn-brand:disabled { opacity: 0.6; cursor: not-allowed; }
    .divider {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(199, 210, 254, 0.4);
      text-align: center;
      font-size: 0.875rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .link-brand {
      color: #6366f1;
      font-weight: 600;
      text-decoration: none;
    }
    .link-brand:hover { color: #4f46e5; text-decoration: underline; }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = signal(false);
  errorMsg = signal('');
  showPw = signal(false);

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Đăng ký thất bại');
        this.loading.set(false);
      },
    });
  }
}
