# Domain Knowledge — Admin & Observability

> Domain knowledge cho admin dashboard, user management, audit logs, system controls.

## Domain Concepts
- **Admin User**: user có role `admin` trong Supabase auth
- **Admin Action**: bất kỳ thay đổi nào admin thực hiện (ban user, refund, config change)
- **Audit Log**: append-only record của mọi admin action, không bao giờ xóa
- **System Control**: feature flag, config được quản lý qua admin panel
- **Observability Event**: structured log từ app (errors, warnings, businesses events)

## RBAC Roles
```
user  → default, chỉ thấy data của mình
admin → quản lý users, xem analytics, bulk actions, system controls
```
> No `superadmin`, admin co full quyền trong scope admin endpoints.

## Naming Conventions
- Tables: `admin_audit_logs`, `system_controls`, `notification_events`
- Services: `adminGetUsers`, `adminUpdateUser`, `adminBulkAction`
- API routes: `/api/admin/*` (tất cả protected)
- Guard: `lib/api/admin-guard.ts` (verify admin role)

## Business Rules
1. **Admin guard**: mọi route `/admin/*` phải verify `requireAdmin()`
2. **Audit**: mọi admin action ghi log với `actor_id`, `action_type`, `target_id`, `metadata`
3. **Bulk action**: max 50 users/request, paged handling cho batch lớn
4. **Soft delete**: không xóa user, set `banned_until` thay vì delete

## Admin Action Types
| Action | Description | Audit Fields |
|--------|-------------|---------------|
| `ban_user` | Ban user tạm thời | `user_id`, `reason`, `banned_until` |
| `refund` | Hoàn tiền PayOS | `payment_id`, `amount`, `reason` |
| `feature_flag` | Toggle feature flag | `flag_name`, `old_value`, `new_value` |
| `config_update` | Thay đổi system config | `config_key`, `old_value`, `new_value` |
| `impersonate` | Giả danh user (debug) | `target_user_id`, `duration` |

## Observability Events
| Event | Severity | Trigger |
|-------|----------|---------|
| `payment.failed` | warning | PayOS webhook error |
| `payment.refunded` | info | Admin refund success |
| `auth.suspicious` | warning | Nhiều login attempt fail |
| `rate_limit.exceeded` | info | User/API rate limit hit |
| `api.error` | error | 500 error |

## Security
1. Admin token không bao giờ expire trong session (refresh via Supabase)
2. Admin actions cần confirm modal ở UI
3. Impersonation có timeout 30 phút, ghi log
4. Audit logs export-able cho compliance

## Validation Rules
- `banned_until`: date trong tương lai hoặc `null`
- `reason`: required, max 500 ký tự
- `bulk_ids`: max 50 item, UUID valid
- `config_value`: type-specific (string/number/boolean)

## Integration Points
- Auth (Supabase): verify admin role
- Notifications: alert khi suspicious activity
- Billing: admin refund
- Analytics: aggregated dashboard data
