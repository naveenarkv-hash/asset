import { spawn } from "node:child_process";
import { pythonExecutable } from "./python-runtime.mjs";
let api;
try {
  const response = await fetch(
    `http://127.0.0.1:${process.env.PORT || 8000}/api/health`,
  );
  if (!(await response.json()).status) throw Error("API unavailable");
} catch {
  api = spawn(pythonExecutable(), ["server/app.py"], { stdio: "inherit" });
}
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    process.env.ASSETQ_BIND_HOST || "0.0.0.0",
    "--port",
    process.env.ASSETQ_WEB_PORT || "5173",
  ],
  { stdio: "inherit" },
);
const stop = () => {
  vite.kill("SIGTERM");
  api?.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
vite.on("exit", (code) => {
  api?.kill("SIGTERM");
  process.exit(code ?? 0);
});
