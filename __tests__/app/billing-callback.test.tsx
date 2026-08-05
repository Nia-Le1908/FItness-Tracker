import React from "react";
import { renderToString } from "react-dom/server";

import BillingCallbackPage from "@/app/billing/callback/page";

jest.mock("@/lib/ui-feedback", () => ({
  useUiFeedback: () => ({
    pushNotice: jest.fn(),
    setBanner: jest.fn(),
    clearBanner: jest.fn()
  }),
  FeedbackProvider: ({ children }: { children: React.ReactNode }) => children
}));

const originalUse = React.use;

function renderCallbackPage(searchParams: Record<string, string>) {
  const resolved = searchParams;
  jest.spyOn(React, "use").mockImplementation((input: any) => {
    if (input && typeof input.then === "function") {
      return resolved;
    }
    return originalUse(input);
  });
  const html = renderToString(
    React.createElement(BillingCallbackPage, { searchParams: Promise.resolve(searchParams) })
  );
  jest.restoreAllMocks();
  return html;
}

describe("billing callback page", () => {
  it("renders success state", () => {
    const html = renderCallbackPage({ provider: "payos", plan: "premium", status: "success" });
    expect(html).toContain("Payment successful");
    expect(html).toContain("payos");
    expect(html).toContain("premium");
  });

  it("renders failure state", () => {
    const html = renderCallbackPage({ provider: "payos", plan: "annual", status: "cancel" });
    expect(html).toContain("Payment canceled");
    expect(html).toContain("annual");
  });
});
