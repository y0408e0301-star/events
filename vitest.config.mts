import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // 日時の表示が実行環境のタイムゾーンに左右されないよう固定する（要件定義書 N-05）
    env: { TZ: "UTC" },
  },
});
