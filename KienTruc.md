# 🏗️ Kiến Trúc Hệ Thống - Learn App

> **Stack:** Spring Boot 3 · Angular 17 · PostgreSQL · Redis · Docker · OpenFeign · Eureka

---

## 1. Tổng quan kiến trúc

```
                         ┌─────────────────────────────────────────┐
                         │              CLIENT                      │
                         │         Angular 17 (SPA)                 │
                         └───────────────────┬─────────────────────┘
                                             │ HTTPS
                                             ▼
                         ┌─────────────────────────────────────────┐
                         │           API GATEWAY :8080              │
                         │       Spring Cloud Gateway               │
                         │  • JWT validation                        │
                         │  • Rate limiting                         │
                         │  • Route → service (via Eureka)          │
                         └──────┬──────────────┬────────────┬───────┘
                                │              │            │
              ┌─────────────────┘    ┌─────────┘    ┌──────┘
              ▼                      ▼               ▼
┌─────────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   auth-service      │  │  study-service    │  │ flashcard-service │
│       :8081         │  │      :8082        │  │      :8083        │
│                     │  │                   │  │                   │
│ • Đăng ký / Login   │  │ • Study Timer     │  │ • Deck & Cards    │
│ • JWT issue/verify  │  │ • Study Sessions  │  │ • Tags            │
│ • OAuth2 Google     │  │ • Streak System   │  │ • Spaced Repeat.  │
│ • User profile      │  │ • Reward/Gamify   │  │ • AI Flashcard    │
│ • Role management   │  │ • Goals & Notif.  │  │ • Proof of Study  │
│                     │  │ • Analytics       │  │                   │
└──────────┬──────────┘  └────────┬──────────┘  └────────┬──────────┘
           │                      │                       │
           │         ┌────────────┘                       │
           │         │  OpenFeign calls                   │
           │         ▼                                    │
           │  ┌─────────────────────────────────────────┐ │
           │  │  study-service  →  auth-service          │ │
           │  │  (xác thực userId, lấy timezone user)    │ │
           │  │                                          │ │
           │  │  study-service  →  flashcard-service     │ │
           │  │  (lấy stats SR cho analytics)            │ │
           │  │                                          │ │
           │  │  flashcard-service  →  auth-service      │ │
           │  │  (xác thực userId)                       │ │
           └──┴──────────────────────────────────────────┘─┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
     ┌──────────────────────┐         ┌──────────────────────┐
     │   PostgreSQL :5432   │         │     Redis :6379       │
     │                      │         │                       │
     │  schema: auth        │         │ • JWT blacklist        │
     │  schema: study       │         │ • Streak cache         │
     │  schema: flashcard   │         │ • Session cache        │
     └──────────────────────┘         └──────────────────────┘
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
┌──────────────┐        ┌─────────────────────┐
│  pgAdmin     │        │  Eureka Server       │
│    :5050     │        │  discovery-server    │
│  (dev only)  │        │      :8761           │
└──────────────┘        └─────────────────────┘
```

---

## 2. Chi tiết từng Service

### 2.1 `discovery-server` — Eureka Server

| Thuộc tính | Giá trị |
|------------|---------|
| Port | `8761` |
| Mục đích | Service registry — các service tự đăng ký vào đây khi khởi động |
| Eureka Dashboard | http://localhost:8761 |
| Phụ thuộc vào | Không phụ thuộc service nào |

**Vai trò:** Khi `api-gateway` muốn route request đến `auth-service`, nó hỏi Eureka lấy địa chỉ IP/port thực tế. Không cần hardcode URL.

---

### 2.2 `api-gateway` — Spring Cloud Gateway

| Thuộc tính | Giá trị |
|------------|---------|
| Port | `8080` |
| Mục đích | Single entry point cho toàn bộ hệ thống |
| Phụ thuộc vào | `discovery-server` |

**Routing rules:**

