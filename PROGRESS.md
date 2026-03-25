# LearnApp — Ghi chú tiến độ

> Cập nhật lần cuối: 2026-03-25 (session 5)

---

## Trạng thái tổng quan

| Layer | Trạng thái |
|-------|-----------|
| Backend microservices | ✅ Đang chạy (Docker) |
| Database / Redis | ✅ Healthy |
| Frontend Angular | ✅ Dev server đang chạy |
| Auth flow (register/login) | ✅ Hoạt động end-to-end |
| Subject (Môn học) | ✅ Backend + Frontend hoàn chỉnh |
| Deck + Card feature | ✅ Backend + Frontend hoàn chỉnh |
| Notification per Subject | ✅ Config lưu DB, scheduler Phase 2 |
| WebSocket Notification | ✅ STOMP/SockJS, OnlineRegistry, SubjectReminder + StreakWarning scheduler |
| Notification Top Bar   | ✅ Ticker cuộn ngang + Bell icon/badge + Panel list có navigate |
| Các feature pages khác | 🚧 Placeholder — chưa implement |

---

## Cách khởi động lại dự án

### Backend (Docker)
```bash
cd E:/vibe/learn-app

# Lần đầu hoặc khi thay đổi schema
docker compose down -v
DOCKER_BUILDKIT=0 docker compose build
docker compose up -d

# Những lần sau (không thay đổi schema)
docker compose up -d
```

### Frontend
```bash
cd E:/vibe/learn-app/frontend
npx ng serve --configuration=development
# Truy cập: http://localhost:4200
```

---

## Containers đang chạy

| Container | Port | Vai trò |
|-----------|------|---------|
| `learn-gateway` | 8080 | API Gateway — entry point duy nhất |
| `learn-auth` | 8081 | Auth service (register/login/JWT) |
| `learn-study` | 8082 | Study service (streak, session) |
| `learn-flashcard` | 8083 | Flashcard service (deck, card, FSRS) |
| `learn-notification` | 8084 | Notification service (WebSocket/STOMP, schedulers) |
| `learn-postgres` | 5432 | PostgreSQL 15 |
| `learn-redis` | 6379 | Redis 7 |
| `learn-pgadmin` | 5050 | PgAdmin UI |

> ⚠️ **Không có Discovery Server** — đã bỏ Eureka, dùng Docker DNS trực tiếp.
> Container names dùng dấu `-` (không phải `_`) vì Tomcat 10 từ chối underscore trong hostname.

---

## Kiến trúc Backend

### Routing (API Gateway → Service)
```
POST /api/v1/auth/**        → learn-auth:8081
GET  /api/v1/users/**       → learn-auth:8081
/api/v1/study/**            → learn-study:8082
/api/v1/notifications/**    → learn-notification:8084
/api/v1/subjects/**         → learn-flashcard:8083  ← MỚI
/ws/**                      → learn-notification:8084
/api/v1/decks/**            → learn-flashcard:8083
/api/v1/cards/**            → learn-flashcard:8083
/api/v1/reviews/**          → learn-flashcard:8083
/internal/**                → KHÔNG expose qua gateway
```

### Feign clients (inter-service)
- `study-service` gọi `auth-service` và `flashcard-service` qua URL env var
- `flashcard-service` gọi `auth-service` qua URL env var
- Không dùng Eureka load balancer

### Database schemas
- `auth` schema → auth-service
- `study` schema → study-service
- `flashcard` schema → flashcard-service

---

## Frontend Angular 17

### Stack
- Angular 17 Standalone Components
- Tailwind CSS + Angular Material (prebuilt theme: indigo-pink)
- Angular Signals cho state management
- Lazy-loaded routes

### Cấu trúc
```
src/app/
├── core/
│   ├── services/auth.service.ts     ← JWT + user state (Signals)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts      ← tự động gắn Bearer token
│   │   └── error.interceptor.ts
│   ├── guards/auth.guard.ts         ← authGuard + guestGuard
│   └── models/                      ← interfaces: User, Deck, Card...
├── layout/
│   └── main-layout.component.ts    ← Sidebar glassmorphism (hover expand)
├── features/
│   ├── auth/login.component.ts     ✅ Hoàn chỉnh
│   ├── auth/register.component.ts  ✅ Hoàn chỉnh
│   ├── dashboard/                  ✅ UI done, data chưa connect API
│   ├── deck/                       ✅ Hoàn chỉnh (Subject→Deck→Card + reminder config)
│   ├── layout/main-layout          ✅ Top bar: ticker cuộn + bell badge + notification panel
│   ├── timer/                      🚧 Placeholder
│   ├── review/                     🚧 Placeholder
│   ├── analytics/                  🚧 Placeholder
│   └── settings/                   🚧 Placeholder
```

### Design system (Glassmorphism light theme)
- Nền: gradient `#f5f3ff → #ede9fe → #e8eeff`
- Glass card: `bg white/72%, backdrop-blur-24px, border white/78%`
- Accent: indigo `#6366f1` → violet `#8b5cf6`
- Font: Inter
- Sidebar: collapse về 64px (icon only), hover → expand 232px với fade-in text

