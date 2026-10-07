import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.js",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    viewport: { width: 1440, height: 1100 },
    launchOptions: {
      executablePath: process.env.ASSETQ_CHROMIUM || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "node scripts/python.mjs server/demo.py --database .data/e2e.sqlite3 && ASSETQ_DB=.data/e2e.sqlite3 PORT=8001 node scripts/python.mjs server/app.py",
      url: "http://127.0.0.1:8001/api/health",
      reuseExistingServer: false,
    },
    {
      command:
        "ASSETQ_API_PORT=8001 npx vite --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
    },
  ],
});
