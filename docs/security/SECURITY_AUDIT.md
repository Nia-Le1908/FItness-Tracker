# FitBudget — Báo cáo Quét Bảo mật

> Ngày quét: 2026-07-28
> Phạm vi: mã nguồn (Next.js 15 App Router + Supabase), Dockerfile, docker-compose, middleware, 31 API routes, 25 RLS policies, PayOS integration.
> Phương pháp: static review theo OWASP Top 10 (2021) + ASVS profile cơ bản.

## 1. Stack & bề mặt tấn công

| Lớp | Công nghệ | Bề mặt tấn công chính |
|-----|-----------|----------------------|
| Frontend | Next.js 15 (App Router, RSC), React 19, Turbopack | XSS qua `dangerouslySetInnerHTML`, CSP bypass, SSRF qua `connect-src` |
| API | 31 endpoints `/api/*` (Edge/Node) | IDOR, broken auth, rate-limit bypass, input validation |
| Auth | Supabase Auth (JWT Bearer, PKCE) | Token theft, refresh-token replay, role escalation |
| DB | Postgres qua Supabase PostgREST | RLS bypass, column-level escalation, SQL injection (qua `.rpc()`) |
| Payments | PayOS (HMAC-SHA256) | Webhook replay, signature forgery, IDOR checkout |
| Infra | Docker multi-stage, non-root user 1001 | Container escape, secret leak trong image, port exposure |

**Bề mặt tấn công công khai** (không yêu cầu auth):
- `GET /api/workout-templates`, `POST /api/workout`, `POST /api/meal`, `POST /api/macro` — public calculator
- `POST /api/observability/events` — telemetry ingest (anon cho phép)
- `POST /api/billing/webhook` — PayOS webhook
- `POST /api/notifications/cron` — cron bearer
- `/.well-known/security.txt`, `/robots.txt`

## 2. Đánh giá theo OWASP Top 10

### A01 — Broken Access Control ✅ Tốt, vài điểm cần lưu ý
- **User-scoped**: Tất cả service functions filter `.eq("user_id", userId)`; RLS policies 25 cái kín. ✅
- **Admin routes**: `requireAdmin`/`requireFullAdmin` verify role từ DB trước khi cấp service-role client. ✅
- **IDOR checkout**: `parseCheckoutBody` **bỏ qua** `body.userId`, resolve từ Bearer token. ✅
- **⚠️ Vấn đề**: `app/api/workout-plans/route.ts:14` — `planId` được lấy từ query param và truyền vào `fetchWorkoutPlanVersions`. RLS sẽ chặn nhưng nếu RLS bị tắt (debug), sẽ leak dữ liệu user khác.
- **⚠️ Vấn đề**: `app/api/admin/users/[id]/route.ts:36` — PATCH admin route **xác thực trước, parse body sau**. Body được parse tìm `hasRoleField` để chọn guard. Pattern này an toàn nhưng phức tạp; rủi ro nếu refactor sai.
- **⚠️ Vấn đề**: `app/api/admin/bulk-actions/route.ts:15-20` — userIds/notificationIds bị cắt bằng `slice(0, MAX_BULK_IDS)` nhưng **không validate UUID format**. Có thể gửi ID tùy ý; service-role sẽ update (RLS bị bypass). ID không tồn tại → no-op, nhưng cần hardening.

**Khuyến nghị**:
- Validate `id`/`planId` là UUID trước khi query (anti injection qua query parameter).
- Thêm test explicit cho admin route: user `support` role không được PATCH role.

### A02 — Cryptographic Failures 🟡 Trung bình
- **PayOS webhook**: `verifyPayOSWebhookSignature` so sánh `signature === expected` — **non-constant-time**, có thể bị timing attack (lý thuyết, khó khai thác qua mạng). ✅ Có `getPayOSWebhookSignatureCandidates` cho dual format nhưng cả hai cũng non-constant-time.
- **CRON_SECRET**: `isAuthorizedCron` so sánh `auth === \`Bearer ${expected}\`` — cũng non-constant-time.
- **Service role key**: Lưu trong env, được dùng trong `createSupabaseServerClient`. CHÚ Ý: `supabaseUrl` fallback `""` nếu thiếu env → client vẫn tạo được nhưng request fail. ✅
- **JWT**: Supabase Auth xử lý, không tự verify trong app. ✅

