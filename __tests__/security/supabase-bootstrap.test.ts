import { spawnSync } from "child_process";
import path from "path";

const projectRoot = path.resolve(__dirname, "../..");
const validatorPath = path.join(projectRoot, "tools", "security", "verify-supabase-bootstrap.mjs");

describe("Supabase bootstrap validation", () => {
  it("passes static schema and policy checks with zero drift", () => {
    const result = spawnSync(process.execPath, [validatorPath, "--static", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);

    const report = JSON.parse(result.stdout);
    expect(report.missingSchemaTables).toEqual([]);
    expect(report.tablesWithoutRls).toEqual([]);
    expect(report.requiredUserGoalPolicies).toEqual([]);
    expect(report.placeholderOmissions).toBe(false);
  });
});
