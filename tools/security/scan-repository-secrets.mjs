import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const jsonOutput = process.argv.includes("--json");
const jwtPattern = /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/g;
const serviceRoleAssignment = /(?:SUPABASE_SERVICE_ROLE_KEY|Supabase_service_role_key)\s*=\s*([^\s#]+)/i;

function listCandidates() {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8"
  });

  return output.split(/\r?\n/).filter(Boolean);
}

function jwtRole(token) {
  try {
    const [, encodedPayload] = token.split(".");
    const padded = encodedPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function scanFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const content = readFileSync(absolutePath, "utf8");
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const match of line.matchAll(jwtPattern)) {
      if (jwtRole(match[0]) === "service_role") {
        findings.push({ path: relativePath, line: index + 1, kind: "supabase_service_role_jwt" });
      }
    }

    const assignment = line.match(serviceRoleAssignment);
    if (assignment && !/^\$\{[A-Z0-9_]+\}$/.test(assignment[1])) {
      findings.push({ path: relativePath, line: index + 1, kind: "supabase_service_role_assignment" });
    }
  });

  return findings;
}

const findings = listCandidates().flatMap((relativePath) => {
  try {
    return scanFile(relativePath);
  } catch {
    return [];
  }
});

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify({ findings })}\n`);
} else if (findings.length > 0) {
  for (const finding of findings) {
    process.stdout.write(`${finding.path}:${finding.line} ${finding.kind}\n`);
  }
} else {
  process.stdout.write("No Supabase service-role credentials found in repository candidates.\n");
}

process.exitCode = findings.length > 0 ? 1 : 0;
