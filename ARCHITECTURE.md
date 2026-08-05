# FitBudget — Kiến Trúc Hệ Thống Chi Tiết

> Tài liệu kỹ thuật toàn diện cho dự án **FitBudget** — Ứng dụng theo dõi dinh dưỡng & tiến độ fitness tiết kiệm ngân sách.
> Phiên bản: 1.0 | Cập nhật: 2025-07-20

---

## 1. Tổng Quan Kiến Trúc (High-Level)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Pages     │  │  Components │  │    Hooks    │  │   Lib/Utils         │ │
│  │ (App Router)│──▶│  (UI Kit)   │──▶│  (State)    │──▶│  api/client, i18n,  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  │  theme, strings     │ │
│         │                │                │          └─────────────────────┘ │
│         ▼                ▼                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 15 APP ROUTER (RSC + Client)                  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (Bearer Token)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS API ROUTES (Edge/Node)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │   /api/*     │ │  /api/admin* │ │ /api/billing*│ │ /api/observability*│  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────┘  │
│         │                │                │                    │              │
│         ▼                ▼                ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                     MIDDLEWARE (Rate Limit, CORS, Security)             │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌─────────────────────┐           ┌─────────────────────┐
         │   SUPABASE POSTGRES │           │     EXTERNAL APIs   │
         │  (RLS Enabled)      │           │  • PayOS (Payment)  │
         │  • RLS Policies     │           │  • Supabase Auth    │
         │  • Audit Triggers   │           │  • VNPay/MoMo/Zalo  │
         └─────────────────────┘           └─────────────────────┘
```

---

## 2. Cấu Trúc Thư Mục (Source Tree)

```
Gym_project/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (31 endpoints)
│   │   ├── admin/                # 9 admin endpoints (role-guarded)
│   │   ├── billing/              # 6 billing endpoints (checkout, webhook, entitlement)
│   │   ├── workout-*             # 7 workout endpoints
│   │   ├── meal*                 # 3 nutrition endpoints
│   │   ├── macro*                # 2 macro endpoints
│   │   ├── progress              # 1 progress endpoint
│   │   ├── notifications*        # 3 notification endpoints
│   │   ├── goal-reminders        # 1 reminder endpoint
│   │   ├── analytics             # 1 analytics endpoint
│   │   ├── settings/goal         # 1 settings endpoint
│   │   ├── observability/events  # 1 telemetry endpoint
│   │   └── workout-templates     # 1 public template endpoint
│   ├── (pages)/                  # Page routes (dashboard, workout, meal, macro, billing, profile, settings, admin)
│   ├── layout.tsx                # Root layout + theme init script
│   ├── globals.css               # Tailwind + CSS variables
│   └── page.tsx                  # Landing page
├── components/                   # 30+ React Components
│   ├── ui/                       # Base UI (Button, etc.)
│   ├── workout/                  # Workout-specific (9 components)
│   ├── macro-calculator-panel/   # Macro calculator (4 components)
│   ├── admin-dashboard.tsx       # Admin UI
│   ├── auth-form.tsx             # Login/Register form
│   └── ...                       # Other feature components
├── hooks/                        # 4 Custom Hooks
│   ├── use-workout-session.ts    # Session timer + API
│   ├── use-workout-plan.ts       # Plan state management
│   ├── use-user-profile.ts       # Profile data fetching
│   └── use-chart-theme.ts        # Recharts theme sync
├── lib/                          # Core Libraries (12 modules)
│   ├── api/                      # API utilities (client, validation, errors, http)
│   ├── supabase/                 # 5 Supabase client factories
│   ├── payments/                 # PayOS integration + audit
│   ├── observability.ts          # Telemetry normalization
│   ├── premium.ts                # Feature flags & tiers
│   ├── billing.ts                # Entitlement types & normalization
│   ├── strings.ts                # i18n dictionaries (vi/en)
│   ├── theme.ts                  # Theme definitions (6 themes)
│   ├── i18n.tsx                  # Language context provider
│   ├── ui-feedback.tsx           # Toast/notice system
│   ├── constants.ts              # App-wide defaults
│   └── admin.ts                  # Role helpers
├── services/                     # 13 Business Logic Modules (Pure TS)
│   ├── workout*.ts               # 5 workout services
│   ├── meal*.ts                  # 2 meal services
│   ├── macro*.ts                 # 2 macro services
│   ├── progress*.ts              # 2 progress services
│   ├── notifications.ts          # Notification dispatch (stub)
│   ├── analytics.ts              # Pure analytics computations
│   └── workout-templates.ts      # Template fetching
├── supabase/                     # Database Migrations (9 SQL files)
│   ├── schema.sql                # Core tables (users, goals, reminders, notifications, observability, audit)
│   ├── policies.sql              # 25 RLS policies
│   ├── 20260507_billing_tables.sql
│   ├── 20260706_security_lockdown.sql
│   ├── 20260707_workout_plan_templates.sql
│   ├── 20260711_workout_sets_delete.sql
│   ├── 20260712_workout_sessions.sql
│   ├── 20260713_user_body_profile.sql
│   └── 20260720_user_goals_rls.sql
├── hooks/                        # Custom React Hooks
├── types/                        # TypeScript Definitions
├── middleware.ts                 # Rate limit + CORS + security.txt
├── next.config.mjs               # Next.js config + CSP headers
├── package.json                  # Dependencies
└── ARCHITECTURE.md               # This file
```

---

## 3. Module Chi Tiết (Module Deep-Dive)

### 3.1 API Layer (`lib/api/`)

| File | Chức Năng | Export Chính |
|------|-----------|--------------|
| `client.ts` | Fetch wrapper cho client-side | `fetchJson`, `authedJsonFetch` (tự động attach Bearer token từ Supabase session) |
| `validation.ts` | Input validation & sanitization | `requireString`, `requireNumber`, `clampString`, `isAllowedValue`, `assertRequestBody`, `STRING_LIMITS` (max length per field) |
| `route-errors.ts` | Error handling tập trung | `handleApiError` (5xx → generic message), `UnauthorizedError`, `ForbiddenError`, `isUnauthorizedError`, `isForbiddenError` |
| `http.ts` | Response helpers | `jsonSuccess`, `jsonError`, `ApiErrorCode` enum |
| `auth-guard.ts` | Auth middleware cho API routes | `requireAuth(request)` → `{ supabase, userId }` (anon client + bearer token) |
| `admin-guard.ts` | Admin authorization | `requireAdmin(request)` → `{ supabase (service-role), userId, role }` |
| `feedback.ts` | Toast/notice API | `pushNotice`, `setBanner` |

**Pattern**: Tất cả API routes đều dùng `requireAuth`/`requireAdmin` → trả về `supabase` client đã scoped đúng (anon + token hoặc service-role) + `userId`.

---

### 3.2 Supabase Client Factories (`lib/supabase/`)

| File | Key | Dùng Cho |
|------|-----|----------|
| `anon-client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public reads (workout templates) — không auth |
| `route-client.ts` | `ANON_KEY` + `Authorization: Bearer <token>` | User-scoped API routes (RLS áp dụng `auth.uid() = user_id`) |
| `server.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Webhooks, billing writes, admin cross-user, cron — **bypass RLS** |
| `auth-client.ts` | Browser singleton | Client-side auth (signIn, signUp, session) |
| `client.ts` | Browser generic | Generic browser reads (không persist session) |

**Quy tắc**: Không bao giờ dùng `server.ts` (service-role) ở client-side hoặc API route user-scoped.

---

### 3.3 Service Layer (`services/`) — Pure Business Logic

Tất cả service functions nhận `supabase: SupabaseClient` làm tham số đầu tiên → **Dependency Injection**, dễ test, không singleton.

| Module | Functions | Ownership Check |
|--------|-----------|-----------------|
| `workout-sessions.ts` | `startWorkoutSession`, `finishWorkoutSession`, `fetchWorkoutSession`, `fetchRecentSessions` | Tất cả `.eq("user_id", userId)` |
| `workout-plans.ts` | `createWorkoutPlan`, `ensureWorkoutPlanOwnership`, `createWorkoutPlanVersion`, `fetchWorkoutPlanVersions`, `fetchLatestWorkoutPlanVersion` | `ensureWorkoutPlanOwnership` verify `user_id` trước mọi mutation |
| `workout-logs.ts` | `fetchWorkoutSetLogs`, `createWorkoutSetLog`, `updateWorkoutSetLog`, `deleteWorkoutSetLog` | Mọi query có `.eq("user_id", userId)` |
| `workout-templates.ts` | `fetchWorkoutTemplates`, `fetchWorkoutTemplateByKey` | **Public** — chỉ filter `is_active = true`, không user_id |
| `workout.service.ts` | `buildWorkoutPlan` (algorithm) | Pure logic, no DB |
| `meal-plans.ts` | `createMealPlan`, `ensureMealPlanOwnership`, `createMealPlanVersion`, `fetchMealPlanVersions`, `fetchLatestMealPlanVersion` | Pattern y hệt workout-plans |
| `meal-planner.ts` | `buildBudgetMealPlan` (knapsack algorithm) | Pure logic |
| `macro-plans.ts` | `createMacroPlan`, `ensureMacroPlanOwnership`, `createMacroPlanVersion`, `fetchMacroPlanVersions`, `fetchLatestMacroPlanVersion` | Pattern y hệt |
| `macro-calculator.ts` | `calculateMacroTargets` (Mifflin-St Jeor) | Pure math |
| `progress.ts` | `fetchProgressEntries`, `createProgressEntry` | User-scoped |
| `progress-tracker.ts` | `summarizeProgress` (moving average, trend) | Pure logic |
| `analytics.ts` | `buildMovingAverage`, `buildAnalyticsSnapshot` | Pure computations |
| `notifications.ts` | `dispatchNotificationBatch` (stub), `buildGoalReminderTemplate`, `shouldEscalateReminder`, `computeNextSendAt` | **Stub** — cần tích hợp push/email thực |

**Quy tắc thiết kế**:
- Không service nào tự tạo Supabase client — luôn inject từ caller (API route)
- Ownership check tập trung trong `ensure*Ownership` functions
- SELECT luôn có `.eq("user_id", userId)` trừ public templates
- Không raw SQL, không `.rpc()` — 100% query builder

---

### 3.3 Components Architecture

```
components/
├── ui/                          # Base primitives
│   └── button.tsx
├── workout/                     # 9 workout-specific components
│   ├── day-detail.tsx           # Chi tiết 1 ngày tập
│   ├── day-list.tsx             # Danh sách ngày trong plan
│   ├── exercise-progress-chart.tsx  # Recharts progress
│   ├── planner-form.tsx         # Form tạo plan
│   ├── plan-toolbar.tsx         # Toolbar actions
│   ├── rest-timer.tsx           # Đồng hồ nghỉ giữa set
│   ├── session-bar.tsx          # Thanh session active
│   ├── set-logger.tsx           # Log set (reps/weight)
│   └── template-gallery.tsx     # Browse templates
├── macro-calculator-panel/      # 4 components (form, result, plan, hook)
├── admin-dashboard.tsx          # Admin UI (users, bulk actions, observability)
├── auth-form.tsx                # Login/Register (Supabase Auth)
├── analytics-dashboard.tsx      # User analytics charts
├── progress-tracker.tsx         # Weight tracking UI
├── meal-planner-panel.tsx       # Meal planner UI
├── workout-planner-panel.tsx    # Workout planner UI
├── premium-paywall.tsx          # Upgrade prompt
├── observability-provider.tsx   # Client-side telemetry sender
├── settings-dashboard.tsx       # User settings
├── site-nav.tsx                 # Navigation
├── bottom-nav.tsx               # Mobile bottom nav
├── language-toggle.tsx          # i18n switcher
├── theme-toggle.tsx             # Theme switcher (6 themes)
└── icons.tsx                    # SVG icons
```

**State Management**: React `useState`/`useReducer` + custom hooks (`useWorkoutSession`, `useWorkoutPlan`, `useUserProfile`). Không dùng Redux/Zustand — state local đủ cho phạm vi app.

---

### 3.4 Hooks (`hooks/`)

| Hook | Chức Năng | Dependencies |
|------|-----------|--------------|
| `use-workout-session.ts` | Timer, start/finish session API | `authedJsonFetch` |
| `use-workout-plan.ts` | Plan CRUD, versioning, UI state | `authedJsonFetch` |
| `use-user-profile.ts` | Fetch profile (height, goal, budget, body stats) | `useSupabaseSession` |
| `use-chart-theme.ts` | Sync Recharts theme với CSS variables | `useTheme` context |

---

### 3.5 Payments (`lib/payments/`)

| File | Chức Năng |
|------|-----------|
| `payos.ts` | HMAC-SHA256 signature, create payment, webhook verification (dual candidate signatures), status normalization |
| `payment-audit.ts` | `createPaymentAttempt` (billing_audit), `createAuditEvent` (immutable audit_events) |

**PayOS Flow**:
1. Client POST `/api/billing/checkout` → server tạo `payment_attempts` row (status=created)
2. Server gọi PayOS API → nhận `checkoutUrl` → update `payment_attempts` (status=pending, checkout_url)
3. User redirect đến PayOS → thanh toán → PayOS POST webhook `/api/billing/webhook`
4. Webhook verify HMAC → idempotency check (terminal state) → update `payment_attempts` + `billing_entitlements` + `audit_events`
5. User redirect về `/billing/callback` → client poll `/api/billing/entitlement`

**Mock Mode**: `NODE_ENV !== production && ENABLE_MOCK_PAYMENTS=1` → bypass PayOS, cấp entitlement ngay (chỉ dev/preview).

---

### 3.6 Observability (`lib/observability.ts` + `components/observability-provider.tsx`)

**Client-side** (`ObservabilityProvider`):
- Tự động gửi `page_view` trên route change
- Capture `runtime_error`, `unhandledrejection` → `runtime_error` event
- Navigation timing → `performance` event
- Click tracking (`button`, `a`) → `action` event
- Batch gửi lên `/api/observability/events` (POST, no auth required, anonymous allowed)

**Server-side** (`/api/observability/events`):
- GET: User-scoped query (RLS `auth.uid() = user_id`)
- POST: Anonymous allowed, `user_id` resolved từ Bearer token (nếu có), payload normalized via `normalizeObservabilityInput`

**Admin** (`/api/admin/observability*`, `/api/admin/summary`):
- Service-role query cross-user
- Aggregations: top routes, error rates, slow routes, sessions, daily buckets
- Alert threshold: `errorSpike >= 10` trong 7 ngày

---

### 3.7 Billing & Entitlements (`lib/billing.ts`, `lib/premium.ts`)

| Type | Values |
|------|--------|
| `PlanTier` | `"free" \| "premium" \| "annual"` |
| `EntitlementStatus` | `"active" \| "trialing" \| "past_due" \| "canceled" \| "inactive"` |
| `EntitlementSource` | `"manual" \| "stripe" \| "payos" \| "localStorage" \| "none"` |

**Feature Gates** (`lib/premium.ts`):
```typescript
premiumFeatures = {
  unlimitedPlans: "unlimited-plans",
  exportData: "export-data",
  cloudBackup: "cloud-backup",
  monthlyAnalytics: "monthly-analytics",
  advancedWorkoutPeriodization: "advanced-workout-periodization"
}
```
- `free`: giới hạn 1 saved plan, 5 dashboard entries, 30 ngày progress chart
- `premium`/`annual`: unlimited tất cả

---

## 4. Database Schema (Supabase PostgreSQL)

### 4.1 Bảng Core (schema.sql)

| Table | Mô Tả | RLS | Khóa Chính |
|-------|-------|-----|------------|
| `users` | Profile người dùng (extends `auth.users`) | ✅ `auth.uid() = id` | `id` (FK → `auth.users.id`) |
| `user_goals` | Mục tiêu dài hạn (cut/maintain/bulk) | ✅ `auth.uid() = user_id` | `id` (UUID) |
| `goal_reminders` | Nhắc nhở mục tiêu (weekly/monthly/event) | ✅ `auth.uid() = user_id` | `id` |
| `notification_events` | In-app notifications (queued/sent/read/dismissed) | ✅ `auth.uid() = user_id` | `id` |
| `observability_events` | Telemetry (page_view, action, runtime_error, api_error, performance) | ✅ `auth.uid() = user_id` (nullable cho anon) | `id` |
| `audit_events` | Immutable audit log (admin mutations, webhook processing) | ✅ **NO POLICIES** — chỉ service-role | `id` |

**Indexes**: Trên `user_id + created_at` cho các bảng user-scoped.

---

### 4.2 Bảng Billing (20260507_billing_tables.sql)

| Table | Mô Tả | RLS |
|-------|-------|-----|
| `billing_entitlements` | Trạng thái subscription hiện tại (tier, status, period_end, source) | ✅ `auth.uid() = user_id` (SELECT only) — **NO INSERT/UPDATE/DELETE policies** |
| `payment_attempts` | Lịch sử checkout attempts (provider, plan, order_code, status, amount) | ✅ `auth.uid() = user_id` (SELECT only) — **NO WRITE policies** |

**Unique Constraint**: `uq_payment_attempts_provider_order_code (provider, order_code)` → idempotent webhook.

**Triggers**: `set_updated_at` trên mọi bảng có `updated_at`.

---

### 4.3 Bảng Workout (Migrations)

| Table | Mô Tả | RLS |
|-------|-------|-----|
| `workout_plan_templates` | 6 template công khai (seed data) | ✅ Public read (`is_active = true`) |
| `workout_plans` | User-custom plans (name, split) | ✅ `auth.uid() = user_id` |
| `workout_plan_versions` | Versioning cho plan (plan_json, source) | ✅ `auth.uid() = user_id` |
| `workout_sessions` | Session thực tế (started_at, finished_at, duration, notes) | ✅ `auth.uid() = user_id` |
| `workout_sets` | Set log (exercise, set_number, reps, weight, rpe, session_id FK) | ✅ `auth.uid() = user_id` |

---

### 4.4 Bảng Nutrition (Migrations)

| Table | Mô Tả | RLS |
|-------|-------|-----|
| `macro_plans` | Macro targets user-custom | ✅ `auth.uid() = user_id` |
| `macro_plan_versions` | Versioning macro plan | ✅ `auth.uid() = user_id` |
| `meal_plans` | Meal plan (name, budget, target macros) | ✅ `auth.uid() = user_id` |
| `meal_plan_versions` | Versioning meal plan (snapshot full plan_json) | ✅ `auth.uid() = user_id` |
| `macro_plan_templates` | Template macro (public) | ✅ Public read (`is_active = true`) |
| `meal_plan_templates` | Template meal plan (public) | ✅ Public read (`is_active = true`) |

---

### 4.5 Bảng Progress & Analytics

| Table | Mô Tả |
|-------|-------|
| `progress` | Weight entries (user_id, weight_kg, recorded_at) — RLS `auth.uid() = user_id` |

---

### 4.6 Security Lockdown (20260706_security_lockdown.sql)

- **Column-level GRANT/REVOKE** trên `users.role`:
  - `REVOKE UPDATE ON users FROM anon, authenticated`
  - `GRANT UPDATE (full_name, avatar_url, height_cm, birth_date, sex, goal, daily_budget_vnd, email, updated_at, id) ON users TO authenticated`
  - `GRANT INSERT (id, full_name, email, avatar_url, height_cm, birth_date, sex, goal, daily_budget_vnd) ON users TO authenticated`
- **Trigger `guard_user_role()`**: Block `UPDATE users SET role = ...` từ client (anon/authenticated). Chỉ `service_role` mới được đổi role.
- **Trigger `guard_user_role_insert()`**: Force `role = 'user'` trên INSERT từ client.

→ **Không thể leo thang đặc quyền qua PostgREST**.

---

### 4.7 Audit Events Table (`audit_events`)

```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,
  target_type TEXT NOT NULL,      -- 'user', 'notification_event', 'payment_attempt', ...
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'admin_update_user', 'admin_bulk_update_role', 'webhook_processed', ...
  summary TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
```
- **No RLS policies** — chỉ service-role truy cập được.
- Ghi bởi: `createAuditEvent` (payment audit, admin mutations, webhook processing).

---

## 5. API Endpoints Catalog

### Public / Anonymous
| Method | Path | Mô Tả |
|--------|------|-------|
| GET | `/api/workout-templates` | List 6 templates (filter goal, equipment, level) |
| GET | `/api/workout-templates?key=<key>` | Chi tiết 1 template |
| POST | `/api/macro` | Tính macro targets (public calculator) |
| POST | `/api/meal` | Tạo meal plan ngân sách (public) |
| POST | `/api/workout` | Generate workout plan (public) |
| POST | `/api/observability/events` | Telemetry ingest (anon allowed) |

### User-Authenticated (`requireAuth`)
| Method | Path | Mô Tả |
|--------|------|-------|
| GET | `/api/workout-sessions` | List recent sessions |
| POST | `/api/workout-sessions` | Start session |
| PATCH | `/api/workout-sessions` | Finish session |
| GET | `/api/workout-logs` | List set logs |
| POST | `/api/workout-logs` | Log set |
| PATCH | `/api/workout-logs` | Update set |
| DELETE | `/api/workout-logs` | Delete set |
| GET | `/api/workout-plans` | List plans |
| POST | `/api/workout-plans` | Create plan |
| GET | `/api/workout-plans/:id` | Get plan + versions |
| POST | `/api/workout-plans/:id/versions` | Create version |
| GET | `/api/meal-plans` | List meal plans |
| POST | `/api/meal-plans` | Create meal plan |
| GET | `/api/meal-plans/:id` | Get plan + versions |
| POST | `/api/meal-plans/:id/versions` | Create version |
| GET | `/api/macro-plans` | List macro plans |
| POST | `/api/macro-plans` | Create macro plan |
| GET | `/api/macro-plans/:id` | Get macro plan + versions |
| POST | `/api/macro-plans/:id/versions` | Create version |
| GET | `/api/progress` | List weight entries |
| POST | `/api/progress` | Add weight entry |
| GET | `/api/analytics` | Analytics snapshot (moving avg, trend) |
| GET | `/api/notification-events` | List notifications |
| POST | `/api/notification-events` | Create notification |
| GET | `/api/goal-reminders` | List reminders |
| POST | `/api/goal-reminders` | Create reminder |
| PUT | `/api/settings/goal` | Update goal + reminder channel |
| GET | `/api/billing/entitlement` | Current entitlement (soft-auth) |
| POST | `/api/billing/checkout` | Create PayOS checkout |
| POST | `/api/billing/cancel` | Cancel subscription |
| GET | `/api/billing/history` | Payment history |
| POST | `/api/notifications/dispatch` | Dispatch notification to self |

### Admin-Only (`requireAdmin` → service-role client)
| Method | Path | Mô Tả |
|--------|------|-------|
| GET | `/api/admin/users` | List users (filter q, role, goal, limit≤100) |
| GET | `/api/admin/users/:id` | User detail + reminders + notifications + payments |
| PATCH | `/api/admin/users/:id` | Update role/goal (audit logged) |
| GET | `/api/admin/audit-logs` | Audit logs (filter action, limit≤200) |
| GET | `/api/admin/summary` | Dashboard counts (users, reminders, notifications, payments, errors, pageviews) |
| GET | `/api/admin/observability` | Raw events (filter route, severity, eventType, date range, limit≤1000) |
| GET | `/api/admin/observability/summary` | Aggregated observability (top routes, error rates, slow routes, sessions, daily buckets) |
| POST | `/api/admin/bulk-actions` | Bulk update user roles / notification states (audit logged) |
| POST | `/api/admin/system-controls` | Pause/resume notifications (audit logged) |

### Webhook / Cron
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/billing/webhook` | PayOS HMAC signature |
| POST | `/api/notifications/cron` | `Authorization: Bearer <CRON_SECRET>` |

---

## 6. Security Controls Summary

| Control | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth (JWT Bearer, PKCE, httpOnly cookies) |
| **Authorization** | RLS policies (25 policies) + `requireAuth`/`requireAdmin` guards |
| **Privilege Escalation Prevention** | Column-level REVOKE on `users.role` + PG triggers |
| **IDOR Prevention** | All service functions filter by `user_id`; checkout ignores client `userId` |
| **Webhook Security** | HMAC-SHA256 (PayOS) + idempotency via terminal-state check |
| **Rate Limiting** | Middleware token bucket (per-IP, tiered: auth=10/min, billing=8/min, admin=60/min) |
| **CORS** | Middleware reflect origin, allow credentials |
| **Security Headers** | CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy |
| **Error Sanitization** | 5xx → generic message; 4xx → validation details |
| **Audit Logging** | All admin mutations + webhook processing → `audit_events` (service-role only) |
| **Input Validation** | `assertRequestBody`, `requireString`, `requireNumber`, `clampString` (max length), `isAllowedValue` (whitelist) |
| **Secrets** | `.env.local` (gitignored), `.env.build` (placeholder), production → platform env vars |

---

## 7. Deployment & Operations

### Build & Run
```bash
npm run dev          # Turbopack dev (Next.js 15)
npm run build        # Production build (standalone output)
npm run start        # Run standalone server
npm run typecheck    # tsc --noEmit
npm test             # Jest (8 suites, 18 tests)
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (server-only) |
| `PAYOS_CLIENT_ID` | ✅ | PayOS merchant ID |
| `PAYOS_API_KEY` | ✅ | PayOS API key |
| `PAYOS_CHECKSUM_KEY` | ✅ | PayOS HMAC key |
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical app URL (callback base) |
| `CRON_SECRET` | ✅ | Cron job bearer token |
| `ENABLE_MOCK_PAYMENTS` | Dev only | `1` để bật mock mode |
| `OBSERVABILITY_ERROR_ALERT_THRESHOLD` | Optional | Default 10 |
| `OBSERVABILITY_SLOW_ROUTE_THRESHOLD_MS` | Optional | Default 800 |

### Docker
```dockerfile
# Multi-stage: deps → builder → runner (non-root user 1001)
# Healthcheck: wget /health
# Output: standalone Next.js
```

### Vercel/Standalone
- `output: "standalone"` trong `next.config.mjs`
- API routes tự động deploy as serverless functions
- Middleware chạy ở Edge

---

## 8. Testing Strategy

| Suite | Coverage |
|-------|----------|
| `billing-flow.test.ts` | End-to-end checkout → webhook → entitlement |
| `billing-callback.test.tsx` | Client callback handling |
| `billing-webhook.test.ts` | HMAC verify, idempotency, replay |
| `billing-checkout.test.ts` | Checkout validation, mock mode |
| `macro-calculator.test.ts` | Mifflin-St Jeor math |
| `meal-planner.test.ts` | Budget knapsack algorithm |
| `progress-tracker.test.ts` | Moving average, trend |
| `payos.test.ts` | Signature generation, normalization |

**Gap**: Chưa có integration test cho API routes, auth flow, admin guards. Target: ≥60% coverage.

---

## 9. Known Limitations & Technical Debt

| Area | Issue | Priority |
|------|-------|----------|
| **Notifications** | `dispatchNotificationBatch` là stub — chưa gửi push/email thực | 🔴 High |
| **Rate Limit** | In-memory bucket — không chạy được multi-instance (Vercel, K8s) | 🟡 Medium |
| **Test Coverage** | 13% (18/140 files) — chỉ unit test calculators & billing | 🟡 Medium |
| **Linting** | Chưa có ESLint/Prettier config | 🟡 Medium |
| **Observability POST** | Không rate-limit per-IP — có thể flood `observability_events` | 🟡 Medium |
| **user_goals table** | Có RLS nhưng chưa dùng trong app (dùng `goal_reminders`) | 🟢 Low |
| **Service Role Key** | Cần rotate ngay sau deploy đầu tiên | 🔴 Critical |

---

## 10. Quick Reference — File → Module Map

```
API Routes (app/api/*)
├── admin/*           → admin-guard → service-role
├── billing/*         → requireAuth/manual token → service-role (writes)
├── workout*          → requireAuth → route-client (RLS)
├── meal*             → requireAuth → route-client (RLS)
├── macro*            → requireAuth → route-client (RLS)
├── progress          → requireAuth → route-client (RLS)
├── notifications*    → requireAuth → route-client (RLS)
├── goal-reminders    → requireAuth → route-client (RLS)
├── observability     → soft-auth (GET) / anon (POST) → route-client / service-role
└── workout-templates → anon-client (public RLS)

Services (services/*)
├── workout-*         → user-scoped, ownership checks
├── meal-*            → user-scoped, ownership checks
├── macro-*           → user-scoped, ownership checks
├── progress*         → user-scoped
├── analytics         → pure logic
├── workout-templates → public read
└── notifications     → stub

Lib (lib/*)
├── api/*             → client, validation, errors, guards
├── supabase/*        → 5 client factories
├── payments/*        → PayOS + audit
├── billing/premium   → types + feature gates
├── observability     → normalization
└── i18n/theme/strings/ui-feedback/constants/admin → utilities
```

---

## 11. Migration Checklist (New Feature)

1. **Schema**: Tạo migration SQL (`supabase/YYYYMMDD_feature.sql`) — bật RLS, thêm policies `*_own`
2. **Types**: Cập nhật `types/` nếu cần
3. **Service**: Thêm module trong `services/` — inject `supabase`, filter `user_id`, ownership check
4. **API Route**: Tạo `app/api/feature/route.ts` — dùng `requireAuth`/`requireAdmin`, validation, `handleApiError`
5. **Client**: Thêm hook/component trong `hooks/`/`components/` — dùng `authedJsonFetch`
6. **Tests**: Thêm unit test (logic) + integration test (API)
7. **Audit**: Nếu admin mutation → gọi `createAuditEvent`

---

*Tài liệu này được tự động cập nhật từ codebase. Mọi thay đổi kiến trúc hãy cập nhật file này.*