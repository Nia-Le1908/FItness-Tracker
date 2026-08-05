# Tai lieu yeu cau

## Gioi thieu

Feature nay xu ly ba rui ro Critical da duoc xac nhan trong worktree hien tai: thong tin xac thuc Supabase dac quyen nam trong tep cuc bo co the bi commit hoac dua vao Docker build context, tai khoan `support`/`moderator` co the tu nang quyen thanh `admin`, va bo khoi tao database khong day du co the lam RLS khong duoc ap dung tren moi truong moi.

## Pham vi

- **Trong pham vi**: containment secret trong repository/build context, phan quyen thao tac role, khoi tao schema va RLS co the tai lap, va test hoi quy cho ba nhom nay.
- **Ngoai pham vi**: xoay key tren Supabase tu xa, sua luong PayOS, paywall Premium, telemetry, rate limiting va cac phat hien High/Medium khac.
- **Ky vong lien ke**: key moi se duoc cap va cau hinh qua environment runtime sau khi thay doi trong repository hoan tat; database production phai duoc doi chieu rieng voi schema da sua.

## Yeu cau

### Requirement 1: Bao ve thong tin xac thuc dac quyen

**Muc tieu:** La nguoi van hanh, toi muon service-role credential khong nam trong source hoac Docker build context, de tranh bo qua toan bo RLS khi tep bi chia se hoac build.

#### Acceptance Criteria

1. When repository security controls are evaluated, the project shall scan every tracked file and every non-ignored untracked build-context candidate for literal Supabase service-role credentials, excluding only ignored runtime environment files and non-secret fixtures that construct patterns without embedding a credential.
2. When Docker build context is prepared, the project shall exclude all `.env*` files and local setup files that may contain credentials.
3. If a local setup guide is retained, the project shall use environment-variable placeholders instead of credential values.
4. The project shall include an automated regression check that fails when a service-role-shaped secret is reintroduced into the protected setup files.

### Requirement 2: Gioi han thao tac quan ly role

**Muc tieu:** La quan tri vien, toi muon chi full admin co the thay doi role, de tai khoan support hoac moderator khong the tu nang quyen.

#### Acceptance Criteria

1. When a `support` or `moderator` account requests a single-user role change, the Admin API shall reject the request with a forbidden response and shall not write user data.
2. When a `support` or `moderator` account requests a bulk role change, the Admin API shall reject the request with a forbidden response and shall not write user data.
3. When a full `admin` submits a valid role change, the Admin API shall apply only the requested allowed fields.
4. When an authorized staff account updates only a user's goal, the Admin API shall preserve the existing role.
5. If a role value is invalid, the Admin API shall reject the request instead of coercing it to `user`.

### Requirement 3: Khoi tao database va RLS co the tai lap

**Muc tieu:** La nguoi van hanh, toi muon bootstrap database tao day du bang truoc khi ap dung policy, de moi moi truong moi khong bi bo sot RLS.

#### Acceptance Criteria

1. When the canonical schema and policies are applied to an empty PostgreSQL database with Supabase-compatible auth prerequisites, the Database Bootstrap shall complete with stop-on-error behavior and shall define every public table referenced by the canonical RLS policy file.
2. When the executable bootstrap verification completes, the Database Bootstrap shall confirm from the database catalog that RLS is enabled for every public application table defined by the canonical schema.
3. When `user_goals` is created, the Database Bootstrap shall include owner-scoped select, insert, update and delete policies in the canonical policy file.
4. If SQL syntax, dependency ordering, schema coverage, policy application or RLS catalog state drifts, the project shall fail an automated bootstrap-security validation.
5. The canonical schema shall not contain placeholder omissions such as abbreviated table definitions.

### Requirement 4: Xac minh hoi quy

**Muc tieu:** La maintainer, toi muon bang chung moi cho tung ban va toan bo du an, de khong tuyen bo sua xong khi van con loi bao mat hoac hoi quy.

#### Acceptance Criteria

1. When each remediation is completed, the project shall pass its task-local security tests.
2. When all remediations are integrated, the project shall pass the full test suite, typecheck and production build.
3. If external key rotation or live database verification cannot be performed locally, the completion report shall identify those steps as manual follow-up instead of claiming they are complete.
