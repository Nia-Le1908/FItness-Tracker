import { POST as webhookPOST } from "@/app/api/billing/webhook/route";
import { createHmac } from "crypto";

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }),
      upsert: jest.fn().mockReturnValue({
        select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: "attempt-1" }, error: null }) })
      }),
      insert: () => ({
        select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: "audit-1" }, error: null }) })
      })
    })
  })
}));

jest.mock("@/lib/payments/payment-audit", () => ({
  createAuditEvent: jest.fn().mockResolvedValue(true)
}));

describe("PayOS webhook route", () => {
  it("accepts verified payloads", async () => {
    process.env.PAYOS_CHECKSUM_KEY = "test-secret";

    const payload = {
      code: "00",
      desc: "success",
      data: {
        orderCode: 123456,
        amount: 99000,
        status: "PAID",
        expiredAt: 1735689600,
        metadata: {
          user_id: "user-123",
          plan: "premium"
        }
      }
    };

    const raw = JSON.stringify(payload);
    const signature = createHmac("sha256", "test-secret").update(raw).digest("hex");

    const response = await webhookPOST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "x-payos-signature": signature },
        body: raw
      })
    );

    const body = await response.json();
    expect(body.data.received).toBe(true);
    expect(body.data.verified).toBe(true);
  });
});
