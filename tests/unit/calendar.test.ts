import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarMark,
  calendarTitle,
  dayLabel,
  eventsOnDay,
  isAllDayLike,
  layoutTimedEvents,
  monthDays,
  parseCalendarQuery,
  parseDateParam,
  shiftDate,
  weekDays,
  type CalendarEvent,
} from "@/lib/calendar";

const now = new Date("2026-10-14T03:00:00Z"); // 日本時間 10/14（水）12:00

let nextId = 1;
const ev = (start: string, end: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: nextId++,
  title: "イベント",
  startAt: new Date(start),
  endAt: new Date(end),
  allDay: false,
  status: "SCHEDULED",
  ...extra,
});

describe("URL のクエリ", () => {
  it("指定がなければ今日の月表示", () => {
    expect(parseCalendarQuery({}, now)).toEqual({ view: "month", date: "2026-10-14" });
  });

  it("週表示と日付を読む", () => {
    expect(parseCalendarQuery({ view: "week", date: "2026-12-31" }, now)).toEqual({
      view: "week",
      date: "2026-12-31",
    });
  });

  it.each([
    { view: "day" },
    { date: "2026-13-01" },
    { date: "20261020" },
    { view: ["week", "month"] },
  ])("正しくない値 %o は今日の月表示", (params) => {
    expect(parseCalendarQuery(params, now)).toEqual({ view: "month", date: "2026-10-14" });
  });

  it("作成フォームの ?date= は正しい日付だけ使う", () => {
    expect(parseDateParam("2026-10-20")).toBe("2026-10-20");
    expect(parseDateParam("2026-02-30")).toBeUndefined();
    expect(parseDateParam(["2026-10-20"])).toBeUndefined();
    expect(parseDateParam(undefined)).toBeUndefined();
  });
});

