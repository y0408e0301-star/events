import type { APIRequestContext, Page } from "@playwright/test";

/** 今日から days 日後の日付（日本時間、YYYY-MM-DD） */
export function jstDate(days = 0): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/** API でイベントをすべて消す（テストの前に呼ぶ） */
export async function deleteAllEvents(request: APIRequestContext) {
  const res = await request.get("/api/events");
  const { events } = (await res.json()) as { events: { id: number }[] };
  for (const event of events) {
    await request.delete(`/api/events/${event.id}`);
  }
}

/** API でイベントを作る（画面の操作の前提を用意する） */
export async function createEvent(request: APIRequestContext, data: Record<string, unknown>) {
  const res = await request.post("/api/events", { data });
  if (res.status() !== 201) {
    throw new Error(`作成に失敗しました: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { id: number };
}

/**
 * 表示中の入力欄をラベルで探す。
 * Next.js（Cache Components）は前に開いた画面を隠して残すので、隠れている同じ名前の入力欄を除く
 */
export function field(page: Page, label: string | RegExp) {
  return page.getByLabel(label).filter({ visible: true });
}
