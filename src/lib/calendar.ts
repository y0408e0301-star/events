// カレンダー表示（要件定義書 F-07、5. 画面「カレンダー」）の日付の計算とイベントの置き方。
// 日付は日本時間の "2026-10-20" の形（toJstDateKey）で扱う。日本時間に夏時間はないので、1 日 = 24 時間で足し引きできる
import { z } from "zod";
import { endOfDayJst, parseDateJst, startOfDayJst, toJstDateKey } from "@/lib/date";
import { STATUS_LABELS, type EventStatus } from "@/lib/schema";
import { statusWarning, WARNING_LABELS } from "@/lib/status";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export type CalendarView = "month" | "week";

const dateKeySchema = z.iso.date();
const calendarQuerySchema = z.object({
  view: z.enum(["month", "week"]).default("month"),
  date: dateKeySchema.optional(),
});

/**
 * URL のクエリ（?view=week&date=2026-10-20）から、表示の種類と基準の日付を決める。
 * 正しくない値のときは今日の月表示にする（要件定義書 5. 画面「カレンダー」）
 */
export function parseCalendarQuery(
  params: Record<string, string | string[] | undefined>,
  now: Date,
): { view: CalendarView; date: string } {
  const result = calendarQuerySchema.safeParse({
    view: typeof params.view === "string" ? params.view : undefined,
    date: typeof params.date === "string" ? params.date : undefined,
  });
  if (!result.success) {
    return { view: "month", date: toJstDateKey(now) };
  }
  return { view: result.data.view, date: result.data.date ?? toJstDateKey(now) };
}

/** 作成フォームの ?date=2026-10-20 を読む。正しくなければ undefined */
export function parseDateParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && dateKeySchema.safeParse(value).success ? value : undefined;
}

/** 日付に n 日を足す */
export function addDays(key: string, days: number): string {
  return toJstDateKey(new Date(parseDateJst(key).getTime() + days * DAY_MS));
}

