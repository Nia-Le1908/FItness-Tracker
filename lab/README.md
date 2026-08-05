# FitBudget — Docker Attack Lab

> Lab học tấn công web an toàn, cô lập trong Docker. Dành cho việc học/test kỹ năngpentest trên chính mã nguồn FitBudget.
> **CẢNH BÁO**: Chỉ chạy lab này trên máy local. Không deploy ra Internet. Không tấn công Supabase project production.

## 1. Kiến trúc Lab

```
┌─────────────────────────────────────────────────────────────┐
│  Docker network: fitbudget-lab (bridge, internal: NO)       │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  attacker        │    │  supabase (local)            │  │
│  │  Kali rolling     │    │  ├─ postgres 15              │  │
│  │  Burp, ZAP,       │    │  ├─ go-true (auth :9999)     │  │
│  │  nuclei, sqlmap,  │    │  ├─ postgrest :3001          │  │
│  │  ffuf, jwt_tool   │    │  └─ mailhog  :8025           │  │
│  └────────┬─────────┘    └────────────┬──────────────────┘  │
│           │                           │                     │
│           │ http://target:3000       │ service_role          │
│           ▼                           │ + anon_key            │
│  ┌──────────────────────────────────────┐                  │
│  │  target (fitbudget:standalone)       │                  │
│  │  Next.js 15 — port 3000              │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  mitmproxy (kali:8080) — tùy chọn        │               │
│  │  TLS intercept, request modify           │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘

  Host: http://localhost:3000 (target)
        http://localhost:8080 (proxy, optional)
        http://localhost:8025 (mailhog UI)
        http://localhost:9999 (supabase auth)
```

## 2. Yêu cầu

- Docker 24+ và Docker Compose v2
- RAM tối thiểu 6 GB (Kali image ~3 GB, Supabase stack ~1.5 GB)
- Disk 20 GB
- Hệ điều hành: Windows (WSL2) / macOS / Linux

## 3. Bước 1 — Khởi động target (Supabase local + FitBudget)

### 3.1. Tạo file `.env.local` ở project root

```bash
# Supabase local (sẽ được điền bởi supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# PayOS — dùng giá trị MOCK cho lab
PAYOS_CLIENT_ID=lab_client_id
PAYOS_API_KEY=lab_api_key
PAYOS_CHECKSUM_KEY=lab_checksum_key_32_char_long_here_xxxx
PAYOS_WEBHOOK_URL=http://localhost:3000/api/billing/webhook
PAYOS_RETURN_URL=http://localhost:3000/billing/callback
PAYOS_CANCEL_URL=http://localhost:3000/billing/cancel

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=lab_cron_secret_change_me
ENABLE_MOCK_PAYMENTS=1

# CORS — mở rộng cho lab
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://attacker:8080
```

### 3.2. Tạo `docker-compose.lab.yml`