| Path prefix | Route đến | Ghi chú |
|-------------|-----------|---------|
| `/api/v1/auth/**` | `auth-service` | Public (không cần JWT) |
| `/api/v1/users/**` | `auth-service` | Cần JWT |
| `/api/v1/sessions/**` | `study-service` | Cần JWT |
| `/api/v1/streaks/**` | `study-service` | Cần JWT |
| `/api/v1/rewards/**` | `study-service` | Cần JWT |
| `/api/v1/analytics/**` | `study-service` | Cần JWT |
| `/api/v1/goals/**` | `study-service` | Cần JWT |
| `/api/v1/decks/**` | `flashcard-service` | Cần JWT |
| `/api/v1/cards/**` | `flashcard-service` | Cần JWT |
| `/api/v1/reviews/**` | `flashcard-service` | Cần JWT |
| `/api/v1/ai/**` | `flashcard-service` | Cần JWT |

**JWT Filter:** Gateway validate JWT trước khi forward — nếu invalid thì trả 401 ngay, không cần đến service.

---

### 2.3 `auth-service` — Authentication & User

| Thuộc tính | Giá trị |
|------------|---------|
| Port | `8081` |
| DB Schema | `auth` |
| Phụ thuộc vào | PostgreSQL, Redis (token blacklist) |
| Gọi service khác | Không |

**Bảng DB (schema: auth):**
- `users` — thông tin người dùng, role, timezone, XP, coin
- `refresh_tokens` — JWT refresh token
- `push_subscriptions` — Web Push subscription
- `user_settings` — cấu hình notification, reward preferences

**API chính:**
```
POST   /api/v1/auth/register          Đăng ký
POST   /api/v1/auth/login             Đăng nhập → trả JWT
POST   /api/v1/auth/refresh           Refresh access token
POST   /api/v1/auth/logout            Blacklist token
GET    /api/v1/auth/google            OAuth2 Google redirect
GET    /api/v1/users/me               Lấy profile
PUT    /api/v1/users/me               Cập nhật profile
GET    /api/v1/users/{id}/info        Internal API cho service khác gọi
```

**Internal API** (`/internal/**`) — chỉ các service nội bộ gọi qua Feign, không expose ra gateway:
```
GET /internal/users/{userId}/timezone    Lấy timezone của user
GET /internal/users/{userId}/exists      Kiểm tra user tồn tại
```

---

### 2.4 `study-service` — Study & Gamification

| Thuộc tính | Giá trị |
|------------|---------|
| Port | `8082` |
| DB Schema | `study` |
| Phụ thuộc vào | PostgreSQL, Redis (streak/session cache) |
| Gọi service khác | `auth-service` (Feign), `flashcard-service` (Feign) |

**Bảng DB (schema: study):**
- `study_sessions` — pomodoro sessions đã hoàn thành
- `streaks` — chuỗi học liên tiếp
- `badges` / `user_badges` — hệ thống badge
- `reward_logs` — lịch sử nhận reward (XP, coin)
- `proof_of_study` — ảnh bằng chứng học
- `user_goals` — mục tiêu học hàng ngày

**Feign Clients:**
```java
// Gọi auth-service
@FeignClient(name = "auth-service", path = "/internal")
interface AuthFeignClient {
    @GetMapping("/users/{userId}/timezone")
    String getUserTimezone(@PathVariable UUID userId);
}

// Gọi flashcard-service
@FeignClient(name = "flashcard-service", path = "/internal")
interface FlashcardFeignClient {
    @GetMapping("/reviews/stats/{userId}")
    ReviewStatsResponse getReviewStats(@PathVariable UUID userId,
                                       @RequestParam LocalDate date);
}
```

**Luồng sau khi hoàn thành session:**
```
POST /api/v1/sessions/complete
    → Lưu study_session
    → Gọi auth-service (lấy timezone user)
    → Cập nhật streak (dùng timezone đúng)
    → Tính reward ngẫu nhiên (XP/coin/badge)
    → Lưu reward_log
    → Cập nhật xp_total, coin_balance (gọi auth-service)
    → Trả về SessionCompletedResponse
```

---

### 2.5 `flashcard-service` — Flashcard & AI

| Thuộc tính | Giá trị |
|------------|---------|
| Port | `8083` |
| DB Schema | `flashcard` |
| Phụ thuộc vào | PostgreSQL, Cloudinary, Claude API |
| Gọi service khác | `auth-service` (Feign) |