**Khuyến nghị**:
- Dùng `crypto.timingSafeEqual` cho signature comparison:
  ```ts
  import { timingSafeEqual } from "crypto";
  const a = Buffer.from(signature ?? "", "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
  ```
- Rotate `SUPABASE_SERVICE_ROLE_KEY` ngay sau deploy (note trong ARCHITECTURE §9).

### A03 — Injection ✅ Tốt
- **SQL**: 100% dùng Supabase query builder, không raw SQL, không `.rpc()`. ✅
- **NoSQL**: Không dùng.
- **Command**: Docker không shell exec, không `child_process`. ✅
- **_MAIL/HEADER injection**: Email từ `body.buyerEmail` truyền cho PayOS API — không gửi mail trực tiếp. ✅
- **⚠️ Vấn đề**: `app/api/admin/users/route.ts:27` — `query.or(\`full_name.ilike.%${q}%,email.ilike.%${q}%\`)`. `q` được chèn vào string PostgREST filter. Supabase SDK escape giá trị, nhưng cần verify. Test: `q = "a%;--"` → xem có break parse không. (Supabase v2 escape bằng single quotes, an toàn.)

**Khuyến nghị**: Thêm fuzz test cho `q`: แทร `%`, `'`, `"`, `;`, `--`, `\`, `\\`.

### A04 — Insecure Design 🟡 Trung bình
- **Mock payments**: `isMockAllowed = NODE_ENV !== "production" && ENABLE_MOCK_PAYMENTS === "1"` — chính xác. ✅ Production không mint premium tự do. ✅
- **Rate limit in-memory**: `bucket = new Map()` trong middleware → **không chạy được multi-instance** (Vercel auto-scale, K8s). Mỗi instance có bucket riêng → attacker gửi tới instance khác = reset limit. (Note trong ARCHITECTURE §9).
- **Observability POST**: Không auth, không rate-limit per-IP nghiêm ngặt (default 120/min). Có thể flood `observability_events` table → DoS DB. (Note trong ARCHITECTURE §9).
- **Audit log**: `audit_events` không RLS policy, chỉ service-role truy cập. ✅ Nhưng admin route `/api/admin/audit-logs` đọc cross-user qua service-role → OK vì đã `requireAdmin`.

**Khuyến nghị**:
- Migrate rate-limit sang Redis (Upstash) hoặc edge KV.
- Giảm rate-limit cho `/api/observability/events` xuống 30/min + payload signature (HMAC với key public client) để giảm spam.

### A05 — Security Misconfiguration 🟡 Trung bình
- **CSP**: `script-src 'self' 'unsafe-inline'` — **'unsafe-inline' cho Next.js bootstrap**. Comment trong code nói sẽ thay bằng nonce khi CSP move to middleware. 🟡 Hiện tại cho phép XSS nếu có injection vector.
- **CORS**: `buildCorsHeaders` reflect origin. Nếu `CORS_ALLOWED_ORIGINS` không set và `NODE_ENV=development` → reflect bất kỳ origin. Trong production, nếu `CORS_ALLOWED_ORIGINS` rỗng và `NODE_ENV=production` → **không set CORS headers** → chặn cross-origin. ✅
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` ✅ clickjacking protected.
- **HSTS**: `max-age=63072000; includeSubDomains; preload` ✅.
- **Docker**: Chạy non-root user `nextjs (1001)`. ✅ Không có HEALTHCHECK trong Dockerfile (note trong deployment-patterns skill).
- **⚠️ Vấn đề**: `next.config.mjs` CSP `connect-src 'self' ${supabaseUrl} https://api-merchant.payos.vn`. Nếu `NEXT_PUBLIC_SUPABASE_URL` không set → fallback `https://*.supabase.co` (wildcard) → mở rộng attack surface (bất kỳ project Supabase nào).

**Khuyến nghị**:
- Bật CSP nonce trong middleware (Next.js 15 hỗ trợ `headers().get('x-nonce')`).
- Require `NEXT_PUBLIC_SUPABASE_URL` ở build time, không fallback wildcard.
- Thêm `HEALTHCHECK` vào Dockerfile (đã có trong deployment-patterns skill).

