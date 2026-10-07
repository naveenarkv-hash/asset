import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pythonExecutable } from "./python-runtime.mjs";

async function occupied(port) {
  try {
    await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(1500),
    });
    return true;
  } catch {
    return false;
  }
}
const apiPort = process.env.ASSETQ_DEMO_API_PORT || "8050";
const webPort = process.env.ASSETQ_DEMO_WEB_PORT || "5180";
if ((await occupied(apiPort)) || (await occupied(webPort))) {
  console.error(
    `Demo port ${apiPort} or ${webPort} is already in use. Close the existing demo window before starting another copy.`,
  );
  process.exit(1);
}
let python;
try {
  python = pythonExecutable();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const database = resolve(".data/assetq-demo.sqlite3");
const seeded = spawnSync(python, ["server/demo.py", "--database", database], {
  stdio: "inherit",
});
if (seeded.status !== 0) process.exit(seeded.status || 1);
console.log("\nEvergreen Industries is ready. Workspace: evergreen-demo");
console.log("Administrator: admin@evergreen.example.test");
console.log(
  "Public demo password: AssetQDemo!2026 (local demonstration only)\n",
);
const dev = spawn(process.execPath, ["scripts/dev.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ASSETQ_DB: database,
    ASSETQ_BIND_HOST: "127.0.0.1",
    PORT: apiPort,
    ASSETQ_API_PORT: apiPort,
    ASSETQ_WEB_PORT: webPort,
  },
});
dev.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
dev.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => dev.kill("SIGINT"));
process.on("SIGTERM", () => dev.kill("SIGTERM"));
