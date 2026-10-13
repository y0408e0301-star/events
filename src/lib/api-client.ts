// 画面（ブラウザ）から API を呼ぶ。失敗したら、利用者に見せられるメッセージを持つ ApiError を投げる
import type { EventPayload, EventStatus } from "@/lib/schema";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "サーバーにつながりませんでした。通信状態を確かめてやり直してください");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    throw new ApiError(
      res.status,
      body?.message ?? `エラーが起きました（${res.status}）。時間をおいてやり直してください`,
      body?.errors ?? {},
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

type Saved = { id: number };

export const eventsApi = {
  create: (payload: EventPayload) =>
    request<Saved>("/api/events", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: EventPayload) =>
    request<Saved>(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateStatus: (id: number, status: EventStatus) =>
    request<Saved>(`/api/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: number) => request<void>(`/api/events/${id}`, { method: "DELETE" }),
};
