# Learn App — Claude Guidelines

## Ngôn ngữ giao tiếp
- Trả lời tôi **bằng tiếng Việt**
- Comment trong code **bằng tiếng Anh**
- Tên biến, class, method **bằng tiếng Anh**

---

## Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Spring Boot 3.x, Java 17, Maven (multi-module) |
| Architecture | Microservices — 3 business services + gateway + discovery |
| Service Discovery | Spring Cloud Netflix Eureka |
| API Gateway | Spring Cloud Gateway |
| Inter-service | OpenFeign (service name via Eureka, không hardcode URL) |
| Frontend | Angular 17+ (Standalone Components) |
| Database | PostgreSQL 15 (3 schema riêng: auth / study / flashcard) |
| Cache | Redis 7 |
| ORM | Spring Data JPA + Hibernate |
| Migration | Flyway |
| Auth | Spring Security 6 + JJWT |
| Styling | Tailwind CSS + Angular Material |
| Container | Docker (mỗi service = 1 container, build từ Dockerfile) |

---

## Microservices — 3 Business Services

> Xem `KienTruc.md` để biết chi tiết kiến trúc đầy đủ.

| Service | Port | Schema DB | Feign gọi |
|---------|------|-----------|-----------|
| `discovery-server` | 8761 | — | — |
| `api-gateway` | 8080 | — | — |
| `auth-service` | 8081 | `auth` | Không gọi service nào |
| `study-service` | 8082 | `study` | auth-service, flashcard-service |
| `flashcard-service` | 8083 | `flashcard` | auth-service |

### Quy tắc microservices bắt buộc
- Mỗi service **chỉ đọc/ghi schema của chính nó** — không JOIN cross-schema
- Muốn dữ liệu của service khác → dùng **Feign Client**, không query DB trực tiếp
- Internal API (`/internal/**`) chỉ cho Feign gọi, không expose qua gateway
- Feign client dùng **tên service** (`name = "auth-service"`), không dùng URL cứng

---

## Cấu trúc thư mục dự án

```
learn-app/
├── backend/
│   ├── pom.xml                      # Parent POM
│   ├── discovery-server/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/resources/application.yaml
│   ├── api-gateway/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/resources/application.yaml
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/java/com/learnapp/auth/
│   │       ├── controller/          # AuthController, UserController
│   │       ├── service/             # AuthService, JwtService, UserService
│   │       ├── repository/
│   │       ├── entity/
│   │       ├── dto/
│   │       ├── security/            # JwtFilter, SecurityConfig
│   │       └── internal/            # InternalUserController (Feign only)
│   ├── study-service/
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/java/com/learnapp/study/
│   │       ├── controller/
│   │       ├── service/
│   │       ├── feign/               # AuthFeignClient, FlashcardFeignClient
│   │       └── scheduler/           # StreakResetScheduler
│   └── flashcard-service/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/java/com/learnapp/flashcard/
│           ├── controller/
│           ├── service/
│           ├── feign/               # AuthFeignClient
│           └── internal/            # InternalReviewController (Feign only)
│
├── frontend/                        # Angular 17
│   └── src/app/
│       ├── core/                    # Guards, interceptors, singleton services
│       ├── shared/                  # Shared components, pipes
│       ├── features/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── deck/
│       │   ├── timer/
│       │   ├── review/
│       │   ├── analytics/
│       │   └── settings/
│       └── layout/
│
├── docker/init/                     # SQL init scripts (schema + seed)
├── docker-compose.yaml              # 8 containers
├── .env
├── CLAUDE.md
├── KeHoach.md
└── KienTruc.md
```

---

## Backend — Quy tắc Spring Boot & Microservices

### Package structure (mỗi module)
```
{module}/
├── controller/     # @RestController — chỉ nhận request, trả response
├── service/        # Interface + Impl — business logic
├── repository/     # JpaRepository
├── entity/         # @Entity JPA
├── dto/            # Request / Response DTO
└── mapper/         # Entity ↔ DTO (dùng MapStruct nếu có)
```

### Naming conventions
- Controller: `{Name}Controller`
- Service interface: `{Name}Service`
- Service implementation: `{Name}ServiceImpl`
- Repository: `{Name}Repository`
- Entity: `{Name}` (ví dụ: `User`, `Deck`, `Card`)
- DTO request: `{Name}Request` hoặc `Create{Name}Request`, `Update{Name}Request`
- DTO response: `{Name}Response`

