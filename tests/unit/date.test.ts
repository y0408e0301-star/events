import { describe, expect, it } from "vitest";
import {
  endOfDayJst,
  formatDateTimeJst,
  formatDayJst,
  formatEventPeriodJst,
  formatTimeRangeJst,
  groupByStartDayJst,
  parseDateJst,
  startOfDayJst,
  toJstDateKey,
  toJstTime,
} from "@/lib/date";

const d = (iso: string) => new Date(iso);

describe("日本時間の日付の区切り", () => {
  it.each([
    // 日本時間 10/20 0:00 ちょうど
    ["2026-10-19T15:00:00.000Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
    // 日本時間 10/20 8:59（UTC ではまだ 10/19）
    ["2026-10-19T23:59:00.000Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
    // 日本時間 10/20 23:59:59.999
    ["2026-10-20T14:59:59.999Z", "2026-10-19T15:00:00.000Z", "2026-10-20T14:59:59.999Z"],
  ])("%s → その日の 0:00 と 23:59:59.999", (input, start, end) => {
    expect(startOfDayJst(d(input)).toISOString()).toBe(start);
    expect(endOfDayJst(d(input)).toISOString()).toBe(end);
  });

  it("YYYY-MM-DD を日本時間の 0:00 として読む", () => {
    expect(parseDateJst("2026-10-20").toISOString()).toBe("2026-10-19T15:00:00.000Z");
  });
});

describe("日本時間での表示", () => {
  // UTC では 10/19 23:05、日本時間では 10/20（火）8:05
  const date = d("2026-10-19T23:05:00.000Z");

  it("日付・時刻・曜日を日本時間で出す", () => {
    expect(toJstDateKey(date)).toBe("2026-10-20");
    expect(toJstTime(date)).toBe("08:05");
    expect(formatDayJst(date)).toBe("10月20日（火）");
    expect(formatDateTimeJst(date)).toBe("2026年10月20日（火） 08:05");
  });

  it.each([
    ["同じ日", "2026-10-20T04:00:00Z", "2026-10-20T05:30:00Z", false, "13:00〜14:30"],
    ["開始と終了が同じ", "2026-10-18T14:59:00Z", "2026-10-18T14:59:00Z", false, "23:59"],
    [
      "日をまたぐ",
      "2026-10-20T04:00:00Z",
      "2026-10-21T00:00:00Z",
      false,
      "13:00〜10月21日（水） 09:00",
    ],
    ["終日", "2026-10-19T15:00:00Z", "2026-10-20T14:59:59.999Z", true, "終日"],
    [
      "複数日の終日",
      "2026-10-19T15:00:00Z",
      "2026-10-21T14:59:59.999Z",
      true,
      "終日（10月21日（水）まで）",
    ],
  ])("一覧の時刻：%s", (_, start, end, allDay, expected) => {
    expect(formatTimeRangeJst({ startAt: d(start), endAt: d(end), allDay })).toBe(expected);
  });

  it.each([
    [
      "時刻あり",
      "2026-10-20T04:00:00Z",
      "2026-10-20T05:30:00Z",
      false,
      "2026年10月20日（火） 13:00〜14:30",
    ],
    ["終日", "2026-10-19T15:00:00Z", "2026-10-20T14:59:59.999Z", true, "2026年10月20日（火） 終日"],
    [
      "複数日の終日",
      "2026-10-24T15:00:00Z",
      "2026-10-26T14:59:59.999Z",
      true,
      "2026年10月25日（日）〜10月26日（月） 終日",
    ],
  ])("詳細の日時：%s", (_, start, end, allDay, expected) => {
    expect(formatEventPeriodJst({ startAt: d(start), endAt: d(end), allDay })).toBe(expected);
  });
});

describe("groupByStartDayJst", () => {
  it("日本時間の開始日が同じものを続けてまとめる", () => {
    const items = [
      { id: 1, startAt: d("2026-10-18T14:59:00Z") }, // 10/18 23:59
      { id: 2, startAt: d("2026-10-19T15:00:00Z") }, // 10/20 0:00
      { id: 3, startAt: d("2026-10-20T04:00:00Z") }, // 10/20 13:00
    ];

    const groups = groupByStartDayJst(items);

    expect(groups.map((g) => [g.day, g.items.map((i) => i.id)])).toEqual([
      ["2026-10-18", [1]],
      ["2026-10-20", [2, 3]],
    ]);
  });

  it("同じ日が離れて出てきても、グループの id は重ならない", () => {
    const items = [
      { startAt: d("2026-10-20T04:00:00Z") },
      { startAt: d("2026-10-18T04:00:00Z") },
      { startAt: d("2026-10-20T05:00:00Z") },
    ];

    const ids = groupByStartDayJst(items).map((g) => g.id);

    expect(new Set(ids).size).toBe(3);
  });
});