**Bảng DB (schema: flashcard):**
- `decks` — bộ thẻ học
- `cards` — flashcard (text + image, FSRS fields)
- `tags` / `card_tags` — gắn tag cho thẻ
- `card_reviews` — lịch sử ôn tập SR

**Feign Client:**
```java
@FeignClient(name = "auth-service", path = "/internal")
interface AuthFeignClient {
    @GetMapping("/users/{userId}/exists")
    boolean userExists(@PathVariable UUID userId);
}
```

**Internal API** (cho study-service gọi):
```
GET /internal/reviews/stats/{userId}?date=   Thống kê ôn tập theo ngày
```

---

## 3. Luồng giao tiếp OpenFeign

```
Cách Feign hoạt động trong dự án này:

1. Mỗi service đăng ký tên vào Eureka khi khởi động
   VD: auth-service → đăng ký với name "auth-service"

2. Feign Client dùng tên service (không dùng URL cứng):
   @FeignClient(name = "auth-service")
   → Eureka tự resolve IP:port tương ứng

3. application.yaml cấu hình timeout và circuit breaker:
   feign.client.config.auth-service.connectTimeout=5000

4. Trong Docker: các service giao tiếp qua Docker network
   (không cần expose port ra ngoài host)
```

### Sơ đồ Feign calls:

```
study-service ──(Feign)──► auth-service
     │                     GET /internal/users/{id}/timezone
     │                     POST /internal/users/{id}/balance  (cộng XP/coin)
     │
     └──(Feign)──► flashcard-service
                   GET /internal/reviews/stats/{userId}

flashcard-service ──(Feign)──► auth-service
                               GET /internal/users/{id}/exists
```

---

## 4. Cấu trúc thư mục dự án

```
learn-app/
├── backend/
│   ├── pom.xml                          ← Parent POM (quản lý tất cả deps)
│   │
│   ├── discovery-server/                ← Eureka Server
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/resources/
│   │       └── application.yaml
│   │
│   ├── api-gateway/                     ← Spring Cloud Gateway
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/resources/
│   │       └── application.yaml
│   │
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/learnapp/auth/
│   │       │   ├── AuthServiceApplication.java
│   │       │   ├── controller/          AuthController, UserController
│   │       │   ├── service/             AuthService, UserService, JwtService
│   │       │   ├── repository/          UserRepository, RefreshTokenRepository
│   │       │   ├── entity/              User, RefreshToken, UserSettings
│   │       │   ├── dto/                 LoginRequest, RegisterRequest, UserResponse...
│   │       │   ├── security/            JwtFilter, SecurityConfig
│   │       │   └── internal/            InternalUserController (cho Feign)
│   │       └── resources/
│   │           └── application.yaml
│   │
│   ├── study-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/learnapp/study/
│   │       │   ├── StudyServiceApplication.java
│   │       │   ├── controller/          SessionController, StreakController...
│   │       │   ├── service/             SessionService, StreakService, RewardService...
│   │       │   ├── repository/
│   │       │   ├── entity/
│   │       │   ├── dto/
│   │       │   ├── feign/               AuthFeignClient, FlashcardFeignClient
│   │       │   └── scheduler/           StreakResetScheduler, NotificationScheduler
│   │       └── resources/
│   │           └── application.yaml
│   │
│   └── flashcard-service/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/learnapp/flashcard/
│           │   ├── FlashcardServiceApplication.java
│           │   ├── controller/          DeckController, CardController...
│           │   ├── service/             DeckService, CardService, SpacedRepService, AiService
│           │   ├── repository/
│           │   ├── entity/
│           │   ├── dto/
│           │   ├── feign/               AuthFeignClient
│           │   └── internal/            InternalReviewController (cho Feign)
│           └── resources/
│               └── application.yaml
│
├── frontend/                            ← Angular 17
├── docker/
│   └── init/
│       ├── 01_schema.sql                ← Tạo 3 schema + tables
│       └── 02_seed.sql
├── docker-compose.yaml                  ← 8 containers
├── .env
├── CLAUDE.md
├── KeHoach.md
└── KienTruc.md                         ← File này
```

---

## 5. Docker Compose — Tổng quan containers

