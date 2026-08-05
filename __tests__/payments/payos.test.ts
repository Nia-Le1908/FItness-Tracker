import payload from "../fixtures/payos-webhook.json";
import { buildPayOSSignatureData, extractPayOSWebhookData, normalizePayOSStatus, verifyPayOSWebhookSignature } from "@/lib/payments/payos";
import { createHmac } from "crypto";

describe("PayOS payment helpers", () => {
  beforeEach(() => {
    process.env.PAYOS_CHECKSUM_KEY = "test-secret";
  });

  it("builds canonical signature data from webhook fixture", () => {
    const data = buildPayOSSignatureData((payload as any).data);
    expect(data).toContain("amount=99000");
    expect(data).toContain("orderCode=123456");
    expect(data).toContain("status=PAID");
    expect(data).toContain("metadata=");
  });

  it("extracts sandbox webhook data", () => {
    const data = extractPayOSWebhookData(payload as never);

    expect(data.userId).toBe("user-123");
    expect(data.plan).toBe("premium");
    expect(data.orderCode).toBe(123456);
    expect(data.amount).toBe(99000);
    expect(data.status).toBe("PAID");
    expect(data.customerId).toBe("cus_abc123");
    expect(data.productId).toBe("prod_premium_01");
  });

  it("normalizes PayOS statuses", () => {
    expect(normalizePayOSStatus("PAID")).toBe("active");
    expect(normalizePayOSStatus("PENDING")).toBe("trialing");
    expect(normalizePayOSStatus("CANCELLED")).toBe("canceled");
    expect(normalizePayOSStatus("UNKNOWN")).toBe("inactive");
  });

  it("verifies webhook signatures using checksum key", () => {
    const raw = JSON.stringify(payload);
    const signature = createHmac("sha256", "test-secret").update(raw).digest("hex");

    expect(verifyPayOSWebhookSignature(raw, signature)).toBe(true);
    expect(verifyPayOSWebhookSignature(raw, "invalid")).toBe(false);
  });
});
