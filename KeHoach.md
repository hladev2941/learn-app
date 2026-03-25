# 📋 Kế Hoạch Triển Khai - Learning Support App

> **Stack:** Spring Boot 3 (Backend) + Angular 17+ (Frontend) + PostgreSQL
> Tài liệu mô tả chi tiết từng chức năng theo từng phase, bao gồm mức độ ưu tiên, công nghệ cần dùng và tiêu chí hoàn thành (Definition of Done).

---

## Tổng quan các Phase

| Phase | Tên | Mục tiêu | Kết quả kỳ vọng |
|-------|-----|-----------|-----------------|
| Phase 1 | MVP Core | Có thể dùng được, đủ giá trị cốt lõi | User có thể học, theo dõi thời gian, duy trì streak |
| Phase 2 | Gamification & AI | Tăng engagement, thêm trải nghiệm thông minh | User quay lại mỗi ngày vì reward và gợi ý AI |
| Phase 3 | Social & Polish | Tăng retention dài hạn | User kéo bạn bè vào, cạnh tranh leaderboard |
| Phase 4 | Scale & Offline | Mở rộng nền tảng | App chạy được offline, hỗ trợ mobile tốt |

---

## Phase 1 — MVP Core

> Mục tiêu: Người dùng có thể đăng ký, học bài, tạo flashcard, theo dõi thời gian và streak.

### 1.1 Authentication & User Management

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.1.1 | Đăng ký bằng Email | Form email + password, validation, gửi email xác nhận | Spring Security + JavaMailSender | 🔴 Bắt buộc |
| 1.1.2 | Đăng nhập bằng Email | Form login, trả về JWT access token + refresh token | Spring Security + JJWT | 🔴 Bắt buộc |
| 1.1.3 | Đăng nhập Google | OAuth2 Authorization Code Flow | Spring Security OAuth2 Client | 🔴 Bắt buộc |
| 1.1.4 | Refresh token | Tự động gia hạn session khi access token hết hạn | Angular HTTP Interceptor + Spring endpoint | 🔴 Bắt buộc |
| 1.1.5 | Quản lý hồ sơ cá nhân | Cập nhật tên, avatar, timezone | Cloudinary Java SDK (avatar) | 🟡 Quan trọng |
| 1.1.6 | Phân quyền user / admin | `@PreAuthorize` kiểm tra role trên từng API | Spring Security `@PreAuthorize` | 🟡 Quan trọng |
| 1.1.7 | Đăng xuất | Blacklist token phía server hoặc clear cookie | Redis token blacklist | 🔴 Bắt buộc |

**Backend:** `AuthController`, `UserController`, `JwtService`, `UserDetailsServiceImpl`
**Frontend:** `AuthService`, `JwtInterceptor`, `LoginComponent`, `RegisterComponent`, `ProfileComponent`
**DoD:** User đăng ký, xác nhận email, đăng nhập, refresh token tự động, xem và sửa profile thành công.

---

### 1.2 Study Timer (Pomodoro)

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.2.1 | Timer đếm ngược | Hiển thị thời gian còn lại, nút Start/Pause/Stop | Angular `interval()` (RxJS) | 🔴 Bắt buộc |
| 1.2.2 | Chế độ Pomodoro (25-5) | Preset sẵn 25 phút học, 5 phút nghỉ | Angular component config | 🔴 Bắt buộc |
| 1.2.3 | Chế độ Custom | User tự nhập số phút học / nghỉ | Angular Reactive Forms | 🔴 Bắt buộc |
| 1.2.4 | Âm thanh thông báo hết giờ | Phát sound khi kết thúc session | Web Audio API trong Angular service | 🟡 Quan trọng |
| 1.2.5 | Lưu session vào DB | Hoàn thành session → POST lên Spring API → lưu `study_sessions` | Spring REST API + JPA | 🔴 Bắt buộc |
| 1.2.6 | Hiển thị số session hôm nay | Đếm số pomodoro đã hoàn thành trong ngày | Spring query by date | 🟡 Quan trọng |

