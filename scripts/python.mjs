import { spawn } from "node:child_process";
import { pythonExecutable } from "./python-runtime.mjs";
let child;
try {
  child = spawn(pythonExecutable(), process.argv.slice(2), {
    stdio: "inherit",
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