### Tailwind config
- `preflight: false` — tránh conflict với Angular Material
- Custom colors: `primary` (violet), `indigo`
- Custom shadows: `glass`, `glass-lg`, `brand`, `brand-lg`

---

## Những vấn đề đã fix (để tránh lặp lại)

| Vấn đề | Nguyên nhân | Fix |
|--------|-------------|-----|
| Container DNS lỗi | Tên container dùng `_` | Đổi sang `-` |
| Eureka không register | Spring Boot 3 / Cloud 2023 compat | Bỏ hẳn Eureka |
| `role` null khi register | Thiếu `@Builder.Default` | Thêm vào `User.java` |
| PostgreSQL ENUM lỗi | Hibernate không map custom PG ENUM | Đổi thành `VARCHAR(20)` |
| OAuth2 startup fail | Spring Security tự cấu hình OAuth2 | Exclude `OAuth2ClientAutoConfiguration` |
| BuildKit DNS fail | BuildKit trên Windows | Dùng `DOCKER_BUILDKIT=0` |
| Tailwind không hoạt động | Thiếu `postcss.config.js` | Tạo file postcss config |
| Angular Material bị break | Tailwind Preflight reset CSS | `preflight: false` trong tailwind.config.js |
| Sidebar footer tràn | `box-sizing: content-box` (preflight tắt) | Thêm `box-sizing: border-box` reset |
| Sidebar icon bị clip | `gap` + `opacity:0` text vẫn chiếm width | `gap:0` + `max-width:0` cho text khi collapsed |

---

## TODO — Việc cần làm tiếp

### ⚠️ Cần rebuild Docker sau thay đổi này
```bash
# Schema DB đã đổi (thêm bảng subjects, cột subject_id) → cần reset volume
DOCKER_BUILDKIT=0 docker compose down -v
DOCKER_BUILDKIT=0 docker compose build
docker compose up -d
```

### Backend
- [x] `SubjectController` — CRUD môn học + reminder config ✅
- [x] `CardController` — CRUD cho card trong deck ✅
- [ ] AI service trong `flashcard-service` — generate card từ Claude API (WebClient)
- [ ] `StudySessionController` — bắt đầu/kết thúc session học
- [ ] FSRS algorithm implementation — schedule review
- [ ] `StreakResetScheduler` — reset streak hàng ngày (đã có scheduler stub)
- [ ] Internal Feign endpoints — `/internal/users/{id}` cho cross-service calls
- [ ] `InternalSubjectController` — GET `/internal/subjects/due-reminders` cho scheduler gọi

**Phase 2 — Notification System (WebSocket + Web Push):**
- [ ] `WebSocketConfig.java` — STOMP config, SockJS endpoint `/ws`
- [ ] `WebSocketAuthInterceptor.java` — validate JWT qua ChannelInterceptor
- [ ] `OnlineUserRegistry.java` — Redis Set track user đang kết nối
- [ ] `SubjectReminderScheduler.java` — cron mỗi phút check subject reminders
- [ ] `StreakWarningScheduler.java` — cron 20:00 check streak chưa học
- [ ] `WebPushService.java` — gửi OS notification qua java-webpush
- [ ] `PushSubscriptionController.java` — POST `/api/v1/push/subscribe`
- [ ] api-gateway route `/ws/**` → study-service (WebSocket proxy)
- [ ] Angular `NotificationService` — STOMP client, connect/disconnect theo login
- [ ] Angular `NotificationBellComponent` — icon chuông + badge unread
- [ ] Angular `NotificationToastComponent` — toast pop-up tự động tắt
- [ ] Angular Service Worker config (`ngsw-config.json`) + Web Push permission

### Frontend
- [x] **Deck page** — Subject (môn học) → Deck → Card, 2-level nav, reminder config ✅
- [ ] **Review page** — flip card UI, FSRS rating buttons (Again/Hard/Good/Easy)
- [ ] **Timer page** — Pomodoro timer (25/5 phút), tích hợp study session
- [ ] **Analytics page** — charts: streak calendar, XP over time, cards reviewed
- [ ] **Settings page** — đổi display name, timezone, password
- [ ] Connect Dashboard với real API data (streak, XP, due cards, study minutes)

### DevOps
- [ ] Production Dockerfile optimization
- [ ] Environment-specific configs (dev vs prod)
- [ ] CI/CD pipeline

---

## API đã kiểm tra hoạt động

```bash
# Register
POST http://localhost:8080/api/v1/auth/register
{
  "displayName": "Lại Đức Hiến",
  "email": "test@test.com",
  "password": "password123"
}
# → 201 Created, trả về accessToken + refreshToken

# Login
POST http://localhost:8080/api/v1/auth/login
{
  "email": "test@test.com",
  "password": "password123"
}
# → 200 OK, trả về accessToken + refreshToken
```
