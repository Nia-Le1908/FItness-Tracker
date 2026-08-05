import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const jsonOutput = process.argv.includes("--json");
const staticOnly = process.argv.includes("--static");
const schemaFiles = [
  "supabase/schema.sql",
  "supabase/20260507_billing_tables.sql"
];
const policyFile = "supabase/policies.sql";
const authStubFile = "tools/security/supabase-auth-stub.sql";

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function tableNames(sql) {
  return [...sql.matchAll(/create table if not exists public\.([a-z_]+)/gi)].map((match) => match[1]);
}

function rlsTargets(sql) {
  return [...sql.matchAll(/alter table public\.([a-z_]+) enable row level security/gi)].map((match) => match[1]);
}

function staticValidation() {
  const schemaSql = schemaFiles.map(read).join("\n");
  const policySql = read(policyFile);
  const tables = [...new Set(tableNames(schemaSql))].sort();
  const rls = [...new Set(rlsTargets(policySql))].sort();
  const tableSet = new Set(tables);
  const rlsSet = new Set(rls);
  const missingSchemaTables = rls.filter((table) => !tableSet.has(table));
  const tablesWithoutRls = tables.filter((table) => !rlsSet.has(table));
  const requiredUserGoalPolicies = [
    "user_goals_select_own",
    "user_goals_insert_own",
    "user_goals_update_own",
    "user_goals_delete_own"
  ].filter((name) => !policySql.includes(`\"${name}\"`));
  const placeholderOmissions = /omitted for brevity/i.test(read("supabase/schema.sql"));

  return {
    missingSchemaTables,
    tablesWithoutRls,
    requiredUserGoalPolicies,
    placeholderOmissions,
    tables
  };
}

function hasStaticFailures(result) {
  return result.missingSchemaTables.length > 0 || result.tablesWithoutRls.length > 0 || result.requiredUserGoalPolicies.length > 0 || result.placeholderOmissions;
}

function print(result) {
  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }

  return result.stdout;
}

function dockerAvailable() {
  try {
    run("docker", ["version", "--format", "{{.Server.Version}}"]); 
    run("docker", ["image", "inspect", "postgres:16-alpine"]);
    return true;
  } catch {
    return false;
  }
}

function waitForPostgres(containerName) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = spawnSync("docker", ["exec", containerName, "pg_isready", "-U", "postgres"], {
      cwd: root,
      encoding: "utf8"
    });
    if (result.status === 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  throw new Error("PostgreSQL container did not become ready");
}

function applySql(containerName, sql) {
  run("docker", ["exec", "-i", containerName, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], { input: sql });
}

function verifyCatalog(containerName, tables) {
  const tableList = tables.map((table) => `'${table}'`).join(",");
  const query = `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in (${tableList}) and not c.relrowsecurity;`;
  const rows = run("docker", ["exec", "-i", containerName, "psql", "-At", "-U", "postgres", "-d", "postgres", "-c", query]).trim();
  if (rows) {
    throw new Error(`RLS is disabled for: ${rows.replace(/\s+/g, ", ")}`);
  }
}

const validation = staticValidation();

if (staticOnly || hasStaticFailures(validation)) {
  print(validation);
  process.exitCode = hasStaticFailures(validation) ? 1 : 0;
} else if (!dockerAvailable()) {
  print({ status: "MANUAL_VERIFY_REQUIRED", reason: "Docker or postgres:16-alpine is unavailable locally." });
  process.exitCode = 2;
} else {
  const containerName = `fitbudget-security-${process.pid}-${Date.now()}`;
  try {
    run("docker", ["run", "--rm", "-d", "--name", containerName, "-e", "POSTGRES_PASSWORD=postgres", "postgres:16-alpine"]);
    waitForPostgres(containerName);
    applySql(containerName, read(authStubFile));
    for (const schemaFile of schemaFiles) applySql(containerName, read(schemaFile));
    applySql(containerName, read(policyFile));
    verifyCatalog(containerName, validation.tables);
    print({ status: "VERIFIED", tables: validation.tables });
  } finally {
    spawnSync("docker", ["rm", "-f", containerName], { cwd: root, encoding: "utf8" });
  }
}
