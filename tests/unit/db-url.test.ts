import { describe, expect, it } from "vitest";
import { withPoolDefaults } from "@/lib/db-url";

describe("DB の接続文字列", () => {
  it("接続を待つ上限を 3 秒にする", () => {
    expect(withPoolDefaults("mysql://events:events@localhost:3306/events?ssl=true")).toBe(
      "mysql://events:events@localhost:3306/events?ssl=true&acquireTimeout=3000",
    );
  });

  it("接続文字列で指定があればそちらを使う", () => {
    expect(withPoolDefaults("mysql://u:p@db:3306/events?acquireTimeout=5000")).toBe(
      "mysql://u:p@db:3306/events?acquireTimeout=5000",
    );
  });

  it("記号を含むパスワード（URL エンコード済み）を崩さない", () => {
    expect(withPoolDefaults("mysql://events:a%2Fb%40c@db:3306/events")).toBe(
      "mysql://events:a%2Fb%40c@db:3306/events?acquireTimeout=3000",
    );
  });
});
