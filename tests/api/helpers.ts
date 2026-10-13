// Route Handler をテストから直接呼ぶための小さな道具
import * as collection from "@/app/api/events/route";
import * as item from "@/app/api/events/[id]/route";
import * as status from "@/app/api/events/[id]/status/route";

const BASE = "http://localhost:3000/api/events";

function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ctx = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });

export const api = {
  list: (query = "") => collection.GET(new Request(`${BASE}${query ? `?${query}` : ""}`)),
  create: (body: unknown) => collection.POST(jsonRequest(BASE, "POST", body)),
  get: (id: string | number) => item.GET(new Request(`${BASE}/${id}`), ctx(id)),
  update: (id: string | number, body: unknown) =>
    item.PUT(jsonRequest(`${BASE}/${id}`, "PUT", body), ctx(id)),
  remove: (id: string | number) =>
    item.DELETE(new Request(`${BASE}/${id}`, { method: "DELETE" }), ctx(id)),
  setStatus: (id: string | number, body: unknown) =>
    status.PATCH(jsonRequest(`${BASE}/${id}/status`, "PATCH", body), ctx(id)),
};

/** 必須項目がそろった作成用の本文 */
export function eventBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "ゼミ発表",
    description: "スライド 10 枚",
    location: "3 号館 201",
    startAt: "2026-10-20T13:00:00+09:00",
    endAt: "2026-10-20T14:30:00+09:00",
    allDay: false,
    status: "SCHEDULED",
    ...overrides,
  };
}

/** イベントを作って、返ってきた JSON を返す */
export async function createEvent(overrides: Record<string, unknown> = {}) {
  const res = await api.create(eventBody(overrides));
  if (res.status !== 201) {
    throw new Error(`作成に失敗しました: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: number; title: string; startAt: string; endAt: string };
}
