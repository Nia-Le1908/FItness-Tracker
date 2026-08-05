import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const bucket = new Map<string, { tokens: number; lastRefill: number }>();

const RATE_LIMIT_CONFIG = {
  default: { maxTokens: 120, refillRate: 60_000 },
  auth: { maxTokens: 10, refillRate: 60_000 },
  billing: { maxTokens: 8, refillRate: 60_000 },
  admin: { maxTokens: 60, refillRate: 60_000 },
  webhook: { maxTokens: 120, refillRate: 60_000 }
} as const;

const BODY_SIZE_LIMITS: Record<string, number> = {
  "/api/admin/bulk-actions": 128 * 1024,
  "/api/billing/checkout": 16 * 1024,
  "/api/observability/events": 32 * 1024
};

type RateLimitKey = keyof typeof RATE_LIMIT_CONFIG;

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function allowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const origins = getAllowedOrigins();

  if (origins.length > 0) {
    return origins.includes(origin) ? origin : null;
  }

  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  return null;
}

const bucketMaxAge = 5 * 60_000;

function evictStaleEntries(now: number) {
  for (const [ip, entry] of bucket) {
    if (now - entry.lastRefill > bucketMaxAge) {
      bucket.delete(ip);
    }
  }
}

function resolveRateLimitKey(pathname: string): RateLimitKey {
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/login") || pathname.startsWith("/api/register")) return "auth";
  if (pathname.startsWith("/api/billing")) return "billing";
  if (pathname.startsWith("/api/admin")) return "admin";
  if (pathname.includes("webhook")) return "webhook";
  return "default";
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

function getTrustedProxyIps(): Set<string> {
  return new Set(
    (process.env.TRUSTED_PROXY_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/**
 * Resolve the real client IP without trusting spoofable headers.
 *
 * - By default (no trusted proxies configured) `request.ip` — the socket
 *   address seen by Next.js — is authoritative. X-Forwarded-For / X-Real-IP
 *   are ignored, so a client cannot rotate rate-limit buckets by sending
 *   fake headers.
 * - Only when the connection genuinely comes from a trusted proxy (nginx,
 *   Cloudflare, mitmproxy, ...) do we walk the X-Forwarded-For chain from
 *   the server side (right to left), skipping hops that are trusted proxies
 *   themselves, and use the first real client address.
 */
export function resolveClientIp(request: NextRequest, trustedProxies: ReadonlySet<string>): string {
  // `request.ip` is populated at runtime by the Next.js adapter, but the type
  // declaration in this Next version omits it, so access it via a cast.
  const directIp = (request as NextRequest & { ip?: string }).ip ?? "127.0.0.1";

  if (trustedProxies.size === 0 || !trustedProxies.has(directIp)) {
    return directIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const hop of forwarded.split(",").map((s) => s.trim()).reverse()) {
      if (hop && !trustedProxies.has(hop)) return hop;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && !trustedProxies.has(realIp)) return realIp;

  return directIp;
}

function getClientIp(request: NextRequest) {
  return resolveClientIp(request, getTrustedProxyIps());
}

function checkRateLimit(ip: string, pathname: string) {
  const configKey = resolveRateLimitKey(pathname);
  const { maxTokens, refillRate } = RATE_LIMIT_CONFIG[configKey];
  const now = Date.now();

  let entry = bucket.get(ip);
  if (!entry) {
    entry = { tokens: maxTokens, lastRefill: now };
    bucket.set(ip, entry);
  }

  const elapsed = now - entry.lastRefill;
  const refill = Math.floor(elapsed / refillRate) * maxTokens;
  entry.tokens = Math.min(maxTokens, entry.tokens + refill);
  entry.lastRefill = now;

  if (entry.tokens <= 0) {
    return false;
  }

  entry.tokens -= 1;

  if (bucket.size > 10000) {
    evictStaleEntries(now);
  }

  return true;
}

function buildCorsHeaders(request: NextRequest) {
  const origin = allowedOrigin(request);
  if (!origin) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-PayOS-Signature"
  };
}

function buildRateLimitResponse() {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: { "Retry-After": "60" }
    }
  );
}

function buildPayloadTooLargeResponse() {
  return NextResponse.json(
    { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large." } },
    { status: 413 }
  );
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // ---- Static security / well-known endpoints ---------------------------
  if (pathname === "/.well-known/security.txt") {
    return new NextResponse(
      [
        "Contact: mailto:security@fitbudget.local",
        "Expires: 2027-12-31T23:59:59Z",
        "Preferred-Languages: en, vi",
        "Canonical: https://fitbudget.local/.well-known/security.txt",
        "Policy: https://fitbudget.local/security"
      ].join("\n"),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      }
    );
  }

  if (pathname === "/robots.txt") {
    return new NextResponse(
      ["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /admin/"].join("\n"),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      }
    );
  }

  if (!isApiRoute(pathname)) {
    return NextResponse.next();
  }

  const corsHeaders = buildCorsHeaders(request);

  // ---- CORS preflight ----------------------------------------------------
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // ---- Body size limits for POST/PATCH -----------------------------------
  if ((request.method === "POST" || request.method === "PATCH" || request.method === "PUT")) {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    const limit = BODY_SIZE_LIMITS[pathname] ?? 256 * 1024;
    if (contentLength > limit) {
      const response = buildPayloadTooLargeResponse();
      for (const [k, v] of Object.entries(corsHeaders)) {
        response.headers.set(k, v);
      }
      return response;
    }
  }

  // ---- Rate limiting (checked BEFORE forwarding) --------------------------
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, pathname)) {
    const response = buildRateLimitResponse();
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  }

  // ---- Normal request: forward with CORS headers --------------------------
  const response = NextResponse.next();
  for (const [k, v] of Object.entries(corsHeaders)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};