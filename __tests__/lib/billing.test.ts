import { normalizePaymentGateway, entitlementFromTier, isPremiumEntitled, canAccessPremium, normalizeEntitlement, DEFAULT_ENTITLEMENT, ENTITLEMENT_STORAGE_KEY } from "@/lib/billing";

describe("normalizePaymentGateway", () => {
  it("returns the value for valid gateways", () => {
    expect(normalizePaymentGateway("payos")).toBe("payos");
    expect(normalizePaymentGateway("vnpay")).toBe("vnpay");
    expect(normalizePaymentGateway("momo")).toBe("momo");
    expect(normalizePaymentGateway("zalopay")).toBe("zalopay");
  });

  it("defaults to 'payos' for invalid values", () => {
    expect(normalizePaymentGateway("stripe")).toBe("payos");
    expect(normalizePaymentGateway("")).toBe("payos");
    expect(normalizePaymentGateway(null)).toBe("payos");
    expect(normalizePaymentGateway(undefined)).toBe("payos");
  });
});

describe("entitlementFromTier", () => {
  it("returns active status for premium", () => {
    const result = entitlementFromTier("premium");
    expect(result.tier).toBe("premium");
    expect(result.status).toBe("active");
    expect(result.source).toBe("manual");
    expect(result.updatedAt).toBeDefined();
  });

  it("returns inactive status for free", () => {
    const result = entitlementFromTier("free");
    expect(result.tier).toBe("free");
    expect(result.status).toBe("inactive");
  });

  it("returns active status for annual", () => {
    const result = entitlementFromTier("annual");
    expect(result.status).toBe("active");
  });
});

describe("isPremiumEntitled", () => {
  it("returns true for premium and annual", () => {
    expect(isPremiumEntitled({ tier: "premium" } as any)).toBe(true);
    expect(isPremiumEntitled({ tier: "annual" } as any)).toBe(true);
  });

  it("returns false for free and null", () => {
    expect(isPremiumEntitled({ tier: "free" } as any)).toBe(false);
    expect(isPremiumEntitled(null)).toBe(false);
    expect(isPremiumEntitled(undefined)).toBe(false);
  });
});

describe("canAccessPremium", () => {
  it("returns true when premium and active", () => {
    expect(canAccessPremium({ tier: "premium", status: "active" } as any)).toBe(true);
    expect(canAccessPremium({ tier: "premium", status: "trialing" } as any)).toBe(true);
    expect(canAccessPremium({ tier: "annual", status: "active" } as any)).toBe(true);
  });

  it("returns false when premium but past_due/canceled", () => {
    expect(canAccessPremium({ tier: "premium", status: "past_due" } as any)).toBe(false);
    expect(canAccessPremium({ tier: "premium", status: "canceled" } as any)).toBe(false);
    expect(canAccessPremium({ tier: "premium", status: "inactive" } as any)).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(canAccessPremium(null)).toBe(false);
    expect(canAccessPremium(undefined)).toBe(false);
  });
});

describe("normalizeEntitlement", () => {
  it("returns DEFAULT_ENTITLEMENT for null/undefined", () => {
    expect(normalizeEntitlement(null)).toEqual(DEFAULT_ENTITLEMENT);
    expect(normalizeEntitlement(undefined)).toEqual(DEFAULT_ENTITLEMENT);
  });

  it("fills missing fields with defaults", () => {
    const result = normalizeEntitlement({ tier: "premium" });
    expect(result.tier).toBe("premium");
    expect(result.status).toBe(DEFAULT_ENTITLEMENT.status);
    expect(result.source).toBe(DEFAULT_ENTITLEMENT.source);
  });

  it("preserves provided fields", () => {
    const input = {
      tier: "annual" as const,
      status: "active" as const,
      source: "payos" as const,
      currentPeriodEnd: "2026-01-01",
      productId: "prod-1",
      customerId: "cus-1",
      updatedAt: "2025-07-10"
    };
    const result = normalizeEntitlement(input);
    expect(result).toEqual(input);
  });
});

describe("DEFAULT_ENTITLEMENT", () => {
  it("has free tier with inactive status", () => {
    expect(DEFAULT_ENTITLEMENT.tier).toBe("free");
    expect(DEFAULT_ENTITLEMENT.status).toBe("inactive");
    expect(DEFAULT_ENTITLEMENT.source).toBe("none");
    expect(DEFAULT_ENTITLEMENT.currentPeriodEnd).toBeNull();
    expect(DEFAULT_ENTITLEMENT.productId).toBeNull();
    expect(DEFAULT_ENTITLEMENT.customerId).toBeNull();
    expect(DEFAULT_ENTITLEMENT.updatedAt).toBeNull();
  });
});

describe("ENTITLEMENT_STORAGE_KEY", () => {
  it("is the expected key", () => {
    expect(ENTITLEMENT_STORAGE_KEY).toBe("fitbudget-entitlement");
  });
});
