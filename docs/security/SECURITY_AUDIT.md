# FitBudget — Security Audit Report

> Version: 2.0 | Initial scan: 2026-07-28 | Last review: 2026-08-05
>
> **Scope**: Application source code (Next.js 15 App Router + Supabase), middleware, 31 API routes, 25 RLS policies, PayOS payment integration, Dockerfile, docker-compose.
> **Methodology**: Static code review against OWASP Top 10 (2021) and a baseline ASVS 4.0 profile.
> **Verification**: `npm test` (240 tests / 31 suites), `npm run typecheck`, `npm run security:secrets`.

---

## 1. Executive Summary

The application implements a defense-in-depth posture for an early-stage product: row-level security on all user-scoped tables, server-side authorization guards, column-level privilege protection on `users.role`, HMAC-verified webhook processing with idempotency, and a centrally controlled rate limiter.

Two Critical findings from the initial review were remediated and verified on 2026-08-05:

1. **Rate-limit bypass via spoofable client IP headers** — the middleware trusted attacker-controlled `X-Forwarded-For` / `X-Real-IP` headers, letting a client mint new rate-limit buckets at will.
2. **Premium entitlements gated purely client-side** — `localStorage` could be edited to self-grant premium; the server enforced no plan limits.

No Critical or exploitable-in-production High findings remain. Residual High-severity items are hardening tasks (constant-time signature comparison, CSP nonce migration) rather than known exploitable paths.

### Risk summary

| Severity | Open | Fixed | Total |
|----------|------|-------|-------|
| Critical | 0 | 2 | 2 |
| High | 2 | 0 | 2 |
| Medium | 6 | 0 | 6 |
| Low | 8 | 0 | 8 |
| **Total** | **16** | **2** | **18** |

---

## 2. Findings Register

| ID | Area | OWASP | Severity | Status |
|----|------|-------|----------|--------|
| F-01 | Rate-limit IP spoofing (middleware) | A04 | Critical | Fixed |
| F-02 | Premium entitlement client-side gating | A01 | Critical | Fixed |
| F-03 | Webhook/CRON signature comparison not constant-time | A02 | High | Open |
| F-04 | CSP `'unsafe-inline'` + wildcard Supabase fallback | A05 | High | Open |
| F-05 | In-memory rate limit (multi-instance) | A04 | Medium | Open |
| F-06 | Unauthenticated telemetry ingest flood | A04 | Medium | Open |
| F-07 | No account lockout / weak password policy | A07 | Medium | Open |
| F-08 | Dual webhook signature candidates | A08 | Medium | Open |
| F-09 | Missing Docker HEALTHCHECK | A05 | Medium | Open |
| F-10 | UUID validation on admin bulk IDs | A01 | Low | Open |
| F-11 | PostgREST `.or()` filter needs fuzz coverage | A03 | Low | Open |
| F-12 | No dependency audit in CI | A06 | Low | Open |
| F-13 | Webhook returns 200 on verification failure | A09 | Low | Open |
| F-14 | User enumeration via auth error messages | A07 | Medium | Open |
| F-15 | CORS reflects any origin in development | A05 | Low | Open |
| F-16 | Predictable PayOS `orderCode` | A04 | Low | Open |
| F-17 | `requireAuth` upserts user row per request | A07 | Low | Open |
| F-18 | HSTS applied on plain HTTP | A05 | Low | Open |

---

## 3. Detailed Findings (OWASP Top 10)

### 3.1 A01 — Broken Access Control — [F-02 fixed, F-10 open]

- **Passed**: every user-scoped service function filters `.eq("user_id", userId)`; 25 RLS policies cover all user tables.
- **Passed**: `requireAdmin` / `requireFullAdmin` verify the role from the database *before* granting a service-role client.
- **Passed**: checkout ignores `body.userId` entirely — the user is resolved from the Bearer token (anti-IDOR).
- **F-02 [Fixed]**: plan creation limits were enforced only in the browser (`localStorage` entitlement). Server-side guard added: `lib/api/premium-guard.ts` resolves the tier from `billing_entitlements` (via RLS) and enforces `savedPlans = 1` for free tier on `POST /api/workout-plans`, `/api/meal-plans`, `/api/macro-plans`. Covered by `__tests__/lib/premium-guard.test.ts`.
- **F-10 [Open]**: admin bulk actions truncate ID lists via `slice()` but do not validate UUID format. Non-UUID input is a no-op today, but should be rejected explicitly (defense in depth against RLS-bypass scenarios).
- **Observation**: the admin PATCH route authenticates before parsing the body to decide the guard variant — safe, but fragile under refactoring; add a regression test asserting a `support`-role user cannot change roles.

