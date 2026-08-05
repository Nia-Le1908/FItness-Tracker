# Domain Knowledge — Billing & PayOS

> Domain knowledge cho payment, subscription, billing qua PayOS gateway.

## Domain Concepts
- **Subscription**: trạng thái premium của user (monthly/yearly)
- **Entitlement**: quyền truy cập tính năng premium (cược thể hiệu lực subscription)
- **Payment**: giao dịch thanh toán PayOS (checkout → webhook)
- **Order Code** (PayOS): mã đơn duy nhất, format `SUB-{user_id}-{timestamp}`
- **Plan Tier**: `free` / `pro` / `coach` với feature gate khác nhau
- **Plan Period**: `monthly` / `yearly`

## Naming Conventions
- Tables: `payments`, `payment_audit_logs`, `subscriptions`
- Services: `createCheckoutUrl`, `verifyWebhookSignature`, `getEntitlement`
- API routes: `/api/billing/checkout`, `/api/billing/webhook`, `/api/billing/entitlement`
- Env vars: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`

## Business Rules
1. **Idempotency**: webhook phải idempotent, dùng `order_code` làm key
2. **Webhook signature**: verify `checksum` từ PayOS trước khi xử lý
3. **Entitlement** được active ngay khi thanh toán thành công (don't wait for sync)
4. **Free trial** (nếu có): 7 ngày, không yêu cầu card
5. **Refunds**: lưu audit log, không tự động expire entitlement (chờ admin)

## Lifecycle States
```
pending → paid → active → expired → cancelled
   ↓        ↑
failed   webhook retry
```

## Validation Rules
- `amount`: integer > 0 (VND, không có decimal)
- `order_code`: unique, length 6-25, alphanumeric + dash
- `currency`: `'VND'` (PayOS chỉ support VND)
- `description`: max 50 ký tự

## Security
1. **Webhook**: chỉ chấp nhận từ PayOS IP hoặc verify signature
2. **Checkout URL**: ngắn hạn (15 phút expiry)
3. **Audit log**: ghi mọi thay đổi status, ai thay đổi, lý do
4. **No card storage**: KHÔNG bao giờ lưu thông tin thẻ (PCI compliance)

## Integration Points
- Notifications: email/sms khi thanh toán thành công
- Admin: revenue analytics, refund management
- Entitlement service: feature gating
