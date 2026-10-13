import { describe, expect, it } from "vitest";
import { statusWarning, suggestStatus } from "@/lib/status";

// 日本時間 10/20 13:00〜14:30
const period = {
  startAt: new Date("2026-10-20T04:00:00.000Z"),
  endAt: new Date("2026-10-20T05:30:00.000Z"),
};
const at = (jstTime: string) => new Date(`2026-10-20T${jstTime}+09:00`);

describe("suggestStatus", () => {
  it.each([
    ["12:59:59", "SCHEDULED"],
    ["13:00:00", "IN_PROGRESS"],
    ["14:30:00", "IN_PROGRESS"],
    ["14:30:01", "DONE"],
  ])("%s なら %s", (time, expected) => {
    expect(suggestStatus(period, at(time))).toBe(expected);
  });
});

describe("statusWarning", () => {
  it.each([
    // [保存したステータス, 今, 注意]
    ["SCHEDULED", "12:00:00", null],
    ["SCHEDULED", "13:00:00", "started"],
    ["SCHEDULED", "15:00:00", "overdue"], // 終了後は赤を優先
    ["IN_PROGRESS", "12:00:00", null],
    ["IN_PROGRESS", "14:00:00", null],
    ["IN_PROGRESS", "15:00:00", "overdue"],
    ["DONE", "12:00:00", null],
    ["DONE", "15:00:00", null],
  ] as const)("%s で %s なら %s", (status, time, expected) => {
    expect(statusWarning({ ...period, status }, at(time))).toBe(expected);
  });
});