```yaml
# docker-compose.lab.yml — Lab stack: target + supabase + attacker
name: fitbudget-lab

services:
  supabase-db:
    image: supabase/postgres:15.6.1.143
    container_name: lab-db
    environment:
      POSTGRES_PASSWORD: labpostgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"   # expose để attacker có thể thử direct connect
    volumes:
      - ./supabase/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
      - ./supabase/policies.sql:/docker-entrypoint-initdb.d/02-policies.sql:ro
      - ./supabase/20260706_security_lockdown.sql:/docker-entrypoint-initdb.d/03-lockdown.sql:ro
      - ./supabase/20260507_billing_tables.sql:/docker-entrypoint-initdb.d/04-billing.sql:ro
      - ./supabase/20260707_workout_plan_templates.sql:/docker-entrypoint-initdb.d/05-templates.sql:ro
      - ./supabase/20260712_workout_sessions.sql:/docker-entrypoint-initdb.d/06-sessions.sql:ro
      - ./supabase/20260713_user_body_profile.sql:/docker-entrypoint-initdb.d/07-body.sql:ro
      - ./supabase/20260720_user_goals_rls.sql:/docker-entrypoint-initdb.d/08-goals.sql:ro
      - ./supabase/seed.sql:/docker-entrypoint-initdb.d/09-seed.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  # Auth + PostgREST
  supabase-auth:
    image: supabase/gotrue:v2.158.1
    container_name: lab-auth
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:9999
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:labpostgres@supabase-db:5432/postgres
      GOTRUE_JWT_SECRET: lab-jwt-secret-at-least-32-char-long-xx
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_DISABLE_SIGNUP: "false"
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
      SMTP_ADMIN_EMAIL: admin@fitbudget.local
      SMTP_USER: ""
      SMTP_PASS: ""
      SMTP_ADMIN_NAME: ""
      GOTRUE_MAILER_AUTOCONF: "true"
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_EXTERNAL_PHONE_ENABLED: "false"
    ports:
      - "9999:9999"

  supabase-rest:
    image: postgrest/postgrest:v12.2.0
    container_name: lab-rest
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:labpostgres@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: lab-jwt-secret-at-least-32-char-long-xx
    ports:
      - "3001:3001"  # NOT 3000 to avoid collision with target

  mailhog:
    image: mailhog/mailhog:latest
    container_name: lab-mailhog
    ports:
      - "8025:8025"
      - "1025:1025"

  target:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: http://supabase-rest:3001
        NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWxhYiJ9.lab-anon-key-placeholder
        NEXT_PUBLIC_APP_URL: http://localhost:3000
    container_name: lab-target
    depends_on:
      - supabase-rest
      - supabase-auth
    environment:
      SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoi c2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtbGFiIn0.lab-service-role-placeholder
      PAYOS_CLIENT_ID: lab_client_id
      PAYOS_API_KEY: lab_api_key
      PAYOS_CHECKSUM_KEY: lab_checksum_key_32_char_long_here_xxxx
      CRON_SECRET: lab_cron_secret_change_me
      ENABLE_MOCK_PAYMENTS: "1"
      NODE_ENV: production
      CORS_ALLOWED_ORIGINS: http://localhost:3000,http://attacker:8080
    ports:
      - "3000:3000"
    restart: unless-stopped

  # OPTIONAL: HTTP proxy/MITM
  mitmproxy:
    image: mitmproxy/mitmproxy:11.1.3
    container_name: lab-mitm
    ports:
      - "8080:8080"
      - "8081:8081"
    command: mitmweb --web-host 0.0.0.0 --listen-port 8080
    volumes:
      - ./lab/mitm:/home/mitmproxy/.mitmproxy

  # Attacker workstation
  attacker:
    image: kalilinux/kali-rolling:latest
    container_name: lab-attacker
    depends_on:
      - target
    cap_add:
      - NET_RAW
    # Không mở port ra host — truy cập qua `docker exec`
    stdin_open: true
    tty: true
    working_dir: /root/lab
    volumes:
      - ./lab/attacker:/root/lab
    command: bash -lc "apt-get update && apt-get install -y burpsuite zaproxy sqlmap ffuf nuclei python3-pip httpie curl jq && tail -f /dev/null"

networks:
  default:
    name: fitbudget-lab
    driver: bridge
```

> **Lưu ý JWT**: Trong lab thật, bạn cần tạo JWT hợp lệ cho anon key và service role với cùng `GOTRUE_JWT_SECRET`. Dự kiến thay `lab-anon-key-placeholder` bằng JWT thực.
>
> Cách tạo nhanh (chạy trong container auth):
> ```bash
> echo '{"alg":"HS256","typ":"JWT"}' | base64 | tr -d '=' > /tmp/h
> echo '{"role":"anon","iss":"supabase-lab","exp":9999999999}' | base64 | tr -d '=' > /tmp/p
> printf "%s.%s" $(cat /tmp/h) $(cat /tmp/p) > /tmp/d
> printf "%s" "$(cat /tmp/d)" | openssl dgst -sha256 -hmac "lab-jwt-secret-at-least-32-char-long-xx" -binary | base64 | tr -d '=' > /tmp/s
> cat /tmp/d /tmp/s  # JWT anon
> ```
> Lặp lại với `"role":"service_role"` cho service-role key.

## 4. Bước 2 — Khởi động attacker container

Sau khi `docker compose -f docker-compose.lab.yml up -d` xong, vào Kali:

```bash
docker exec -it lab-attacker bash
```

Trong Kali, setup các tool:

```bash
# ffuf + nuclei (cần Go)
apt-get install -y golang-go
go install github.com/ffuf/ffuf/v2@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
export PATH=$PATH:~/go/bin

# jwt_tool
pip3 install pyjwt cryptography
git clone https://github.com/ticarpi/jwt_tool /opt/jwt_tool

# Verify target reachable
curl -i http://target:3000/api/health 2>/dev/null || curl -i http://target:3000/
```

## 5. Bước 3 — Khởi tạo dữ liệu test

Trong attacker, ký Supabase JWT cho 2 user test:

```bash
# Tạo 2 user qua GoTrue API
http POST :9999/signup email=victim@lab.local password=Victim123!  # user admin/victim
http POST :9999/signup email=pentester@lab.local password=Pentest123!  # attacker
```

Hoặc qua UI: mở http://localhost:3000 → đăng ký 2 tài khoản.

Tạo admin thủ công trong container DB:

```bash
docker exec -it lab-db psql -U postgres -d postgres -c \
  "UPDATE users SET role='admin' WHERE email='pentester@lab.local';"
```

Lưu 2 access token (lấy sau khi đăng nhập qua `/auth/v1/token?grant_type=password`).

