import { describe, expect, it } from "vitest";
import { eventInputSchema, listQuerySchema } from "@/lib/schema";

const valid = {
  title: "ゼミ発表",
  startAt: "2026-10-20T13:00:00+09:00",
  endAt: "2026-10-20T14:30:00+09:00",
  status: "SCHEDULED",
};

describe("eventInputSchema", () => {
  it("省略できる項目を補う", () => {
    expect(eventInputSchema.parse(valid)).toEqual({
      title: "ゼミ発表",
      description: null,
      location: null,
      startAt: new Date("2026-10-20T04:00:00.000Z"),
      endAt: new Date("2026-10-20T05:30:00.000Z"),
      allDay: false,
      status: "SCHEDULED",
    });
  });

  it("ちょうど上限の長さは通す", () => {
    const result = eventInputSchema.safeParse({
      ...valid,
      title: "あ".repeat(100),
      location: "い".repeat(100),
      description: "う".repeat(1000),
    });

    expect(result.success).toBe(true);
  });
});

describe("listQuerySchema", () => {
  it("何も指定しなければ全ステータス・開始日時順", () => {
    expect(listQuerySchema.parse({})).toEqual({ status: [], sort: "startAt" });
  });

  it("空のキーワードは指定なしとして扱う", () => {
    expect(listQuerySchema.parse({ q: "  " }).q).toBeUndefined();
  });

  it("ステータスのカンマ区切りを配列にする", () => {
    expect(listQuerySchema.parse({ status: "SCHEDULED,DONE" }).status).toEqual([
      "SCHEDULED",
      "DONE",
    ]);
  });
});
