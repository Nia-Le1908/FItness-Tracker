# Ke hoach trien khai

- [x] 1. Xay dung nen tang validation bao mat
- [x] 1.1 Tao repository va Docker-context secret scanner
  - Liet ke tracked va non-ignored untracked candidates bang Git, tu dong bo qua ignored runtime environment files.
  - Scan service-role-shaped JWT/key tren toan tap candidate; fixture chi ghep pattern tu fragment de khong tu kich hoat scanner.
  - Hoan tat khi scanner phat hien `setup_docker.txt` hien tai trong RED phase va co lenh task-local lap lai duoc.
  - _Requirements: 1.1, 1.2, 1.4, 4.1_
  - _Boundary: Security Validation_

- [x] 1.2 Tao empty PostgreSQL bootstrap execution harness
  - Tao Supabase auth stub toi thieu cho roles, `auth.users` va `auth.uid()`.
  - Khoi dong PostgreSQL 16 container tam, apply auth stub/schema/policies voi stop-on-error va query catalog RLS/policies.
  - Cleanup container trong moi duong thanh cong/that bai; tra manual-verification status neu Docker/image khong san sang.
  - Hoan tat khi harness tai lap duoc bootstrap failure hien tai tren database rong va in ra loi table/order cu the.
  - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.3_
  - _Boundary: Bootstrap Validation_

- [x] 2. Trien khai cac remediation Critical
- [x] 2.1 Bao ve service-role credential khoi repository va Docker context
  - Redact setup guide va cap nhat Git/Docker ignore ma khong xoa runtime environment contract.
  - Chay repository secret scanner va test ignore invariants.
  - Hoan tat khi scanner khong con thay literal credential trong tracked/non-ignored candidates va `.env*` khong vao Docker context.
  - _Depends: 1.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1_
  - _Boundary: Secret Containment_

- [x] 2.2 Chan support va moderator thay doi user role
  - Viet test that bai cho single va bulk role mutation boi lower staff, role input khong hop le, va goal-only update.
  - Them full-admin capability guard va chi cap service-role client sau capability check.
  - Sua partial update de chi ghi truong duoc yeu cau.
  - Hoan tat khi support/moderator nhan 403, admin mutation hop le pass, va goal-only update khong cham role.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1_
  - _Boundary: Privileged Authorization_

- [x] 2.3 Khoi phuc canonical Supabase bootstrap va RLS coverage
  - Khoi phuc cac table definition bi cat va tich hop table hien duoc ung dung su dung vao canonical schema.
  - Cap nhat canonical policies de moi public application table co RLS va `user_goals` co owner-scoped CRUD.
  - Chay static checks va empty-database execution harness.
  - Hoan tat khi schema/policies apply thanh cong tren database rong va catalog bao cao khong co table/RLS/policy drift.
  - _Depends: 1.2_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_
  - _Boundary: Supabase Bootstrap_

- [x] 3. Tich hop va xac minh toan bo remediation
  - Review diff cua ba boundary, quet secret/placeholder va kiem tra khong lan sang PayOS, Premium, telemetry hoac rate limiting.
  - Chay full test suite, typecheck va production build tren current worktree.
  - Hoan tat khi review tra APPROVED va bao cao tach ro local fixes voi manual key rotation/live database follow-up.
  - _Depends: 2.1, 2.2, 2.3_
  - _Requirements: 4.1, 4.2, 4.3_

## Implementation Notes

- Remote Supabase key rotation va live database application la manual follow-up, khong duoc danh dau hoan tat boi local tests.