### API conventions
- Base path: `/api/v1/`
- HTTP methods đúng nghĩa: GET (read), POST (create), PUT (update toàn bộ), PATCH (update một phần), DELETE
- Response luôn wrap trong `ApiResponse<T>`:
  ```java
  public record ApiResponse<T>(boolean success, T data, String message) {}
  ```
- Error response format:
  ```json
  { "success": false, "message": "...", "code": "ERROR_CODE" }
  ```
- Pagination: dùng `Page<T>` của Spring, query param `?page=0&size=20&sort=createdAt,desc`

### Validation
- Dùng `@Valid` + Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, v.v.)
- Custom exception: extend `RuntimeException`, có `errorCode` field
- Global exception handler: `@RestControllerAdvice`

### Database / JPA
- UUID cho primary key: `@GeneratedValue` với `uuid_generate_v4()`
- Timestamps: `@CreationTimestamp`, `@UpdateTimestamp`
- Không dùng `FetchType.EAGER` — mặc định LAZY
- Không viết native query nếu JPQL đủ dùng
- Migration: **chỉ dùng Flyway**, không bao giờ `spring.jpa.hibernate.ddl-auto=update` trên môi trường thật

### Security
- Mọi endpoint cần auth đều bảo vệ bằng `@PreAuthorize`
- Không log password, token, sensitive data
- Secrets lấy từ environment variable, không hardcode

### OpenFeign — Inter-service calls
- Feign client đặt trong package `feign/` của service gọi
- Dùng `name = "auth-service"` (service name trong Eureka), không dùng `url` cứng
- Internal endpoint đặt prefix `/internal/` và **không** được đăng ký route trong api-gateway
- Fallback: dùng `@CircuitBreaker` nếu service bị down (Phase 2)
- Truyền JWT qua Feign bằng `RequestInterceptor` để internal call cũng được authenticate

### Dockerfile
- Build context luôn là `./backend` (cần parent pom)
- Multi-stage: `maven:3.9-eclipse-temurin-17-alpine` build → `eclipse-temurin:17-jre-alpine` runtime
- Non-root user trong container
- ENTRYPOINT: `java -Djava.security.egd=file:/dev/./urandom -jar app.jar`

---

## Frontend — Quy tắc Angular

### Component
- Dùng **Standalone Components** (`standalone: true`)
- Mỗi feature là một lazy-loaded route
- Tên file: `{name}.component.ts`, `{name}.component.html`, `{name}.component.scss`
- Smart component (container): gọi service, quản lý state
- Dumb component (presentational): nhận `@Input`, emit `@Output`, không gọi service

### Service
- Singleton service: `providedIn: 'root'`
- Feature service: provide ở route level
- Tên file: `{name}.service.ts`
- Dùng `HttpClient` qua `inject()` (không constructor injection)

### State management
- Dùng **Angular Signals** cho state local và shared đơn giản
- Không dùng NgRx trừ khi state thực sự phức tạp

### HTTP
- Tất cả API call đi qua `ApiService` hoặc feature service
- JWT tự động attach qua `AuthInterceptor`
- Handle error tập trung qua `ErrorInterceptor`
- Dùng `Observable` + `async pipe` trong template, tránh `.subscribe()` thủ công

### Styling
- Utility class: **Tailwind CSS**
- Component UI: **Angular Material**
- Không viết CSS inline trong template
- Responsive: mobile-first

### Naming
- Component selector: `app-{feature}-{name}` (ví dụ: `app-deck-card-item`)
- Interface/Type: PascalCase, không prefix `I`
- Enum: PascalCase

---

## Git conventions

### Branch
- `feature/{ten-tinh-nang}` — tính năng mới
- `fix/{mo-ta-loi}` — bug fix
- `chore/{mo-ta}` — config, dependencies

### Commit message
```
feat: add streak reset cron job
fix: correct timezone offset in study session
chore: update Spring Boot to 3.2.1
```
Prefix: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

---

## Quy tắc khi làm việc

1. **Đọc file trước khi sửa** — không sửa code chưa đọc
2. **Không over-engineer** — làm đủ yêu cầu, không thêm feature chưa cần
3. **Không hardcode** — config, secret, URL đều lấy từ env/properties
4. **Timezone** — mọi logic liên quan đến ngày/giờ đều tính theo timezone của user (lưu trong `users.timezone`)
5. **UUID** — dùng UUID cho tất cả primary key, không dùng auto-increment integer
6. **Migration** — mỗi thay đổi schema là 1 file Flyway mới, đặt tên `V{version}__{description}.sql`
