# Nghien cuu va quyet dinh thiet ke

## Tom tat

- **Feature**: `critical-security-remediation`
- **Loai discovery**: Extension bao mat tren he thong hien huu
- **Phat hien chinh**:
  - `setup_docker.txt` chua JWT `service_role`, khong duoc Git/Docker ignore.
  - `requireAdmin` chap nhan `support`/`moderator` roi tra service-role client cho route co kha nang doi role.
  - `schema.sql` bi cat ngan trong khi `policies.sql` tham chieu nhieu bang khong con duoc dinh nghia.

## Nhat ky nghien cuu

### Secret containment

- **Nguon**: `.gitignore`, `.dockerignore`, `Dockerfile`, `setup_docker.txt`, secret scan va Git history scan.
- **Ket qua**: key chua xuat hien trong Git history hoac `.next/standalone`, nhung co the bi stage va duoc gui vao Docker builder/cache.
- **He qua**: repository fix phai redact tep, chan ca Git lan Docker context, va scan toan bo tracked/non-ignored candidates; rotation tren Supabase nam ngoai quyen cua thay doi local.

### Phan quyen admin

- **Nguon**: `lib/admin.ts`, `lib/api/admin-guard.ts`, single-user va bulk admin routes.
- **Ket qua**: role truy cap dashboard dang bi dung nhu role quan ly dac quyen; endpoint con ghi role mac dinh `user` trong request chi doi goal.
- **He qua**: giu quyen doc/ho tro hien tai, nhung them guard full-admin rieng cho role mutation va chi ghi truong duoc yeu cau.

### Bootstrap Supabase

- **Nguon**: current diff, HEAD `schema.sql`, dated SQL files va `policies.sql`.
- **Ket qua**: schema canonical phai duoc khoi phuc day du; static set checks khong the chung minh SQL thuc thi thanh cong tren database rong.
- **He qua**: them execution harness dung Docker PostgreSQL, Supabase auth stub va `psql` stop-on-error; static checks chi la lop chan nhanh bo sung.

## Danh gia mau kien truc

| Lua chon | Mo ta | Uu diem | Rui ro |
|---|---|---|---|
| Guard theo capability | Tach full-admin mutation khoi quyen truy cap admin chung | Bao toan workflow support, chan escalation | Can test tung mutation route |
| Chi cho admin vao toan bo admin API | Thu hep `requireAdmin` thanh full admin | Don gian | Pha vo workflow support/moderator hien huu |
| Validation schema/RLS bang static test | So khop table va RLS target trong SQL canonical | Nhanh, loi ro | Khong bat duoc syntax/order/runtime failure |
| Empty PostgreSQL execution harness | Apply auth stub, schema va policies voi stop-on-error, sau do query catalog | Chung minh bootstrap executable | Can Docker va PostgreSQL image |

## Quyet dinh thiet ke

### Quyet dinh: Guard role mutation rieng

- **Lua chon**: them full-admin guard va chon guard theo action/body truoc khi tao service-role client.
- **Ly do**: role truy cap support khong dong nghia voi quyen thay doi RBAC.
- **Danh doi**: van can review cac admin mutation High/Medium khac o feature sau.

### Quyet dinh: Schema canonical day du va executable bootstrap gate

- **Lua chon**: khoi phuc cac table definition bi xoa, tich hop cac table hien duoc API su dung, va them Docker PostgreSQL harness de apply auth stub, schema, policies va truy van catalog RLS.
- **Ly do**: sua truc tiep duong bootstrap ma repository dang cong bo, tranh script policy dung giua chung.
- **Danh doi**: live migration history van can doi chieu thu cong voi production.

## Rui ro va giam thieu

- Thay doi schema co the xung dot voi migration incremental: giu DDL idempotent va khong xoa dated SQL files.
- Docker image co the chua san trong moi truong restricted: validation phai bao `MANUAL_VERIFY_REQUIRED` thay vi suy dien thanh cong neu harness khong chay duoc.
- Key cu co the da duoc chia se ngoai repository: yeu cau rotation va purge cache la follow-up bat buoc.