### 3.2 A02 — Cryptographic Failures — [F-03 open]

- **Passed**: JWT handling is delegated entirely to Supabase Auth.
- **F-03 [Open]**: PayOS webhook signature and CRON bearer comparison use direct string equality (non-constant-time). Timing attack over network is theoretical but the fix is trivial:

  ```ts
  import { timingSafeEqual } from "crypto";
  const a = Buffer.from(signature ?? "", "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
  ```

- **Recommendation**: rotate `SUPABASE_SERVICE_ROLE_KEY` after first production deploy.

### 3.3 A03 — Injection — [F-11 open]

- **Passed**: 100% query-builder usage; no raw SQL, no `.rpc()`, no shell execution, no `child_process`.
- **F-11 [Open]**: the admin user-search filter interpolates `q` into a PostgREST `.or()` string (`app/api/admin/users/route.ts`). The SDK escapes values, but add fuzz coverage for `%`, `'`, `"`, `;`, `--`, `\`, `\\`.

### 3.4 A04 — Insecure Design — [F-01 fixed, F-05, F-06, F-16 open]

- **Passed**: mock payments are locked to non-production (`NODE_ENV !== "production" && ENABLE_MOCK_PAYMENTS === "1"`).
- **Passed**: `audit_events` has no RLS policies — service-role only.
- **F-01 [Fixed]**: the middleware previously trusted client-set `X-Forwarded-For` / `X-Real-IP` headers, allowing a client to rotate rate-limit buckets. `resolveClientIp(request, trustedProxies)` now defaults to the socket IP and only parses forwarded headers when the direct connection comes from a proxy listed in `TRUSTED_PROXY_IPS`. Covered by `__tests__/app/api/middleware/middleware.test.ts` (spoof-resistance suite).
- **F-05 [Open]**: rate-limit state is an in-process `Map` — not shared across instances (Vercel auto-scale, K8s). Migrate to Redis / edge KV.
- **F-06 [Open]**: `/api/observability/events` accepts anonymous POSTs at the default limit (120/min). Reduce to ~30/min or add a lightweight payload signature.
- **F-16 [Open]**: PayOS `orderCode` derives from a predictable base. Unique constraint `(provider, order_code)` prevents double-processing; add randomness/entropy to the code itself.

### 3.5 A05 — Security Misconfiguration — [F-04, F-09, F-15, F-18 open]

- **Passed**: `X-Frame-Options: DENY` + `frame-ancestors 'none'` (clickjacking), HSTS preload, strict `Referrer-Policy`, non-root Docker user (1001).
- **F-04 [Open]**: CSP uses `script-src 'self' 'unsafe-inline'` for Next.js hydration bootstrap, and `connect-src` falls back to `https://*.supabase.co` when `NEXT_PUBLIC_SUPABASE_URL` is unset. Migrate to per-request nonces in middleware and fail the build when the Supabase URL env is missing.
- **F-09 [Open]**: Docker image lacks a `HEALTHCHECK` directive.
- **F-15 [Open]**: in development with no `CORS_ALLOWED_ORIGINS`, any origin is reflected. Acceptable for local dev; production requires the env var (behavior verified: empty allow-list + production blocks cross-origin entirely).
- **F-18 [Open]**: HSTS header is emitted even over plain HTTP. Gate it behind `NODE_ENV === "production"`.

### 3.6 A06 — Vulnerable & Outdated Components — [F-12 open]

- `next: ^15.3.0`, `react: ^19.0.0` — current.
- **F-12 [Open]**: no `npm audit` step in CI; add `npm audit --production`. Lockfile is committed (`npm ci` in CI).

### 3.7 A07 — Identification & Authentication Failures — [F-07, F-14, F-17 open]

- **Passed**: Supabase Auth with PKCE and httpOnly cookies; 1h access tokens with refresh rotation.
- **F-07 [Open]**: no account lockout after N failed attempts (auth rate limit is 10/min per IP — slows but does not lock brute force).
- **F-14 [Open]**: login/signup error text distinguishes existing vs. non-existing emails (user enumeration). Use a generic message for both cases.
- **F-17 [Open]**: `requireAuth` upserts a `users` row on every request. The `ON CONFLICT` path is safe, but under concurrency it can surface transient errors; move to insert-on-first-signup only.

### 3.8 A08 — Software & Data Integrity Failures — [F-08 open]

