import { createHmac } from "crypto";

export type PayOSPlan = "premium" | "annual";
export type PayOSCheckoutMode = "buy" | "subscription";

export type PayOSCreatePaymentInput = {
  plan: PayOSPlan;
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
};

export type PayOSCreatePaymentResponse = {
  bin: string;
  checkoutUrl: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  orderCode: number;
  description: string;
  paymentLinkId: string;
  qrCode: string;
};

export type PayOSWebhookPayload = {
  code?: string;
  desc?: string;
  data?: {
    orderCode?: number | string;
    status?: string;
    amount?: number;
    expiredAt?: number;
    transactionDateTime?: string;
    reference?: string;
    buyerEmail?: string;
    buyerName?: string;
    metadata?: Record<string, unknown>;
    user_id?: string;
    plan?: PayOSPlan;
    productId?: string;
    customerId?: string;
    paymentLinkId?: string;
    orderCodeStr?: string;
  };
  order?: {
    orderCode?: number | string;
    status?: string;
    amount?: number;
    expiredAt?: number;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  signature?: string;
};

const PAYOS_API_URL = "https://api-merchant.payos.vn";

function getPayOSConfig() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("Missing PayOS env vars. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY.");
  }

  return { clientId, apiKey, checksumKey };
}

function getChecksumKey() {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    throw new Error("Missing PAYOS_CHECKSUM_KEY env var.");
  }
  return checksumKey;
}

function normalizeSignatureValue(value: unknown): string {
  if (value === null || value === undefined || value === "null" || value === "undefined") {
    return "";
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => (typeof item === "object" && item !== null ? sortObject(item) : item)));
  }

  if (typeof value === "object") {
    return JSON.stringify(sortObject(value as Record<string, unknown>));
  }

  return String(value);
}

export function sortObject(object: Record<string, unknown>) {
  return Object.keys(object)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = object[key];
      return acc;
    }, {});
}

export function buildPayOSSignatureData(payload: Record<string, unknown>) {
  return Object.keys(sortObject(payload))
    .map((key) => `${key}=${normalizeSignatureValue(payload[key])}`)
    .join("&");
}

function signPayload(payload: Record<string, unknown>, checksumKey: string) {
  return createHmac("sha256", checksumKey).update(buildPayOSSignatureData(payload)).digest("hex");
}

export function buildPayOSCreatePaymentBody(input: PayOSCreatePaymentInput) {
  const { clientId, checksumKey } = getPayOSConfig();

  const payload = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    buyerName: input.buyerName ?? "FitBudget user",
    buyerEmail: input.buyerEmail ?? "billing@fitbudget.local",
    buyerPhone: input.buyerPhone ?? "0000000000",
    items: [{ name: `FitBudget ${input.plan}`, quantity: 1, price: input.amount }],
    expiredAt: Math.floor(Date.now() / 1000) + 60 * 15,
    metadata: input.metadata ?? {},
    clientId
  };

  return {
    ...payload,
    signature: signPayload(payload, checksumKey)
  };
}

export async function createPayOSPayment(input: PayOSCreatePaymentInput) {
  const { apiKey, clientId } = getPayOSConfig();
  const body = buildPayOSCreatePaymentBody(input);

  const response = await fetch(`${PAYOS_API_URL}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`PayOS request failed with status ${response.status}`);
  }

  return (await response.json()) as PayOSCreatePaymentResponse;
}

export function normalizePayOSStatus(status: string | undefined) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PAID" || normalized === "SUCCESS") return "active";
  if (normalized === "PENDING" || normalized === "PROCESSING") return "trialing";
  if (normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "EXPIRED") return "canceled";
  return "inactive";
}

export function extractPayOSWebhookData(payload: PayOSWebhookPayload) {
  const data = payload.data ?? payload.order ?? {};
  const metadata = { ...(payload.metadata ?? {}), ...((payload.data?.metadata ?? payload.order?.metadata) ?? {}) };
  return {
    userId: (metadata.user_id as string | undefined) ?? payload.data?.user_id ?? null,
    plan: (metadata.plan as PayOSPlan | undefined) ?? payload.data?.plan ?? "premium",
    orderCode: data.orderCode ?? payload.data?.orderCode ?? null,
    amount: data.amount ?? payload.data?.amount ?? null,
    expiredAt: data.expiredAt ?? payload.data?.expiredAt ?? null,
    status: data.status ?? payload.code ?? payload.desc ?? payload.data?.status ?? payload.order?.status ?? "PAID",
    customerId: (metadata.customerId as string | undefined) ?? payload.data?.customerId ?? null,
    productId: (metadata.productId as string | undefined) ?? payload.data?.productId ?? null,
    reference: payload.data?.reference ?? null,
    paymentLinkId: payload.data?.paymentLinkId ?? null
  };
}

export function verifyPayOSWebhookSignature(rawBody: string, signature: string | null) {
  const checksumKey = getChecksumKey();
  const expected = createHmac("sha256", checksumKey).update(rawBody).digest("hex");
  return Boolean(signature) && signature === expected;
}

export function getPayOSWebhookSignatureCandidates(rawBody: string, payload: PayOSWebhookPayload) {
  const checksumKey = getChecksumKey();
  const data = payload.data ?? payload.order ?? {};
  const canonical = buildPayOSSignatureData(data as Record<string, unknown>);
  return [createHmac("sha256", checksumKey).update(rawBody).digest("hex"), createHmac("sha256", checksumKey).update(canonical).digest("hex")];
}
