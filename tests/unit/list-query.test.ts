import { describe, expect, it } from "vitest";
import { hasFilters, normalizeSearchParams, parseListQuery } from "@/lib/list-query";

describe("normalizeSearchParams", () => {
  it("フォームから来た複数のステータスをカンマ区切りにし、空の項目は捨てる", () => {
    expect(
      normalizeSearchParams({
        status: ["SCHEDULED", "IN_PROGRESS"],
        from: "",
        to: "2026-10-31",
        q: "  ",
        sort: "startAt",
        page: undefined,
      }),
    ).toEqual({ status: "SCHEDULED,IN_PROGRESS", to: "2026-10-31", sort: "startAt" });
  });
});

describe("parseListQuery", () => {
  it("URL のクエリを一覧の条件にする", () => {
    const result = parseListQuery({ status: ["DONE"], q: "ゼミ", sort: "-updatedAt" });

    expect(result.success && result.data).toEqual({
      status: ["DONE"],
      q: "ゼミ",
      sort: "-updatedAt",
    });
  });

  it("期間が逆なら失敗し、理由を返す", () => {
    const result = parseListQuery({ from: "2026-10-31", to: "2026-10-01" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "期間の終了は開始と同じ日か後にしてください",
    ]);
  });
});

describe("hasFilters", () => {
  it("並べ順だけなら絞り込みなしとみなす", () => {
    expect(hasFilters({ status: [], q: undefined, sort: "-startAt" })).toBe(false);
    expect(hasFilters({ status: ["DONE"], q: undefined, sort: "startAt" })).toBe(true);
    expect(hasFilters({ status: [], q: undefined, from: "2026-10-01", sort: "startAt" })).toBe(
      true,
    );
  });
});
