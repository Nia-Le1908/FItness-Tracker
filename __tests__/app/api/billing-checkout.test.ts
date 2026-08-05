import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null })
    },
    from: () => ({
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
  createPaymentAttempt: jest.fn((input: any) => ({
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  createAuditEvent: jest.fn().mockResolvedValue(true)
}));

function mockPayOSResponse() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      bin: "970422",
      checkoutUrl: "https://payos.example/checkout/abc",
      accountNumber: "123456789",
      accountName: "FitBudget",
      amount: 99000,
      orderCode: 123456,
      description: "FitBudget premium subscription",
      paymentLinkId: "plink_123",
      qrCode: "qr-code"
    })
  }) as never;
}

describe("billing checkout route", () => {
  beforeEach(() => {
    process.env.PAYOS_CLIENT_ID = "client-id";
    process.env.PAYOS_API_KEY = "api-key";
    process.env.PAYOS_CHECKSUM_KEY = "checksum";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mockPayOSResponse();
  });

  it("returns a PayOS checkout payload for premium", async () => {
    const response = await checkoutPOST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ plan: "premium", gateway: "payos", userId: "user-123" })
      })
    );

    const body = await response.json();
    expect(body.data.provider).toBe("payos");
    expect(body.data.requestedPlan).toBe("premium");
    expect(body.data.payment.checkoutUrl).toBe("https://payos.example/checkout/abc");
  });
});