**Backend:** `StudySessionController`, `StudySessionService`, `StudySessionRepository` (JPA)
**Frontend:** `TimerComponent`, `TimerService`, `StudySessionService`
**DoD:** User chạy được timer, hoàn thành session, dữ liệu được lưu vào DB.

---

### 1.3 Streak System

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.3.1 | Tự động cập nhật streak | Sau khi lưu session → service kiểm tra ngày học cuối → tăng streak | Spring `@Transactional` + service logic | 🔴 Bắt buộc |
| 1.3.2 | Hiển thị streak hiện tại | Số ngày liên tiếp đang có | Angular dashboard widget | 🔴 Bắt buộc |
| 1.3.3 | Reset streak khi bỏ ngày | Nếu không học trong ngày (theo timezone user) → reset về 0 | Spring `@Scheduled` cron job hàng ngày | 🔴 Bắt buộc |
| 1.3.4 | Cảnh báo sắp mất streak | Banner nếu hôm nay chưa học và > 20h | Angular so sánh giờ local + API call | 🟡 Quan trọng |
| 1.3.5 | Milestone badge cơ bản | Đạt 7 ngày, 30 ngày → unlock badge | Spring event listener sau khi update streak | 🟡 Quan trọng |

**Backend:** `StreakService`, `StreakScheduler` (`@Scheduled`), `BadgeService`
**Frontend:** `StreakWidgetComponent`, `DashboardService`
**DoD:** Streak tăng đúng, reset đúng theo timezone, milestone badge được trao đúng.

---

### 1.4 Flashcard System

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.4.1 | Tạo flashcard (text) | Form tạo thẻ: mặt trước / mặt sau (text) | Angular Reactive Forms + Spring REST | 🔴 Bắt buộc |
| 1.4.2 | Tạo flashcard (có ảnh) | Upload ảnh cho mặt trước hoặc mặt sau | Cloudinary Java SDK + Angular file upload | 🟡 Quan trọng |
| 1.4.3 | Phân loại theo chủ đề (Deck) | Tạo, đặt tên, xoá Deck chứa các thẻ | Spring JPA entity `Deck` + `Card` | 🔴 Bắt buộc |
| 1.4.4 | Gắn tag cho thẻ | Gắn nhiều tag tự do vào thẻ | JPA `@ManyToMany` giữa `Card` và `Tag` | 🟡 Quan trọng |
| 1.4.5 | Lật thẻ (flip animation) | Click thẻ → lật xem đáp án | Angular Animations + CSS 3D transform | 🔴 Bắt buộc |
| 1.4.6 | Học theo chế độ Random | Hiện ngẫu nhiên các thẻ trong deck | `Collections.shuffle()` phía Spring hoặc Angular | 🔴 Bắt buộc |
| 1.4.7 | Sửa / Xoá thẻ | CRUD đầy đủ | Spring REST API (PUT, DELETE) | 🔴 Bắt buộc |

**Backend:** `CardController`, `DeckController`, `CardService`, `DeckService`, `TagRepository`
**Frontend:** `DeckListComponent`, `CardEditorComponent`, `FlashcardStudyComponent`
**DoD:** User tạo deck, thêm thẻ, học theo chế độ random không lỗi, flip animation mượt.

---

### 1.5 Spaced Repetition (FSRS)

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.5.1 | Đánh giá thẻ sau khi học | User bấm: Dễ / Ổn / Khó / Quên | Angular UI 4 nút → POST kết quả | 🔴 Bắt buộc |
| 1.5.2 | Tính ngày ôn lại | Dựa trên đánh giá → tính `next_review_date` | **fsrs4j** (Java FSRS library) hoặc tự implement SM-2 | 🔴 Bắt buộc |
| 1.5.3 | Hàng đợi ôn bài hôm nay | Hiện danh sách thẻ cần ôn hôm nay | Spring query `WHERE next_review_date <= :today` | 🔴 Bắt buộc |
| 1.5.4 | Hiển thị thẻ sắp đến hạn | Widget "X thẻ cần ôn hôm nay" trên dashboard | Angular dashboard widget | 🟡 Quan trọng |

