import { describe, expect, it } from "vitest";
import { toPayload, type EventFormValues } from "@/components/EventForm";
import { defaultFormValues, toFormValues } from "@/lib/form-values";

const values: EventFormValues = {
  title: "ゼミ発表",
  allDay: false,
  startDate: "2026-10-20",
  startTime: "13:00",
  endDate: "2026-10-20",
  endTime: "14:30",
  location: "",
  description: "",
  status: "SCHEDULED",
};

describe("toPayload", () => {
  it("入力を日本時間（+09:00）の日時にする", () => {
    expect(toPayload(values)).toMatchObject({
      startAt: "2026-10-20T13:00:00+09:00",
      endAt: "2026-10-20T14:30:00+09:00",
    });
  });

  it("終日なら時刻は使わない", () => {
    expect(toPayload({ ...values, allDay: true })).toMatchObject({
      startAt: "2026-10-20T00:00:00+09:00",
      endAt: "2026-10-20T00:00:00+09:00",
    });
  });

  it("日付が空なら空文字にして、入力チェックで止める", () => {
    expect(toPayload({ ...values, startDate: "" }).startAt).toBe("");
  });
});

describe("フォームの初期値", () => {
  it("保存済みのイベントを日本時間の日付・時刻に分ける", () => {
    expect(
      toFormValues({
        title: "学園祭",
        allDay: true,
        startAt: new Date("2026-10-24T15:00:00.000Z"),
        endAt: new Date("2026-10-26T14:59:59.999Z"),
        location: null,
        description: "準備",
        status: "IN_PROGRESS",
      }),
    ).toEqual({
      title: "学園祭",
      allDay: true,
      startDate: "2026-10-25",
      startTime: "00:00",
      endDate: "2026-10-26",
      endTime: "23:59",
      location: "",
      description: "準備",
      status: "IN_PROGRESS",
    });
  });

  it("作成画面は次の正時から 1 時間", () => {
    // 日本時間 10/20 23:30 → 10/21 0:00〜1:00
    expect(defaultFormValues(new Date("2026-10-20T14:30:00Z"))).toMatchObject({
      startDate: "2026-10-21",
      startTime: "00:00",
      endDate: "2026-10-21",
      endTime: "01:00",
      status: "SCHEDULED",
    });
  });

  it("カレンダーの日付から開いたときは、その日の 9:00〜10:00", () => {
    expect(defaultFormValues(new Date("2026-10-14T03:00:00Z"), "2026-10-20")).toMatchObject({
      startDate: "2026-10-20",
      startTime: "09:00",
      endDate: "2026-10-20",
      endTime: "10:00",
    });
  });
});
