import { createHmac } from "crypto";
import React from "react";
import { renderToString } from "react-dom/server";

import BillingCallbackPage from "@/app/billing/callback/page";
import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";
import { POST as webhookPOST } from "@/app/api/billing/webhook/route";

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null })
    },
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: { id: "attempt-1" }, error: null }),
        upsert: jest.fn().mockReturnValue({ select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: "attempt-1" }, error: null }) }) }),
        insert: jest.fn().mockReturnValue({ select: () => ({ single: jest.fn().mockResolvedValue({ data: { id: "audit-1" }, error: null }) }) })
      };
      return chain;
    }
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

jest.mock("@/lib/ui-feedback", () => ({
  useUiFeedback: () => ({
    pushNotice: jest.fn(),
    setBanner: jest.fn(),
    clearBanner: jest.fn()
  }),
  FeedbackProvider: ({ children }: { children: React.ReactNode }) => children
}));

const originalUse = React.use;

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

describe("billing flow e2e-ish", () => {
  beforeEach(() => {
    process.env.PAYOS_CLIENT_ID = "client-id";
    process.env.PAYOS_API_KEY = "api-key";
    process.env.PAYOS_CHECKSUM_KEY = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mockPayOSResponse();
  });

  it("covers checkout -> callback -> webhook", async () => {
    const checkoutResponse = await checkoutPOST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ plan: "premium", gateway: "payos", userId: "user-123" })
      })
    );
    const checkoutBody = await checkoutResponse.json();
    expect(checkoutBody.data.payment.checkoutUrl).toBe("https://payos.example/checkout/abc");

    const callbackParams = { provider: "payos", plan: "premium", status: "success" };
    jest.spyOn(React, "use").mockImplementation((input: any) => {
      if (input && typeof input.then === "function") {
        return callbackParams;
      }
      return originalUse(input);
    });
    const callbackHtml = renderToString(
      React.createElement(BillingCallbackPage, { searchParams: Promise.resolve(callbackParams) })
    );
    jest.restoreAllMocks();
    expect(callbackHtml).toContain("Payment successful");

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

    const webhookResponse = await webhookPOST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "x-payos-signature": signature },
        body: raw
      })
    );

    const webhookBody = await webhookResponse.json();
    expect(webhookBody.data.received).toBe(true);
    expect(webhookBody.data.verified).toBe(true);
  });
});