- **Passed**: webhook idempotency via terminal-state check + unique constraint `(provider, order_code)`; SRI auto-added by Next.js; dependency integrity via lockfile.
- **F-08 [Open]**: `getPayOSWebhookSignatureCandidates` accepts two signature candidates (raw body + canonical form) — the webhook verifies if *either* matches. Confirm the canonical form with PayOS and remove the other candidate to halve the verification surface.

### 3.9 A09 — Security Logging & Monitoring Failures — [F-13 open]

- **Passed**: `audit_events` immutable and service-role-only; every admin mutation and webhook processing writes an audit event; telemetry covers `runtime_error` / `api_error`.
- **F-13 [Open]**: webhook returns `200` even when signature verification fails. The current behavior is a deliberate anti-replay choice (no PayOS retry storm), but it lets attackers probe signatures without triggering retries. Decide explicitly: return `401` and accept retries, or keep `200` and document why. Rate limit (120/min webhook bucket) mitigates probing.

### 3.10 A10 — Server-Side Request Forgery — Passed

- No endpoint fetches user-supplied URLs; `createPayOSPayment` targets a fixed host; CSP `connect-src` is whitelist-based.

---

## 4. Security Controls in Place

| Control | Implementation |
|---------|----------------|
| Authentication | Supabase Auth — JWT Bearer, PKCE, httpOnly cookies |
| Authorization | 25 RLS policies + `requireAuth` / `requireAdmin` guards (role re-verified from DB per request) |
| Privilege escalation prevention | Column-level `REVOKE` on `users.role` + PG trigger `guard_user_role` |
| IDOR prevention | User-scoped queries in all services; checkout ignores client-provided userId |
| Premium enforcement | Server-side guard (`lib/api/premium-guard.ts`) with RLS-backed entitlement lookup |
| Webhook security | HMAC-SHA256 signature + terminal-state idempotency + unique constraint |
| Rate limiting | Tiered token bucket in middleware (auth 10/min, billing 8/min, admin 60/min, webhook 120/min) |
| Client IP resolution | Socket IP only; forwarded headers honored solely from `TRUSTED_PROXY_IPS` |
| Error sanitization | 5xx → generic message; centralized `handleApiError` |
| Audit logging | `audit_events` (immutable, service-role-only) on all admin mutations + webhook processing |
| Input validation | `assertRequestBody`, `requireString`, `requireNumber`, `clampString`, `isAllowedValue` (whitelist) |
| Secrets management | `.env.local` gitignored; automated secret scan: `npm run security:secrets` |

---

## 5. Public Attack Surface

Unauthenticated endpoints (starting points for review / pentest):

- `GET /api/workout-templates`, `POST /api/workout`, `POST /api/meal`, `POST /api/macro` — public calculators
- `POST /api/observability/events` — telemetry ingest (anonymous allowed)
- `POST /api/billing/webhook` — PayOS webhook
- `POST /api/notifications/cron` — bearer-protected cron
- `/.well-known/security.txt`, `/robots.txt`

Authenticated surface: workout/meal/macro plan CRUD + versioning, workout sessions & set logs, progress, analytics, notifications, reminders, settings, billing (entitlement/checkout/cancel/history) — all behind RLS. Admin surface: 9 endpoints behind `requireAdmin` with service-role access.

---

## 6. Remediation Roadmap

| Priority | Items | Target |
|----------|-------|--------|
| P0 (next release) | F-03 constant-time compare, F-04 CSP nonce + env fail-fast | Immediate |
| P1 (short term) | F-07 lockout, F-14 enumeration, F-08 single signature candidate, F-06 telemetry limit | 1–2 weeks |
| P2 (medium term) | F-05 Redis rate limit, F-09 HEALTHCHECK, F-10 UUID validation, F-11 fuzz tests, F-17 upsert cleanup | 1–2 months |
| P3 (backlog) | F-12 CI dependency audit, F-13 webhook status semantics, F-15 CORS dev policy, F-16 orderCode entropy, F-18 HSTS gating | Ongoing |

---

## 7. Verification Commands

```bash
npm run typecheck                # TypeScript type gate
npm test                         # 240 tests / 31 suites
npm run security:secrets         # Repository secret scan
npm run security:supabase-bootstrap  # RLS / bootstrap verification
npm run build                    # Production build (standalone)
```

---

## 8. References

- OWASP Top 10 (2021): https://owasp.org/Top10/
- OWASP ASVS 4.0: https://owasp.org/www-project-application-security-verification-standard/
- Supabase Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- PayOS webhook documentation: https://payos.vn/docs/
- Next.js Content Security Policy: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
