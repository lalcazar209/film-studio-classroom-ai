import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// Some environments (e.g. this project's sandboxed dev container) pre-install
// Chromium outside Playwright's normal managed-browser cache. Use it only
// when it's actually present; otherwise fall back to Playwright's default
// so `npx playwright install` + CI keep working unmodified.
const sandboxChromium = "/opt/pw-browsers/chromium";
const executablePath = fs.existsSync(sandboxChromium) ? sandboxChromium : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  // `next dev` compiles each route on first visit; a cold server (always the
  // case in CI, since reuseExistingServer is off there) can take a while to
  // compile the destination route on top of running the test's own steps.
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL,
    storageState: path.join(__dirname, "tests/e2e/.auth/teacher-storage-state.json"),
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { E2E_BASE_URL: baseURL },
  },
});
