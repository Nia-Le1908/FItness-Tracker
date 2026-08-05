process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://example.com";

import { middleware, resolveClientIp } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";

function createRequest(pathname: string, opts: { method?: string; ip?: string; body?: string; origin?: string } = {}): NextRequest {
  const origin = opts.origin ?? "http://localhost";
  const url = `${origin}${pathname}`;
  const headers = new Headers();
  if (opts.ip) headers.set("x-forwarded-for", opts.ip);
  if (opts.origin) headers.set("origin", opts.origin);
  if (opts.body) {
    headers.set("content-length", String(Buffer.byteLength(opts.body)));
  }

  const req = new NextRequest(url, {
    method: opts.method || "GET",
    headers
  });

  return req;
}

describe("middleware", () => {
  beforeEach(() => {
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://example.com";
    // Simulate the app sitting behind a proxy on localhost so per-IP rate
    // limit buckets stay isolated per test (Jest cannot set request.ip).
    process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
  });

  afterEach(() => {
    process.env.CORS_ALLOWED_ORIGINS = "";
    process.env.TRUSTED_PROXY_IPS = "";
  });
  describe("security.txt", () => {
    it("returns security.txt content", async () => {
      const req = createRequest("/.well-known/security.txt");
      const response = middleware(req);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Contact: mailto:security@fitbudget.local");
      expect(text).toContain("Preferred-Languages: en, vi");
      expect(text).toContain("Expires: 2027");
    });
  });

  describe("robots.txt", () => {
    it("returns robots.txt content", async () => {
      const req = createRequest("/robots.txt");
      const response = middleware(req);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("User-agent: *");
      expect(text).toContain("Disallow: /api/");
      expect(text).toContain("Disallow: /admin/");
    });
  });

  describe("non-API routes", () => {
    it("passes through non-API routes to next()", () => {
      const req = createRequest("/dashboard");
      const response = middleware(req);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe("CORS preflight", () => {
    it("returns 204 for OPTIONS requests to API", () => {
      const req = createRequest("/api/data", { method: "OPTIONS", origin: "http://localhost:3000" });
      const response = middleware(req);
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
      expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
    });
  });

  describe("CORS headers on normal requests", () => {
    it("adds CORS headers to API responses", () => {
      const req = createRequest("/api/data", { origin: "http://example.com" });
      const response = middleware(req);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    });
  });

  describe("rate limiting", () => {
    it("allows first request through", () => {
      const req = createRequest("/api/data", { ip: "192.168.1.1" });
      const response = middleware(req);
      expect(response.status).not.toBe(429);
    });

    it("returns 429 after exceeding default limit", () => {
      const ip = "192.168.1.100";
      // Exhaust tokens for this IP (default: 120 tokens)
      for (let i = 0; i < 121; i++) {
        const req = createRequest("/api/data", { ip });
        middleware(req);
      }
      const req = createRequest("/api/data", { ip });
      const response = middleware(req);
      expect(response.status).toBe(429);
      const body = response.json();
      expect(body).resolves.toEqual({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later."
        }
      });
    });
  });

  describe("body size limits", () => {
    it("returns 413 when body exceeds default 256KB", () => {
      const largeBody = "x".repeat(300 * 1024);
      const req = createRequest("/api/workout-sessions", {
        method: "POST",
        ip: "1.1.1.1",
        body: largeBody
      });
      const response = middleware(req);
      expect(response.status).toBe(413);
    });

    it("allows body within default limit", () => {
      const smallBody = JSON.stringify({ name: "test" });
      const req = createRequest("/api/workout-sessions", {
        method: "POST",
        ip: "1.1.1.2",
        body: smallBody
      });
      const response = middleware(req);
      expect(response.status).not.toBe(413);
    });

    it("enforces custom limit for billing checkout (16KB)", () => {
      const largeBody = "x".repeat(20 * 1024);
      const req = createRequest("/api/billing/checkout", {
        method: "POST",
        ip: "1.1.1.3",
        body: largeBody
      });
      const response = middleware(req);
      expect(response.status).toBe(413);
    });
  });

  describe("getClientIp (spoof resistance)", () => {
    it("ignores X-Forwarded-For when no trusted proxy is configured", () => {
      process.env.TRUSTED_PROXY_IPS = "";
      // All requests resolve to the same socket address (127.0.0.1 in Jest).
      // Rotating fake IPs in the header must NOT create separate buckets.
      const fakeIps = ["1.2.3.4", "5.6.7.8", "9.9.9.9"];
      for (let i = 0; i < 121; i++) {
        middleware(createRequest("/api/data", { ip: fakeIps[i % fakeIps.length] }));
      }
      const response = middleware(createRequest("/api/data", { ip: "1.2.3.4" }));
      expect(response.status).toBe(429);
    });

    it("honors X-Forwarded-For when the request comes from a trusted proxy", () => {
      process.env.TRUSTED_PROXY_IPS = "127.0.0.1";
      const ipA = "10.0.0.10";
      const ipB = "10.0.0.11";
      for (let i = 0; i < 121; i++) {
        middleware(createRequest("/api/data", { ip: ipA }));
      }
      expect(middleware(createRequest("/api/data", { ip: ipB })).status).not.toBe(429);
      expect(middleware(createRequest("/api/data", { ip: ipA })).status).toBe(429);
    });

    it("uses the socket address when the connection is not from a trusted proxy", () => {
      const req = createRequest("/api/data", { ip: "6.6.6.6" });
      expect(resolveClientIp(req, new Set(["10.0.0.1"]))).toBe("127.0.0.1");
    });

    it("walks the forwarded chain skipping trusted proxy hops", () => {
      const req = new NextRequest("http://localhost/api/data", {
        headers: { "x-forwarded-for": "8.8.8.8, 10.0.0.2, 10.0.0.1" }
      });
      expect(resolveClientIp(req, new Set(["127.0.0.1", "10.0.0.1", "10.0.0.2"]))).toBe("8.8.8.8");
    });

    it("does not trust x-real-ip unless the connection is from a trusted proxy", () => {
      const req = new NextRequest("http://localhost/api/data", {
        headers: { "x-real-ip": "6.6.6.6" }
      });
      expect(resolveClientIp(req, new Set(["10.0.0.1"]))).toBe("127.0.0.1");
      expect(resolveClientIp(req, new Set(["127.0.0.1"]))).toBe("6.6.6.6");
    });
  });

  describe("resolveRateLimitKey", () => {
    it("applies auth rate limit to /api/auth/*", () => {
      const ip = "192.168.1.200";
      for (let i = 0; i < 11; i++) {
        middleware(createRequest("/api/auth/login", { ip }));
      }
      const response = middleware(createRequest("/api/auth/login", { ip }));
      expect(response.status).toBe(429);
    });

    it("applies admin rate limit (60/min)", () => {
      const ip = "192.168.1.201";
      for (let i = 0; i < 61; i++) {
        middleware(createRequest("/api/admin/users", { ip }));
      }
      const response = middleware(createRequest("/api/admin/users", { ip }));
      expect(response.status).toBe(429);
    });
  });
});
