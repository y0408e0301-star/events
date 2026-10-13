import { defineConfig, devices } from "@playwright/test";

// E2E テストは開発用とは別の DB（events_e2e）を使い、テストのたびに中身を消す
const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  "mysql://events:events@localhost:3306/events_e2e?allowPublicKeyRetrieval=true";

export default defineConfig({
  testDir: "./tests/e2e",
  // 1 つの DB を共有するので、テストは 1 つずつ動かす
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // 手元では PC の Edge を使い、CI では Playwright の Chromium を使う
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "msedge" },
    },
  ],
  webServer: {
    // E2E 用の DB にマイグレーションを当て（DB がなければ作られる）、本番と同じビルドで確かめる。
    // ポートは Next.js の既定の 3000（使われていたら止めてから実行する）
    command: "npx prisma migrate deploy && npm run build && npm run start",
    url: "http://localhost:3000/api/health",
    env: { DATABASE_URL: databaseUrl },
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