| Container | Image | Port | Phụ thuộc |
|-----------|-------|------|-----------|
| `learn_postgres` | postgres:15-alpine | 5432 | — |
| `learn_redis` | redis:7-alpine | 6379 | — |
| `learn_pgadmin` | dpage/pgadmin4 | 5050 | postgres |
| `learn_discovery` | discovery-server (build) | 8761 | — |
| `learn_gateway` | api-gateway (build) | 8080 | discovery |
| `learn_auth` | auth-service (build) | 8081 | postgres, redis, discovery |
| `learn_study` | study-service (build) | 8082 | postgres, redis, discovery |
| `learn_flashcard` | flashcard-service (build) | 8083 | postgres, discovery |

**Build context:** `./backend` (dùng chung parent pom)
**Docker network:** `learn_app_network` (bridge) — các service giao tiếp qua tên container

---

## 6. Cấu hình application.yaml — Mẫu

### Tất cả business service (auth/study/flashcard)

```yaml
spring:
  application:
    name: auth-service          # ← tên đăng ký vào Eureka

  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/learn_app?currentSchema=auth}
    username: ${DB_USERNAME:learn_user}
    password: ${DB_PASSWORD:learn_pass}

  jpa:
    hibernate:
      ddl-auto: validate         # Flyway quản lý schema, không để Hibernate tự tạo
    properties:
      hibernate.default_schema: auth

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka}
  instance:
    prefer-ip-address: true      # Quan trọng trong Docker

# Cấu hình Feign client
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 10000
        loggerLevel: BASIC
      auth-service:              # override cho từng service nếu cần
        connectTimeout: 3000
        readTimeout: 5000

server:
  port: 8081
```

### Trong Docker — override qua environment variables

```yaml
# docker-compose.yaml
environment:
  DB_URL: jdbc:postgresql://learn_postgres:5432/learn_app?currentSchema=auth
  DB_USERNAME: learn_user
  DB_PASSWORD: learn_pass
  EUREKA_URL: http://learn_discovery:8761/eureka
```

---

## 7. Dockerfile — Pattern chung

```dockerfile
# ── Stage 1: Build ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy parent POM trước (cache layer)
COPY pom.xml ./pom.xml

# Copy tất cả child POM (cần cho multi-module resolution)
COPY discovery-server/pom.xml  ./discovery-server/pom.xml
COPY api-gateway/pom.xml       ./api-gateway/pom.xml
COPY auth-service/pom.xml      ./auth-service/pom.xml
COPY study-service/pom.xml     ./study-service/pom.xml
COPY flashcard-service/pom.xml ./flashcard-service/pom.xml

# Download dependencies (cache layer — chỉ re-run khi pom thay đổi)
RUN mvn dependency:go-offline -pl auth-service -am -B

# Copy source của service này
COPY auth-service/src ./auth-service/src

# Build JAR
RUN mvn package -pl auth-service -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Tạo non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/auth-service/target/*.jar app.jar
USER appuser

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

> Build context trong docker-compose: `context: ./backend`, `dockerfile: auth-service/Dockerfile`

---

## 8. Schema DB theo Service

Mỗi service sở hữu schema riêng trong cùng PostgreSQL instance:

| Service | Schema | Bảng chính |
|---------|--------|------------|
| auth-service | `auth` | users, refresh_tokens, user_settings, push_subscriptions |
| study-service | `study` | study_sessions, streaks, badges, user_badges, reward_logs, user_goals, proof_of_study |
| flashcard-service | `flashcard` | decks, cards, tags, card_tags, card_reviews |

> Service **không được** query trực tiếp vào schema của service khác.
> Muốn lấy dữ liệu của service khác → dùng **Feign Client**.

---

## 9. Thứ tự khởi động (Startup Order)

```
1. PostgreSQL + Redis      (infrastructure)
2. discovery-server        (cần có trước khi service nào đăng ký)
3. auth-service            (service không phụ thuộc service khác)
4. flashcard-service       (phụ thuộc auth-service qua Feign)
5. study-service           (phụ thuộc auth + flashcard qua Feign)
6. api-gateway             (cần Eureka để route)
```

> Trong docker-compose: dùng `depends_on` + `healthcheck` để đảm bảo thứ tự này.

---

*Tài liệu được tạo ngày 2026-03-25*