### A06 — Vulnerable & Outdated Components 🟢 Cần kiểm tra định kỳ
- `next: ^15.3.0` — recent.
- `react: ^19.0.0` — recent.
- Không có ESLint/Prettier (note trong ARCHITECTURE §9) → không có `npm audit` trong CI.
- `ecc-universal: ^2.0.0` — third-party, cần audit.

**Khuyến nghị**:
- Thêm `npm audit --production` vào CI.
- Pin dependency versions (lock file đã commit).

### A07 — Identification & Authentication Failures 🟡 Trung bình
- **Supabase Auth**: PKCE, httpOnly cookies (Supabase SSR). ✅
- **No lockout**: Rate-limit auth = 10/min per-IP — không có account lockout sau N thất bại. Brute force vẫn bị rate-limit nhưng không khóa account.
- **JWT expiry**: Supabase default 1h access + refresh rotation. ✅
- **⚠️ Vấn đề**: `requireAuth` trong `lib/api/auth-guard.ts:25-27` `upsert` user row trên mỗi request. Race condition: 2 request concurrent → 2 upsert. Postgres `ON CONFLICT` handle được nhưng có thể throw tạm thời.

**Khuyến nghị**: Thêm account lockout sau 5 thất bại (Supabase Auth có `LOCKED` state).

### A08 — Software & Data Integrity Failures ✅ Tốt
- **Webhook idempotent**: Terminal-state check + unique constraint `(provider, order_code)`. ✅
- **Subresource integrity**: Next.js auto-adds SRI cho scripts. ✅
- **Dependency integrity**: `npm ci` dùng lockfile. ✅
- **⚠️ Vấn đề**: `getPayOSWebhookSignatureCandidates` chấp nhận **2 signature candidates** (raw body + canonical form) — giảm security: nếu 1 trong 2.verify, webhook accept. Vulnerability surface gấp đôi. Comment cần audit.

**Khuyến nghị**: PayOS docs chỉ dùng 1 dạng signature. Xác nhận với PayOS support candidate nào là chính thống, bỏ candidate còn lại.

### A09 — Security Logging & Monitoring Failures ✅ Tốt
- `audit_events` immutable, chỉ service-role write. ✅
- Tất cả admin mutation + webhook đều log. ✅
- Observability ingest có `runtime_error`, `api_error`. ✅
- **⚠️ Vấn đề**: Log ship đến PayOS API (`https://api-merchant.payos.vn`) qua `console.error` ở webhook:67 disclose IP — IP public, không nhạy cảm. ✅
- **⚠️ Vấn đề**: `app/api/billing/webhook/route.ts:67` return `jsonSuccess({ received: false, verified: false })` với status 200 → **trả 200 dù verify fail**. Đây là **anti-pattern**: PayOS sẽ hiểu 200 = success và không retry. Tốt cho anti-replay nhưng tấn công có thể spam để dò signature. Rate-limit `webhook: 120/min` đủ chặn.

**Khuyến nghị**: Return 401 thay vì 200 khi `verified: false` (nhưng test xem PayOS có retry轰炸 không).

### A10 — Server-Side Request Forgery (SSRF) ✅ Tốt
- Không có endpoint nào fetch URL từ user input.
- `createPayOSPayment` gọi fixed `https://api-merchant.payos.vn`. ✅
- CSP `connect-src` giới hạn whitelist. ✅

## 3. Tổng kết Severities

| Severity | Số | Mục |
|----------|----|-----|
| 🔴 Critical | 0 | (Sau khi fix các issue từ `critical-security-remediation` spec) |
| 🟠 High | 2 | A02 timing attack (signature), A05 CSP unsafe-inline + supabaseUrl wildcard |
| 🟡 Medium | 5 | A04 rate-limit multi-instance, A04 observability spam, A07 no lockout, A08 dual signature candidates, A05 missing healthcheck |
| 🟢 Low | 4 | A01 UUID validation, A03 PostgREST filter fuzz, A06 dependency audit, A09 webhook 200 on verify fail |

