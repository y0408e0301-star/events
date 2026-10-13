import { execSync } from "node:child_process";
import type { TestProject } from "vitest/node";

// テスト用の DB（vitest.config.mts の DATABASE_URL）にマイグレーションを当てる。DB がなければ作られる
export default function setup(project: TestProject) {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: project.config.env.DATABASE_URL },
    stdio: "inherit",
  });
}
