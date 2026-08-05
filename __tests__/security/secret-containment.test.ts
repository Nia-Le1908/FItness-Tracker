import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

const projectRoot = path.resolve(__dirname, "../..");
const scannerPath = path.join(projectRoot, "tools", "security", "scan-repository-secrets.mjs");

describe("repository secret containment", () => {
  it("keeps service-role credentials out of repository candidates and the Docker context", () => {
    const result = spawnSync(process.execPath, [scannerPath, "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const gitignore = readFileSync(path.join(projectRoot, ".gitignore"), "utf8");
    const dockerignore = readFileSync(path.join(projectRoot, ".dockerignore"), "utf8");
    const setupGuide = readFileSync(path.join(projectRoot, "setup_docker.txt"), "utf8");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ findings: [] });
    expect(result.stdout).not.toMatch(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/);
    expect(gitignore).toContain("setup_docker.txt");
    expect(dockerignore).toContain(".env*");
    expect(dockerignore).toContain("setup_docker.txt");
    expect(setupGuide).not.toMatch(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/);
  });
});