## 4. Bề mặt tấn công trực quan cho Lab

```
                          ┌─────────────────────────────┐
                          │  Attacker (Kali container)   │
                          │  Burp/ZAP/nuclei/sqlmap      │
                          └────────────┬────────────────┘
                                       │ http://target:3000
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  TARGET: FitBudget container (Next.js standalone)               │
│  ├─ /api/public/*        ► IDOR, input validation, fuzz         │
│  ├─ /api/observability   ► No-auth spam, table flooding         │
│  ├─ /api/billing/*      ► Webhook replay, HMAC bypass try       │
│  ├─ /api/admin/*         ► Auth bypass, role escalation         │
│  ├─ /api/workout-logs    ► IDOR (userId từ token, planId URL)   │
│  └─ Middleware           ► Rate-limit bypass (multi-IP)        │
└─────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ service-role (bypass RLS)
┌─────────────────────────────────────────────────────────────────┐
│  Supabase local (Postgres + PostgREST + GoTrue)                 │
│  ├─ RLS policies (25)   ► Try bypass                            │
│  ├─ users.role REVOKE    ► Privilege escalation attempt          │
│  └─ audit_events (no policy) ► Direct access denial             │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Tools đề xuất cho Lab

| Tool | Mục đích | Cài đặt |
|------|---------|---------|
| **Burp Suite Community** | Proxy + Repeater + Intruder | `kali linux` full image |
| **OWASP ZAP** | Automated scan, baseline + full | `apt install zaproxy` |
| **nuclei** | Template-based vuln scan | `go install github.com/projectdiscovery/nuclei` |
| **sqlmap** | SQL injection (qua PostgREST filter) | `apt install sqlmap` |
| **ffuf** | Fuzz endpoint, IDOR ID | `go install github.com/ffuf/ffuf` |
| **jwt_tool** | JWT analysis, alg confusion | `pipx install jwt_tool` |
| **Postman/Newman** | Webhook replay, custom HMAC | `npm i -g newman` |
| **Supabase local CLI** | DB direct, RLS testing | `npm i -g supabase` |

## 6. Tài liệu tham chiếu

- OWASP Top 10 2021: https://owasp.org/Top10/
- OWASP ASVS 4.0: https://owasp.org/www-project-application-security-verification-standard/
- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- PayOS webhook docs: https://payos.vn/docs/
- Next.js CSP: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

## 7. Changelog fix (phát hiện trong scan "có lỗi cơ bản")

| Ngày | Vấn đề | Severity | Fix | Verify |
|------|--------|----------|-----|--------|
| 2026-08-05 | Rate-limit bypass qua header spoof `X-Forwarded-For`/`X-Real-IP` (`middleware.ts` tin header client tự đặt → attacker tự tạo bucket mới) | 🔴 Critical | `resolveClientIp(request, trustedProxies)`: mặc định chỉ tin socket IP (`request.ip`); chỉ duyệt `X-Forwarded-For` từ phải sang trái (bỏ qua hop trusted) và `X-Real-IP` khi kết nối trực tiếp từ proxy trong `TRUSTED_PROXY_IPS` | `__tests__/app/api/middleware/middleware.test.ts` (describe "getClientIp (spoof resistance)") |
| 2026-08-05 | Premium gating 100% client-side: `use-entitlement.ts` đọc `localStorage` (`fitbudget-entitlement`) — user sửa localStorage để đổi tier, server không enforce giới hạn | 🔴 Critical | Server-side guard: `lib/api/premium-guard.ts` (`resolveUserTier` từ `billing_entitlements`, `assertSavedPlanLimit` count qua RLS); wire vào `POST /api/workout-plans`, `/api/meal-plans`, `/api/macro-plans`; client chỉ còn hiển thị, không quyết định quyền | `__tests__/lib/premium-guard.test.ts` |

Còn lại chưa fix (chờ duyệt): A07 user enumeration qua `friendlyAuthMessage`, CORS dev reflect, PostgREST `.or()` filter trong `app/api/admin/users/route.ts`, password policy yếu + không lockout, `orderCode` đoán được, `requireAuth` upsert thừa, HSTS trên HTTP.