**Backend:** `SpacedRepetitionService`, `ReviewLogRepository`, `CardReviewController`
**Frontend:** `ReviewQueueComponent`, `ReviewResultComponent`
**DoD:** Sau khi học và đánh giá, thẻ được lên lịch đúng và xuất hiện đúng ngày.

> 📌 Dùng thư viện [fsrs4j](https://github.com/open-spaced-repetition/fsrs4j) — bản Java chính thức của thuật toán FSRS.

---

### 1.6 Dashboard cơ bản

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 1.6.1 | Tổng thời gian học hôm nay | Sum duration các session hôm nay | Spring JPQL aggregate query | 🔴 Bắt buộc |
| 1.6.2 | Số session hoàn thành hôm nay | Count session hôm nay | Spring repository method | 🔴 Bắt buộc |
| 1.6.3 | Streak hiện tại | Widget hiện streak | DB field, Angular widget | 🔴 Bắt buộc |
| 1.6.4 | Số thẻ cần ôn hôm nay | Query SR queue | Spring service | 🔴 Bắt buộc |
| 1.6.5 | Heatmap ngày học | Lưới 365 ô tô màu theo số giờ học (như GitHub) | Angular + thư viện `ngx-graph` hoặc custom SVG | 🟡 Quan trọng |

**Backend:** `DashboardController` trả về 1 DTO tổng hợp
**Frontend:** `DashboardComponent`, `HeatmapComponent`, `StatsWidgetComponent`
**DoD:** Dashboard load nhanh (< 1s), dữ liệu đúng theo ngày và timezone user.

---

## Phase 2 — Gamification & AI

> Mục tiêu: Tăng động lực học qua reward, phân tích nâng cao và hỗ trợ AI.

### 2.1 Reward System

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.1.1 | Hệ thống XP | Cộng XP sau mỗi session hoàn thành | Spring service cộng vào `user.xp_total` | 🔴 Bắt buộc |
| 2.1.2 | Hệ thống Coin | Cộng coin ngẫu nhiên sau session | Spring weighted random + `user.coin_balance` | 🔴 Bắt buộc |
| 2.1.3 | Badge System | Định nghĩa danh sách badge, điều kiện unlock | JPA entity `Badge`, `UserBadge` | 🔴 Bắt buộc |
| 2.1.4 | Random reward sau session | Sau session → random XP / coin / badge | Spring `RewardService` với weighted random | 🔴 Bắt buộc |
| 2.1.5 | Popup hiển thị reward | Animation hiện phần thưởng sau session | Angular Animations + Angular Material Dialog | 🟡 Quan trọng |
| 2.1.6 | Milestone reward (7/30/100 ngày) | Tự động trao reward khi đạt streak milestone | Spring `ApplicationEvent` + `@EventListener` | 🔴 Bắt buộc |
| 2.1.7 | Time-based reward (khung giờ) | Config khung giờ reward xuất hiện (VD 20h-22h) | Spring check `ZonedDateTime` theo timezone user | 🟡 Quan trọng |
| 2.1.8 | User config loại reward | User chọn bật/tắt từng loại reward | Angular Settings + Spring `user_reward_config` table | 🟡 Quan trọng |

**Backend:** `RewardService`, `BadgeService`, `RewardConfig` entity
**Frontend:** `RewardPopupComponent`, `BadgeGalleryComponent`, `RewardSettingsComponent`

---

### 2.2 Analytics nâng cao

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.2.1 | So sánh hôm nay vs hôm qua | Widget tăng/giảm thời gian học, số session | Spring query 2 ngày, tính delta | 🔴 Bắt buộc |
| 2.2.2 | So sánh tháng này vs tháng trước | Tổng thời gian học 2 tháng gần nhất | Spring JPQL `GROUP BY MONTH` | 🔴 Bắt buộc |
| 2.2.3 | Line chart thời gian học theo tuần | 7 ngày gần nhất | **ng-apexcharts** LineChart | 🔴 Bắt buộc |
| 2.2.4 | Bar chart số thẻ tạo theo ngày | Thẻ tạo trong 30 ngày gần nhất | **ng-apexcharts** BarChart | 🟡 Quan trọng |
| 2.2.5 | Tốc độ học (thẻ/giờ) | Tổng thẻ ôn / tổng giờ học | Tính trong Spring service | 🟡 Quan trọng |
| 2.2.6 | Độ retention | % thẻ đánh giá "Dễ / Ổn" / tổng lần ôn | Spring aggregate query | 🟡 Quan trọng |

**Backend:** `AnalyticsController`, `AnalyticsService`
**Frontend:** `AnalyticsPageComponent`, `ChartWrapperComponent` (dùng **ng-apexcharts**)

---

### 2.3 Daily Summary

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.3.1 | Trang tổng kết cuối ngày | Hiện tổng thời gian, số thẻ, số session | Spring API + Angular route `/summary` | 🔴 Bắt buộc |
| 2.3.2 | Danh sách thẻ đã ôn hôm nay | Liệt kê các thẻ đã học | Spring query `review_logs` theo ngày | 🟡 Quan trọng |
| 2.3.3 | Gợi ý kế hoạch hôm sau | Số thẻ SR cần ôn ngày mai | Spring query `next_review_date = tomorrow` | 🟡 Quan trọng |

---

### 2.4 AI Assistant

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.4.1 | Tạo flashcard từ văn bản | User paste text → Spring gọi Claude API → trả về Q&A → user duyệt | Spring `RestTemplate` / `WebClient` + Claude API | 🔴 Bắt buộc |
| 2.4.2 | Tạo flashcard từ PDF | User upload PDF → Spring extract text (Apache PDFBox) → gọi Claude API | **Apache PDFBox** + Claude API | 🟡 Quan trọng |
| 2.4.3 | Tóm tắt nội dung | User paste text → Spring gọi Claude API → trả về tóm tắt | Claude API | 🟡 Quan trọng |
| 2.4.4 | Gợi ý nội dung học | Dựa trên lịch sử deck, AI gợi ý chủ đề tiếp theo | Claude API + user history context | 🟢 Nice to have |

**Backend:** `AIController`, `ClaudeApiService` (gọi API qua `WebClient`)
**Frontend:** `AIAssistantComponent`, `FlashcardReviewDialogComponent`

---

### 2.5 Notification System

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.5.1 | Nhắc học hàng ngày | Push notification theo giờ user cài đặt | Spring `@Scheduled` + **java-webpush** | 🔴 Bắt buộc |
| 2.5.2 | Nhắc ôn bài SR | Thông báo khi có thẻ cần ôn hôm nay | Spring cron + Web Push + Angular Service Worker | 🔴 Bắt buộc |
| 2.5.3 | Nhắc khi gần mất streak | Thông báo lúc 20h nếu hôm nay chưa học | Spring `@Scheduled("0 0 20 * * ?")`+ Web Push | 🔴 Bắt buộc |
| 2.5.4 | User tự cài giờ nhắc | Cài giờ nhận thông báo trong Settings | Angular Settings + `notification_settings` table | 🟡 Quan trọng |
| 2.5.5 | Đăng ký nhận Web Push | Browser xin quyền, lưu subscription lên server | Angular Service Worker + Spring lưu `push_subscriptions` | 🔴 Bắt buộc |

**Backend:** `NotificationScheduler`, `WebPushService`, `PushSubscriptionRepository`
**Frontend:** `NotificationService` (Angular), `PushSubscriptionComponent`

---

### 2.6 Proof of Study

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.6.1 | Upload ảnh bằng chứng học | Sau session, yêu cầu upload 1 ảnh | Angular file input + Cloudinary Java SDK | 🟡 Quan trọng |
| 2.6.2 | Bật / Tắt tính năng này | Toggle trong Settings | Angular toggle + Spring user settings | 🟡 Quan trọng |
| 2.6.3 | Xem lại lịch sử proof | Gallery ảnh đã upload theo ngày | Angular gallery component + Cloudinary URLs | 🟢 Nice to have |

---

### 2.7 Goal System

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 2.7.1 | Đặt mục tiêu số giờ học/ngày | User nhập mục tiêu giờ học mỗi ngày | Angular form + Spring `user_goals` table | 🔴 Bắt buộc |
| 2.7.2 | Đặt mục tiêu số thẻ ôn/ngày | User nhập số thẻ cần ôn mỗi ngày | Angular form + Spring | 🔴 Bắt buộc |
| 2.7.3 | Progress bar theo dõi mục tiêu | Dashboard hiện % hoàn thành mục tiêu hôm nay | Angular Material Progress Bar | 🔴 Bắt buộc |
| 2.7.4 | Lịch sử hoàn thành mục tiêu | Xem ngày nào đạt / không đạt mục tiêu | Spring query + Angular heatmap | 🟡 Quan trọng |

---

## Phase 3 — Social & Polish

> Mục tiêu: Tăng retention dài hạn qua cộng đồng và cạnh tranh.

### 3.1 Social / Community

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 3.1.1 | Kết bạn | Gửi / chấp nhận lời mời kết bạn | Spring JPA `Friendship` entity + REST API | 🔴 Bắt buộc |
| 3.1.2 | Xem streak của bạn bè | Danh sách bạn bè + streak của họ | Spring JOIN query `friendships` + `users` | 🔴 Bắt buộc |
| 3.1.3 | Leaderboard theo tuần | Bảng xếp hạng thời gian học trong 7 ngày | Spring aggregate + `RANK()` window function | 🔴 Bắt buộc |
| 3.1.4 | Leaderboard theo streak | Bảng xếp hạng streak dài nhất | Spring query sort by streak desc | 🟡 Quan trọng |
| 3.1.5 | Chia sẻ streak lên mạng xã hội | Tạo ảnh share (OG image) với streak | Spring + **Thymeleaf** render HTML → screenshot / **iText** | 🟢 Nice to have |

**Backend:** `FriendshipController`, `LeaderboardController`, `LeaderboardService`
**Frontend:** `FriendsComponent`, `LeaderboardComponent`

---

### 3.2 Music Management

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 3.2.1 | Lưu YouTube playlist | User nhập link YouTube playlist → lưu | Spring lưu URL + YouTube Data API v3 (lấy metadata) | 🟡 Quan trọng |
| 3.2.2 | Phát YouTube trong app | Embed YouTube iframe khi đang học | Angular YouTube Player Component (`@angular/youtube-player`) | 🟡 Quan trọng |
| 3.2.3 | Gợi ý nhạc theo mood | Preset playlist theo mood: Focus / Chill / Energetic | Danh sách playlist tĩnh trong DB | 🟢 Nice to have |
| 3.2.4 | Upload file nhạc | User upload MP3 → lưu và phát trong app | Cloudinary Java SDK + Angular HTML5 Audio | 🟢 Nice to have |

> ⚠️ Spotify bị giới hạn bởi ToS + yêu cầu Premium — không khuyến nghị.

---

## Phase 4 — Scale & Offline

> Mục tiêu: Hỗ trợ offline, tối ưu hiệu năng, mở rộng mobile.

### 4.1 Offline Mode (Angular PWA)

| # | Chức năng | Mô tả chi tiết | Công nghệ | Độ ưu tiên |
|---|-----------|----------------|-----------|------------|
| 4.1.1 | Cache dữ liệu flashcard offline | Lưu deck + thẻ vào local khi online | **@angular/pwa** + IndexedDB (`Dexie.js`) | 🔴 Bắt buộc |
| 4.1.2 | Học flashcard offline | Dùng dữ liệu cache khi mất mạng | Angular Service Worker + IndexedDB | 🔴 Bắt buộc |
| 4.1.3 | Chạy timer offline | Timer không cần mạng | Angular local state, sync khi có mạng | 🔴 Bắt buộc |
| 4.1.4 | Sync dữ liệu khi có mạng lại | Đẩy session + đánh giá thẻ lên Spring server | Background Sync API + Angular Service Worker | 🔴 Bắt buộc |
| 4.1.5 | Xử lý conflict khi sync | Nếu cùng thẻ bị sửa offline và online → resolve | Last-write-wins (`updated_at` timestamp) | 🟡 Quan trọng |

**Backend:** Spring API idempotent endpoints (hỗ trợ retry an toàn)
**Frontend:** `OfflineSyncService`, `ngsw-config.json`, Dexie.js stores

---

## Tổng hợp Stack Công Nghệ

### Backend — Spring Boot 3

| Thành phần | Công nghệ | Mục đích |
|------------|-----------|----------|
| Framework | **Spring Boot 3.x** | Core framework |
| Auth | **Spring Security 6** + JJWT | JWT, OAuth2 Google |
| ORM | **Spring Data JPA** + Hibernate | Tương tác DB |
| Database | **PostgreSQL 15** | Dữ liệu chính |
| Cache | **Redis** + Spring Cache | Streak cache, token blacklist |
| Migration | **Flyway** | Quản lý schema DB |
| Scheduler | **Spring `@Scheduled`** | Cron jobs (streak reset, notification) |
| HTTP Client | **WebClient** (Spring WebFlux) | Gọi Claude API |
| File Upload | **Cloudinary Java SDK** | Avatar, proof of study |
| PDF | **Apache PDFBox** | Extract text từ PDF |
| Push Notif | **java-webpush** | Gửi Web Push notification |
| Spaced Rep | **fsrs4j** | Thuật toán FSRS (SM-2 nâng cấp) |
| Build | **Maven** hoặc **Gradle** | Build tool |

### Frontend — Angular 17+

| Thành phần | Công nghệ | Mục đích |
|------------|-----------|----------|
| Framework | **Angular 17+** (Standalone Components) | Core framework |
| UI Library | **Angular Material** | Components chuẩn |
| Styling | **Tailwind CSS** | Utility-first CSS |
| Charts | **ng-apexcharts** | Line chart, bar chart analytics |
| Heatmap | Custom SVG Component hoặc **ngx-graph** | GitHub-style heatmap |
| Animation | **Angular Animations** | Flip card, reward popup |
| Forms | **Angular Reactive Forms** | Form validation |
| HTTP | **Angular HttpClient** + Interceptor | Gọi Spring API, auto attach JWT |
| State | **Angular Signals** (hoặc NgRx nếu cần) | State management |
| PWA | **@angular/pwa** | Offline support, Service Worker |
| Offline DB | **Dexie.js** (IndexedDB wrapper) | Cache local data |
| YouTube | **@angular/youtube-player** | Nhúng YouTube player |
| Build | **Angular CLI** | Build, serve, test |

### Kiến trúc tổng thể

```
[Angular App] ──── HTTPS / JWT ────► [Spring Boot API]
     │                                       │
     │ (offline)                        ┌────┴────┐
 [IndexedDB]                         [PostgreSQL] [Redis]
 [Service Worker]                          │
                                    [Cloudinary]  [Claude API]
```

---

## Bảng Milestone Tổng Quan

| Phase | Chức năng chính | Ước tính |
|-------|----------------|----------|
| Phase 1 | Auth, Timer, Streak, Flashcard, SR, Dashboard cơ bản | 4–6 tuần |
| Phase 2 | Reward, Analytics, Daily Summary, AI, Notification, Goal | 4–5 tuần |
| Phase 3 | Social, Leaderboard, Music | 3–4 tuần |
| Phase 4 | Offline Mode (Angular PWA), Sync | 3–4 tuần |

---

## Thứ tự setup project (Phase 1)

```
1. Khởi tạo Spring Boot project (Spring Initializr)
   └── Dependencies: Web, Security, JPA, PostgreSQL, Redis, Mail, Validation

2. Khởi tạo Angular project
   └── ng new learn-app --routing --style=scss
   └── ng add @angular/material
   └── npm install tailwindcss ng-apexcharts dexie

3. Setup DB schema với Flyway migrations

4. Implement theo thứ tự:
   Auth → Timer → Streak → Flashcard → Spaced Repetition → Dashboard
```

---

*Tài liệu được cập nhật ngày 2026-03-25 — Stack: Spring Boot 3 + Angular 17+*