describe("表示する範囲", () => {
  it("月表示は 1 日を含む週の日曜から末日を含む週の土曜まで", () => {
    // 2026 年 10 月：1 日は木曜、31 日は土曜
    const days = monthDays("2026-10-14");
    expect(days[0]).toBe("2026-09-27");
    expect(days.at(-1)).toBe("2026-10-31");
    expect(days).toHaveLength(35);
  });

  it("6 週になる月もある", () => {
    // 2026 年 8 月：1 日は土曜、31 日は月曜
    const days = monthDays("2026-08-01");
    expect(days[0]).toBe("2026-07-26");
    expect(days.at(-1)).toBe("2026-09-05");
    expect(days).toHaveLength(42);
  });

  it("週表示は日曜から土曜の 7 日。年をまたいでもよい", () => {
    expect(weekDays("2026-10-14")).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
    expect(weekDays("2026-12-31")[0]).toBe("2026-12-27");
    expect(weekDays("2026-12-31")[6]).toBe("2027-01-02");
  });

  it("前へ・次へ：月表示は前後の月の 1 日、週表示は 7 日前後", () => {
    expect(shiftDate("month", "2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDate("month", "2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftDate("week", "2026-12-30", 1)).toBe("2027-01-06");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("見出し", () => {
    expect(calendarTitle("month", "2026-10-14")).toBe("2026年10月");
    expect(calendarTitle("week", "2026-10-14")).toBe("2026年10月11日〜17日");
    expect(calendarTitle("week", "2026-09-30")).toBe("2026年9月27日〜10月3日");
    expect(calendarTitle("week", "2026-12-31")).toBe("2026年12月27日〜2027年1月2日");
    expect(dayLabel("2026-10-20")).toBe("10月20日（火）");
  });
});

describe("日ごとの振り分け", () => {
  const multi = ev("2026-10-13T03:00:00Z", "2026-10-15T01:00:00Z"); // 10/13 12:00〜10/15 10:00
  const allDay = ev("2026-10-13T15:00:00Z", "2026-10-14T14:59:59.999Z", { allDay: true }); // 10/14 終日
  const morning = ev("2026-10-14T00:00:00Z", "2026-10-14T01:00:00Z"); // 10/14 9:00〜10:00
  const night = ev("2026-10-14T14:00:00Z", "2026-10-14T14:30:00Z"); // 10/14 23:00〜23:30

  it("その日に一部でも重なるイベントを、終日・日をまたぐもの → 時刻のあるものの順に並べる", () => {
    const events = [night, morning, allDay, multi];
    expect(eventsOnDay(events, "2026-10-14").map((e) => e.id)).toEqual([
      multi.id,
      allDay.id,
      morning.id,
      night.id,
    ]);
    expect(eventsOnDay(events, "2026-10-13").map((e) => e.id)).toEqual([multi.id]);
    expect(eventsOnDay(events, "2026-10-15").map((e) => e.id)).toEqual([multi.id]);
    expect(eventsOnDay(events, "2026-10-16")).toEqual([]);
  });

  it("日本時間で日をまたぐかで判断する（UTC では同じ日でも）", () => {
    expect(isAllDayLike(multi)).toBe(true);
    expect(isAllDayLike(allDay)).toBe(true);
    expect(isAllDayLike(morning)).toBe(false);
    // UTC では 10/14 だが、日本時間では 10/14 23:00〜10/15 1:00
    expect(isAllDayLike(ev("2026-10-14T14:00:00Z", "2026-10-14T16:00:00Z"))).toBe(true);
  });
});

describe("週表示の時間軸での置き方", () => {
  const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 14, h - 9, m)).toISOString();

  it("開始・終了をその日の 0:00 からの分にする。長さ 0 は 30 分の高さにする", () => {
    const a = ev(at(9), at(10, 30));
    const deadline = ev(at(23, 59), at(23, 59));
    const placed = layoutTimedEvents([a, deadline], "2026-10-14");
    expect(placed.map((p) => [p.startMinute, p.endMinute])).toEqual([
      [540, 630],
      [1439, 1440],
    ]);
  });

  it("時刻が重なるものは横に並べ、重ならないものは 1 列のまま", () => {
    const a = ev(at(9), at(11));
    const b = ev(at(10), at(12));
    const c = ev(at(11), at(12)); // a が終わった列に入る
    const d = ev(at(13), at(14)); // 重なりがないので 1 列
    const placed = layoutTimedEvents([d, c, b, a], "2026-10-14");
    const byId = Object.fromEntries(placed.map((p) => [p.event.id, [p.column, p.columns]]));
    expect(byId[a.id]).toEqual([0, 2]);
    expect(byId[b.id]).toEqual([1, 2]);
    expect(byId[c.id]).toEqual([0, 2]);
    expect(byId[d.id]).toEqual([0, 1]);
  });

  it("終日・日をまたぐイベントは時間軸に置かない", () => {
    const multi = ev(at(22), at(26));
    expect(layoutTimedEvents([multi], "2026-10-14")).toEqual([]);
  });
});

describe("ステータスと注意表示の記号", () => {
  it.each([
    ["SCHEDULED", "2026-10-20T00:00:00Z", "", "scheduled", "予定"],
    ["IN_PROGRESS", "2026-10-20T00:00:00Z", "●", "inProgress", "進行中"],
    ["DONE", "2026-10-01T00:00:00Z", "✓", "done", "完了"],
    // 終了を過ぎて完了でない → 赤の「!」
    ["IN_PROGRESS", "2026-10-01T00:00:00Z", "!", "overdue", "進行中・終了済み・未完了"],
  ] as const)("%s（%s）→ 「%s」", (status, start, symbol, tone, label) => {
    const event = ev(start, start, { status });
    expect(calendarMark(event, now)).toEqual({ symbol, tone, label });
  });

  it("開始を過ぎて予定のまま → 黄の「▶」", () => {
    const event = ev("2026-10-14T00:00:00Z", "2026-10-14T05:00:00Z");
    expect(calendarMark(event, now)).toEqual({
      symbol: "▶",
      tone: "started",
      label: "予定・開始済み",
    });
  });
});
