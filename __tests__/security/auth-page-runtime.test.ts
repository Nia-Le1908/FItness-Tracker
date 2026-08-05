import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

describe("auth page runtime", () => {
  it("allows Next.js bootstrap scripts required to hydrate the login form", () => {
    const nextConfig = readFileSync(path.join(root, "next.config.mjs"), "utf8");

    expect(nextConfig).toContain("script-src 'self' 'unsafe-inline'");
  });

  it("uses one submit handler without a capture-phase cancellation", () => {
    const authForm = readFileSync(path.join(root, "components", "auth-form.tsx"), "utf8");

    expect(authForm).toContain('onSubmit={handleSubmit}');
    expect(authForm).not.toContain("onSubmitCapture");
  });
});
