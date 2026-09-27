import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3000",
    channel: "chrome",
    headless: false,
    launchOptions: { args: ["--headless=new", "--no-sandbox"] },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run start",
        url: "http://127.0.0.1:3000/login",
        reuseExistingServer: true,
        timeout: 120_000
      }
});
