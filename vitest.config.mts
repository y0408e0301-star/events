import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// API テスト用の DB。開発用（events）とは分け、テストのたびに中身を消す
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "mysql://events:events@localhost:3306/events_test?allowPublicKeyRetrieval=true";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // 日時の表示が実行環境のタイムゾーンに左右されないよう固定する（要件定義書 N-05）
    env: { TZ: "UTC" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "happy-dom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "api",
          environment: "node",
          include: ["tests/api/**/*.test.ts"],
          env: { DATABASE_URL: testDatabaseUrl },
          globalSetup: ["./tests/api/global-setup.ts"],
          setupFiles: ["./tests/api/setup.ts"],
          // 1 つの DB を共有するので、ファイルを並列に動かさない
          fileParallelism: false,
        },
      },
    ],
  },
});
