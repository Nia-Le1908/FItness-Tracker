import type { PlanTier } from "@/lib/premium";

export type EntitlementStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive";
export type EntitlementSource = "manual" | "stripe" | "payos" | "localStorage" | "none";

export type EntitlementState = {
  tier: PlanTier;
  status: EntitlementStatus;
  source: EntitlementSource;
  currentPeriodEnd: string | null;
  productId: string | null;
  customerId: string | null;
  updatedAt: string | null;
};

export const DEFAULT_ENTITLEMENT: EntitlementState = {
  tier: "free",
  status: "inactive",
  source: "none",
  currentPeriodEnd: null,
  productId: null,
  customerId: null,
  updatedAt: null
};

export const ENTITLEMENT_STORAGE_KEY = "fitbudget-entitlement";

export const PAYMENT_GATEWAYS = ["payos", "vnpay", "momo", "zalopay"] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export function normalizePaymentGateway(value: unknown): PaymentGateway {
  return PAYMENT_GATEWAYS.includes(value as PaymentGateway) ? (value as PaymentGateway) : "payos";
}

export function entitlementFromTier(tier: PlanTier): EntitlementState {
  return {
    tier,
    status: tier === "free" ? "inactive" : "active",
    source: "manual",
    currentPeriodEnd: null,
    productId: null,
    customerId: null,
    updatedAt: new Date().toISOString()
  };
}

export function isPremiumEntitled(entitlement: EntitlementState | null | undefined) {
  return entitlement?.tier === "premium" || entitlement?.tier === "annual";
}

export function canAccessPremium(entitlement: EntitlementState | null | undefined) {
  return isPremiumEntitled(entitlement) && (entitlement?.status === "active" || entitlement?.status === "trialing");
}

export function normalizeEntitlement(payload: Partial<EntitlementState> | null | undefined): EntitlementState {
  if (!payload) {
    return DEFAULT_ENTITLEMENT;
  }

  return {
    tier: payload.tier ?? DEFAULT_ENTITLEMENT.tier,
    status: payload.status ?? DEFAULT_ENTITLEMENT.status,
    source: payload.source ?? DEFAULT_ENTITLEMENT.source,
    currentPeriodEnd: payload.currentPeriodEnd ?? DEFAULT_ENTITLEMENT.currentPeriodEnd,
    productId: payload.productId ?? DEFAULT_ENTITLEMENT.productId,
    customerId: payload.customerId ?? DEFAULT_ENTITLEMENT.customerId,
    updatedAt: payload.updatedAt ?? DEFAULT_ENTITLEMENT.updatedAt
  };
}