/** 日付の年・月・日・曜日（0 = 日曜） */
function keyParts(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  // 日付だけの計算なので UTC の暦で曜日を求める（タイムゾーンに左右されない）
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** その日を含む週の日曜日 */
function startOfWeek(key: string): string {
  return addDays(key, -keyParts(key).weekday);
}

/** 月表示の範囲：その月の 1 日を含む週の日曜から、末日を含む週の土曜まで（4〜6 週） */
export function monthDays(key: string): string[] {
  const { year, month } = keyParts(key);
  const first = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${pad(month)}-${pad(lastDay)}`;
  const days: string[] = [];
  const end = addDays(startOfWeek(last), 6);
  for (let day = startOfWeek(first); day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** 週表示の範囲：その日を含む週の日曜から土曜までの 7 日 */
export function weekDays(key: string): string[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 前へ・次へで移る先の基準の日付。月表示は前後の月の 1 日、週表示は 7 日前後 */
export function shiftDate(view: CalendarView, key: string, direction: -1 | 1): string {
  if (view === "week") {
    return addDays(key, 7 * direction);
  }
  const { year, month } = keyParts(key);
  const shifted = new Date(Date.UTC(year, month - 1 + direction, 1));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-01`;
}

/** 基準の日付と同じ月か（月表示で前後の月の日を薄く出すため） */
export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** 見出し。月表示「2026年10月」、週表示「2026年10月18日〜24日」（月や年をまたぐときは後ろにも付ける） */
export function calendarTitle(view: CalendarView, key: string): string {
  const { year, month } = keyParts(key);
  if (view === "month") {
    return `${year}年${month}月`;
  }
  const days = weekDays(key);
  const s = keyParts(days[0]);
  const e = keyParts(days[6]);
  const end =
    s.year !== e.year
      ? `${e.year}年${e.month}月${e.day}日`
      : s.month !== e.month
        ? `${e.month}月${e.day}日`
        : `${e.day}日`;
  return `${s.year}年${s.month}月${s.day}日〜${end}`;
}

/** 曜日の見出し（日〜土） */
export const WEEKDAY_LABELS = WEEKDAYS;

/** 日付の数字と曜日。「20」「10月20日（火）」 */
export function dayNumber(key: string): number {
  return keyParts(key).day;
}

export function dayLabel(key: string): string {
  const { month, day, weekday } = keyParts(key);
  return `${month}月${day}日（${WEEKDAYS[weekday]}）`;
}

export type CalendarEvent = {
  id: number;
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  status: EventStatus;
};

/** 終日のイベントか、時刻があっても日本時間で日をまたぐイベント（週表示では上の段に置く） */
export function isAllDayLike(event: CalendarEvent): boolean {
  return event.allDay || toJstDateKey(event.startAt) !== toJstDateKey(event.endAt);
}

/** その日（日本時間）に一部でも重なるか */
function overlapsDay(event: CalendarEvent, key: string): boolean {
  const day = parseDateJst(key);
  return event.startAt.getTime() <= endOfDayJst(day).getTime() && event.endAt >= day;
}

/** その日に重なるイベント。終日・日をまたぐもの → 時刻のあるものの順で、それぞれ開始の早い順 */
export function eventsOnDay<T extends CalendarEvent>(events: T[], key: string): T[] {
  return events
    .filter((event) => overlapsDay(event, key))
    .sort(
      (a, b) =>
        Number(isAllDayLike(b)) - Number(isAllDayLike(a)) ||
        a.startAt.getTime() - b.startAt.getTime() ||
        a.id - b.id,
    );
}

export type TimedPlacement<T> = {
  event: T;
  /** その日の 0:00 からの分（0〜1440） */
  startMinute: number;
  endMinute: number;
  /** 重なるイベントを横に並べたときの列（0 始まり）と列の数 */
  column: number;
  columns: number;
};

/** 長さが 0 の締め切りなども見えるよう、時間軸の上では最低 30 分の高さにする */
const MIN_MINUTES = 30;

/**
 * 週表示の時間軸に置く、時刻のあるイベント（日をまたがないもの）の位置。
 * 時刻が重なるもの同士を 1 つのまとまりにし、まとまりの中で空いている列に順に入れる
 */
export function layoutTimedEvents<T extends CalendarEvent>(
  events: T[],
  key: string,
): TimedPlacement<T>[] {
  const dayStart = startOfDayJst(parseDateJst(key)).getTime();
  const items = eventsOnDay(events, key)
    .filter((event) => !isAllDayLike(event))
    .map((event) => {
      const startMinute = Math.round((event.startAt.getTime() - dayStart) / 60000);
      const endMinute = Math.min(
        24 * 60,
        Math.max(startMinute + MIN_MINUTES, Math.round((event.endAt.getTime() - dayStart) / 60000)),
      );
      return { event, startMinute, endMinute, column: 0, columns: 1 };
    });

  let cluster: TimedPlacement<T>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    for (const item of cluster) item.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };
  for (const item of items) {
    if (item.startMinute >= clusterEnd) {
      closeCluster();
    }
    let column = columnEnds.findIndex((end) => end <= item.startMinute);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMinute);
    } else {
      columnEnds[column] = item.endMinute;
    }
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMinute);
  }
  closeCluster();
  return items;
}

export type CalendarMark = {
  /** 画面に出す記号（予定で注意表示がないときは空） */
  symbol: string;
  /** 色分けの種類 */
  tone: "scheduled" | "inProgress" | "done" | "overdue" | "started";
  /** 読み上げ用。「予定・終了済み・未完了」など */
  label: string;
};

/** ステータスと注意表示を、色と記号で示すための情報（注意表示があればそちらの記号を出す） */
export function calendarMark(event: CalendarEvent, now: Date): CalendarMark {
  const warning = statusWarning(event, now);
  const status = STATUS_LABELS[event.status];
  if (warning) {
    return {
      symbol: warning === "overdue" ? "!" : "▶",
      tone: warning,
      label: `${status}・${WARNING_LABELS[warning]}`,
    };
  }
  const byStatus = {
    SCHEDULED: { symbol: "", tone: "scheduled" },
    IN_PROGRESS: { symbol: "●", tone: "inProgress" },
    DONE: { symbol: "✓", tone: "done" },
  } as const;
  return { ...byStatus[event.status], label: status };
}
