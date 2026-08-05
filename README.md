# FitBudget — Fitness & Nutrition Tracker (Gym Tracking App)

> Ứng dụng theo dõi tập luyện & dinh dưỡng cá nhân: workout planner, meal planner theo ngân sách, macro calculator, progress tracking, analytics, và gói premium thanh toán qua PayOS (Vietnam).

## Mục lục

1. [Tech Stack](#tech-stack)
2. [Tính năng](#tính-năng)
3. [Kiến trúc](#kiến-trúc)
4. [Data Model](#data-model)
5. [Quyết định bảo mật quan trọng](#quyết-định-bảo-mật-quan-trọng)
6. [API Surface](#api-surface)
7. [Testing & Quality Gates](#testing--quality-gates)
8. [Chạy local](#chạy-local)
9. [Tài liệu tham khảo](#tài-liệu-tham-khảo)
10. [Known Limitations](#known-limitations)

---

## Tech Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router, `output: standalone`) | RSC + Client components |
| UI | React 19 + Tailwind CSS 3 | 6 themes, i18n vi/en |
| Charts | Recharts 2 | Theme-sync qua CSS variables |
| Backend | Next.js API Routes (31 endpoints) + Edge middleware | Node runtime + middleware |
| Database | Supabase PostgreSQL 15 | RLS bật cho toàn bộ bảng user-scoped |
| Auth | Supabase Auth (JWT Bearer, PKCE, httpOnly cookies) | Không tự implement auth |
| Payments | PayOS (VN payment gateway) | HMAC-SHA256 webhook |
| Testing | Jest 30 + ts-jest (240 tests / 31 suites) | — |
| Deploy | Docker multi-stage / Vercel | Non-root user, standalone output |

---

## Tính năng

### User
- **Workout planner**: tạo plan theo goal/equipment/level (từ 6 public templates hoặc tự tạo), versioning, log set theo session (reps/weight/RPE), rest timer.
- **Meal planner**: sinh meal plan theo ngân sách (VND) + target macros bằng thuật toán knapsack (`services/meal-planner.ts`).
- **Macro calculator**: Mifflin-St Jeor + activity multiplier (`services/macro-calculator.ts`).
- **Progress & Analytics**: nhập cân nặng, moving average, trend chart (`services/analytics.ts`).
- **Premium (PayOS)**: gói monthly/annual, mock mode cho dev; free giới hạn 1 saved plan.

### Admin
- Dashboard: users, observability, audit logs, bulk actions (role/notification), system controls.
- Phân quyền `user` / `support` / `admin` — **role không thể đổi từ client** (xem Security).

### Observability
- Client-side telemetry: page views, runtime errors, performance, clicks → `observability_events`.
- Admin aggregation: top routes, error rates, slow routes, daily buckets, error spike alert.

---

## Kiến trúc

```
Browser
  │ HTTPS (JWT Bearer / cookies)
  ▼
Next.js 15 — App Router
  ├── middleware.ts          # Rate limit (token bucket), CORS, security.txt, body size limits
  ├── app/api/* (31 routes)  # Route handlers
  │     ├── requireAuth      # → anon client + Bearer token (RLS áp dụng)
  │     ├── requireAdmin     # → service-role client (bypass RLS, sau khi verify role từ DB)
  │     └── validation       # assertRequestBody / requireString / whitelist
  ├── services/*             # Pure business logic, Dependency Injection (supabase là tham số)
  ├── lib/payments/*         # PayOS HMAC + payment audit
  └── lib/premium.ts         # Feature flags & plan limits
  ▼
Supabase PostgreSQL (25 RLS policies)
  ├── users / user_goals / goal_reminders / notification_events
  ├── workout_plans(+versions) / workout_sessions / workout_sets
  ├── meal_plans(+versions) / macro_plans(+versions) / progress
  ├── billing_entitlements / payment_attempts  # SELECT-only qua RLS, viết qua service-role
  └── audit_events           # NO RLS policies — chỉ service-role
```

### Nguyên tắc layering (rút từ codebase)

1. **Route handler mỏng** — chỉ parse/validate request, gọi guard, delegate xuống service.
2. **Service thuần** — nhận `supabase` client inject; mọi SELECT đều có `.eq("user_id", userId)`; ownership check tập trung trong `ensure*Ownership`.
3. **2 client Supabase** — route client (RLS, user-scoped) và service-role client (chỉ trong admin/webhook/cron). Không bao giờ dùng service-role ở client-side.
4. **Không raw SQL / không `.rpc()`** — 100% query builder.
5. **Webhook idempotent** — terminal-state check + unique constraint `(provider, order_code)`.

### Phân quyền premium (server-side)

- Client chỉ hiển thị UI; quyền được enforce server-side: `lib/api/premium-guard.ts` đọc `billing_entitlements` (RLS) → `assertSavedPlanLimit` count trước mọi POST tạo plan (workout/meal/macro). Free: 1 saved plan; premium/annual: unlimited.
- PayOS webhook verify HMAC-SHA256 (constant-time-safe pattern là việc còn lại — xem SECURITY_AUDIT.md).

---

## Data Model

Chuỗi migration SQL trong `supabase/` (áp dụng theo thứ tự):

| File | Nội dung |
|------|----------|
| `schema.sql` | users, user_goals, goal_reminders, notification_events, observability_events, audit_events |
| `policies.sql` | 25 RLS policies |
| `20260507_billing_tables.sql` | billing_entitlements, payment_attempts (+ unique constraint idempotency) |
| `20260706_security_lockdown.sql` | Column-level REVOKE trên `users.role` + trigger `guard_user_role` — chặn privilege escalation qua PostgREST |
| `20260707_workout_plan_templates.sql` | Templates public (seed 6) |
| `20260711_workout_sets_delete.sql` | Cascade delete sets |
| `20260712_workout_sessions.sql` | Sessions + sets logging |
| `20260713_user_body_profile.sql` | Body profile fields |
| `20260720_user_goals_rls.sql` | RLS cho user_goals |
| `seed.sql` | Seed data |

Chi tiết từng bảng: xem [docs/security/SECURITY_AUDIT.md](./docs/security/SECURITY_AUDIT.md) (schema đầy đủ nằm trong tài liệu nội bộ, không public).

---

## Quyết định bảo mật quan trọng

| Control | Hiện trạng |
|---------|-----------|
| Auth | Supabase Auth, PKCE, httpOnly cookies |
| Authorization | RLS 25 policies + guards; admin role verify từ DB trước khi cấp service-role |
| Privilege escalation | REVOKE column-level `users.role` + PG trigger — client không thể tự đổi role |
| IDOR | Service filter `user_id`; checkout bỏ qua `body.userId`, resolve từ token |
| Webhook | HMAC-SHA256 + idempotency (terminal state + unique constraint) |
| Rate limit | Middleware token bucket, tiered (auth 10/min, billing 8/min, admin 60/min) |
| Client IP | Chỉ tin socket IP; `X-Forwarded-For`/`X-Real-IP` chỉ duyệt khi kết nối từ proxy trong `TRUSTED_PROXY_IPS` (chống spoof tạo bucket mới) |
| Error handling | 5xx → generic message; `handleApiError` tập trung |
| Audit | Mọi admin mutation + webhook → `audit_events` (immutable, service-role only) |
| Secrets | `.env.local` gitignored; scan tự động: `npm run security:secrets` |

**Báo cáo chi tiết + backlog fix**: [docs/security/SECURITY_AUDIT.md](./docs/security/SECURITY_AUDIT.md)

---

## API Surface

- **Public/anonymous** (6): workout-templates, macro calculator, meal generator, workout generator, observability ingest.
- **User-authenticated** (25): workout/meal/macro plans + versions, sessions, set logs, progress, analytics, notifications, reminders, settings, billing (entitlement/checkout/cancel/history).
- **Admin-only** (9): users CRUD, audit-logs, summary, observability (raw + aggregated), bulk-actions, system-controls.
- **Webhook/Cron** (2): PayOS webhook (HMAC), notifications cron (`Bearer CRON_SECRET`).

Catalog đầy đủ: nằm trong tài liệu kiến trúc nội bộ (không public).

---

## Testing & Quality Gates

```bash
npm run typecheck         # tsc --noEmit
npm test                  # Jest — 240 tests / 31 suites (~2s)
npm run security:secrets  # scan repo phát hiện service-role key/JWT lọt
npm run security:supabase-bootstrap  # verify RLS & bootstrap
npm run build             # production build (standalone)
```

Phủ chính: billing flow E2E (checkout → webhook → entitlement, replay/idempotency), PayOS HMAC, middleware rate-limit spoof-resistance, premium guard (server-side limit), algorithms (Mifflin-St Jeor, knapsack, moving average), secret containment.

**Gap đã biết**: chưa có integration test cho toàn bộ API routes & admin guards (target ≥60% coverage); chưa có ESLint.

---

## Chạy local

### Yêu cầu
- Node 20+, Supabase project (hoặc `supabase start` local).

### Setup

```bash
npm install
cp .env.example .env.local   # điền đầy đủ
npm run dev                  # http://localhost:3000
```

Áp dụng migrations theo thứ tự trong `supabase/` (Supabase Studio → SQL editor).

### Environment variables

| Variable | Bắt buộc | Mô tả |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (server-only) |
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | ✅ | PayOS merchant |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical URL (callback base) |
| `CRON_SECRET` | ✅ | Bearer token cho cron |
| `ENABLE_MOCK_PAYMENTS` | dev | `1` = bypass PayOS (dev/preview only) |
| `TRUSTED_PROXY_IPS` | tùy chọn | Danh sách proxy tin cậy (nginx/Cloudflare) cho rate-limit |

> Lưu ý deploy: set `TRUSTED_PROXY_IPS` nếu đứng sau proxy, nếu không rate-limit sẽ gắn theo IP proxy.

---

## Tài liệu tham khảo

- [docs/security/SECURITY_AUDIT.md](./docs/security/SECURITY_AUDIT.md) — audit OWASP Top 10 + changelog fix (tài liệu kiến trúc chi tiết & lab pentest là nội bộ, không public)

---

## Known Limitations

| Area | Vấn đề | Mức độ |
|------|--------|--------|
| Notifications | `dispatchNotificationBatch` là stub — chưa gửi push/email thực | High |
| Rate limit | In-memory bucket — không chạy multi-instance (cần Redis/edge KV) | Medium |
| CSP | `script-src 'unsafe-inline'` cho Next.js bootstrap (cần nonce khi chuyển sang middleware) | Medium |
| Test coverage | Chưa phủ integration cho toàn bộ routes | Medium |
| Linting | Chưa có ESLint/Prettier | Medium |
| Webhook signature | So sánh non-constant-time (timing attack lý thuyết) | Medium |

*Trạng thái bảo mật chi tiết: [SECURITY_AUDIT.md](./docs/security/SECURITY_AUDIT.md) — đã fix 2 Critical (rate-limit spoof, premium gating client-side), backlog gồm enumeration, CORS dev, PostgREST filter injection.*