## 6. Kế hoạch tấn công theo từng lab module

Mỗi module là 1 folder `./lab/modules/NN-name/README.md`. Tổng 9 module:

| # | Module | Lỗ hổng | Tool | Spec / OWASP |
|---|--------|---------|------|--------------|
| 01 | Recon | Fingerprint, swagger leak | nuclei (tech-detect), curl | recon |
| 02 | Auth bypass | Token theft, alg confusion | jwt_tool, jwt.io | A07 |
| 03 | IDOR user data | `/api/workout-plans?planId=<UUID>` | ffuf wordlist UUID | A01 |
| 04 | RLS bypass | Để service-role leak vào client | Burp Repeater | A01 |
| 05 | Rate-limit bypass | Multi-IP rotate via `X-Forwarded-For` | Burp Intruder, ffuf | A04 |
| 06 | Webhook replay | Re-send old PayOS payload | Postman, curl | A08 |
| 07 | Webhook HMAC forgery | Timing/non-constant-time compare | Custom script Python | A02 |
| 08 | Observability flooding | Spam `POST /api/observability/events` | ffuf, hey | A04 |
| 09 | CSP bypass | Inline script injection (nếu có XSS) | Burp, browser console | A05 |

Tạo 1 module mẫu dưới đây; nhân bạn ra khi làm lab.

## 7. Module mẫu: M03 — IDOR Workout Plans

Tạo file `./lab/modules/03-idor-workout-plans/README.md`:

````markdown
# M03 — IDOR Workout Plans

## Mục tiêu
Kiểm tra liệu user A có đọc được workout plan của user B qua `/api/workout-plans`.

## Setup
1. User A (victim) đăng nhập, tạo 1 workout plan. Lưu `planId` (UUID).
2. User B (attacker) đăng nhập, lấy access token.

## Tấn công

### 1. Recon dùng token B
```bash
TOKEN_B="<access_token_victim?>"
curl -i -H "Authorization: Bearer $TOKEN_B" \
  "http://target:3000/api/workout-plans?planId=<planId_của_A>"
```

### 2. Kế quả kỳ vọng
- ✅ An toàn: HTTP 200 nhưng `versions: []` (RLS chặn).
- ❌ Vulnerable: HTTP 200 + mảng chứa plan của A.

### 3. Fuzz UUID 1.000.000
```bash
ffuf -u "http://target:3000/api/workout-plans?planId=FUZZ" \
  -H "Authorization: Bearer $TOKEN_B" \
  -w /usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt \
  -mc 200 -filter "versions.length > 0"
```
(Better: dùng wordlist UUID từ `seclists/Fuzzing/UUIDs.txt`.)

### 4. Ghi chú lỗ hổng
- Đường mã `app/api/workout-plans/route.ts:26` truyền `planId` thẳng vào query.
- RLS `workout_plan_versions_select_own` chỉ allow `auth.uid() = user_id`.
- Nếu RLS bị DISABLE trong DB thử nghiệm → lộ dữ liệu. Lab luôn bật RLS.
````

## 8. Dọn dẹp lab

```bash
docker compose -f docker-compose.lab.yml down -v --remove-orphans
```

## 9. Defensive checklist (đồng hành)

Sau khi hoàn thành mỗi module, tham chiếu `docs/security/SECURITY_AUDIT.md` mục tương ứng để fix:

| Module | Fix trong mã nguồn |
|--------|-------------------|
| M03 | `app/api/workout-plans/route.ts` — validate planId UUID + check ownership trước query |
| M05 | `middleware.ts` — dùng Redis thay Map; không tin `X-Forwarded-For` trực tiếp |
| M06 | Đảm bảo unique constraint `(provider, order_code)` đã áp dụng (đã có) |
| M07 | `lib/payments/payos.ts` — dùng `timingSafeEqual` cho signature |
| M08 | `/api/observability/events` — captcha / HMAC signature cho client upload |
| M09 | `next.config.mjs` — CSP nonce per request |

## 10. An toàn & Đạo đức

- **KHÔNG** chạy lab kết nối tới Supabase production.
- **KHÔNG** share JWT secret, service-role key ra ngoài máy local.
- **KHÔNG** thử các exploit này trên bất kỳ hệ thống FitBudget khác nếu không được phép.
- Sau mỗi session: `docker compose down -v` để xóa data test.
- Log mọi bước trong `./lab/attacker/run-<date>.log` để học và giải trình sau.

## 11. Tài liệu tham khảo

- OWASP Web Security Testing Guide (WSTG): https://owasp.org/www-project-web-security-testing-guide/
- PortSwigger Web Security Academy: https://portswigger.net/web-security
- Supabase local development: https://supabase.com/docs/guides/cli/local-development
- Kali Docker image: https://www.kali.org/docs/containers/using-kali-docker-images/
