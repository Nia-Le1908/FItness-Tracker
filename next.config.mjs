const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingExcludes: {
    "*": ["**/@img/sharp*/**"]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js emits inline bootstrap data for App Router hydration.
              // Replace unsafe-inline with per-request nonces when CSP moves to middleware.
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              `connect-src 'self' ${supabaseUrl} https://api-merchant.payos.vn`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
