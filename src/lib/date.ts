// 日時の計算をまとめる。DB は UTC、画面と日付の区切りは日本時間（Asia/Tokyo、UTC+9・夏時間なし）
// 要件定義書 N-05

const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

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
