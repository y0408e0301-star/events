// 日時の計算をまとめる。DB は UTC、画面と日付の区切りは日本時間（Asia/Tokyo、UTC+9・夏時間なし）
// 要件定義書 N-05。表示の書式も実行環境のタイムゾーンや ICU に左右されないよう、ここで自前で組み立てる

const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 日本時間でその日の 0:00 */
export function startOfDayJst(date: Date): Date {
  const jst = date.getTime() + JST_OFFSET_MS;
  return new Date(Math.floor(jst / DAY_MS) * DAY_MS - JST_OFFSET_MS);
}

/** 日本時間でその日の 23:59:59.999 */
export function endOfDayJst(date: Date): Date {
  return new Date(startOfDayJst(date).getTime() + DAY_MS - 1);
}

/** "2026-10-20" を日本時間のその日の 0:00 として読む */
export function parseDateJst(value: string): Date {
  return new Date(`${value}T00:00:00+09:00`);
}

/** 日本時間での年・月・日・曜日・時・分 */
function jstParts(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
    weekday: WEEKDAYS[jst.getUTCDay()],
    hour: jst.getUTCHours(),
    minute: jst.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026-10-20（日本時間の日付。並べ替えやグループのキー、date 入力の値） */
export function toJstDateKey(date: Date): string {
  const p = jstParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** 13:00（time 入力の値） */
export function toJstTime(date: Date): string {
  const p = jstParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** 10月20日（火） */
export function formatDayJst(date: Date): string {
  const p = jstParts(date);
  return `${p.month}月${p.day}日（${p.weekday}）`;
}

/** 2026年10月20日（火） */
export function formatFullDayJst(date: Date): string {
  return `${jstParts(date).year}年${formatDayJst(date)}`;
}

/** 2026年10月20日（火）13:00 */
export function formatDateTimeJst(date: Date): string {
  return `${formatFullDayJst(date)} ${toJstTime(date)}`;
}

type TimeRange = { startAt: Date; endAt: Date; allDay: boolean };

const sameDay = (a: Date, b: Date) => toJstDateKey(a) === toJstDateKey(b);

/**
 * 一覧で開始日の見出しの下に出す時刻。
 * 「13:00〜14:30」「23:59」「終日」「終日（10月26日（月）まで）」「13:00〜10月21日（水）9:00」
 */
export function formatTimeRangeJst({ startAt, endAt, allDay }: TimeRange): string {
  if (allDay) {
    return sameDay(startAt, endAt) ? "終日" : `終日（${formatDayJst(endAt)}まで）`;
  }
  const start = toJstTime(startAt);
  if (startAt.getTime() === endAt.getTime()) {
    return start;
  }
  const end = sameDay(startAt, endAt)
    ? toJstTime(endAt)
    : `${formatDayJst(endAt)} ${toJstTime(endAt)}`;
  return `${start}〜${end}`;
}

/** 詳細画面の日時。「2026年10月20日（火）13:00〜14:30」「2026年10月25日（日）〜10月26日（月）終日」など */
export function formatEventPeriodJst({ startAt, endAt, allDay }: TimeRange): string {
  const day = formatFullDayJst(startAt);
  if (allDay) {
    return sameDay(startAt, endAt) ? `${day} 終日` : `${day}〜${formatDayJst(endAt)} 終日`;
  }
  return `${day} ${formatTimeRangeJst({ startAt, endAt, allDay })}`;
}

/**
 * 開始日（日本時間）が続くものをまとめる。順番は渡された順のまま。
 * 開始日時順でない並べ方では同じ日が離れて 2 回出ることがあるので、id は通し番号を含める
 */
export function groupByStartDayJst<T extends { startAt: Date }>(items: T[]) {
  const groups: { id: string; day: string; date: Date; items: T[] }[] = [];
  for (const item of items) {
    const day = toJstDateKey(item.startAt);
    const last = groups.at(-1);
    if (last?.day === day) {
      last.items.push(item);
    } else {
      groups.push({ id: `${day}-${groups.length}`, day, date: item.startAt, items: [item] });
    }
  }
  return groups;
}
