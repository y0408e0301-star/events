import { describe, expect, it } from "vitest";
import { endOfDayJst, parseDateJst, startOfDayJst } from "@/lib/date";

describe("日本時間の日付の区切り", () => {
  it.each([
    // 日本時間 10/20 0:00 ちょうど
    ["2026-10-19T15:00:00.000Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
    // 日本時間 10/20 8:59（UTC ではまだ 10/19）
    ["2026-10-19T23:59:00.000Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
    // 日本時間 10/20 23:59:59.999
    ["2026-10-20T14:59:59.999Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
  ])("%s → その日の 0:00 と 23:59:59.999", (input, start, end) => {
    expect(startOfDayJst(new Date(input)).toISOString()).toBe(start);
    expect(endOfDayJst(new Date(input)).toISOString()).toBe(end);
  });

  it("YYYY-MM-DD を日本時間の 0:00 として読む", () => {
    expect(parseDateJst("2026-10-20").toISOString()).toBe("2026-10-19T15:00:00.000Z");
  });
});
