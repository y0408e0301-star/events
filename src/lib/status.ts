// ステータスの提案と注意表示（要件定義書 3. 機能要件「ステータスの自動の提案と注意表示」）。
// 保存するのは利用者が選んだ値だけで、ここで計算した値は表示にだけ使う
import type { EventStatus } from "@/lib/schema";

type Period = { startAt: Date; endAt: Date };

/** 今の時刻から自然なステータス：開始前＝予定、開始〜終了＝進行中、終了後＝完了 */
export function suggestStatus({ startAt, endAt }: Period, now: Date): EventStatus {
  if (now.getTime() < startAt.getTime()) return "SCHEDULED";
  if (now.getTime() <= endAt.getTime()) return "IN_PROGRESS";
  return "DONE";
}

export type StatusWarning = "overdue" | "started";

export const WARNING_LABELS: Record<StatusWarning, string> = {
  overdue: "終了済み・未完了",
  started: "開始済み",
};

/**
 * 保存したステータスが提案とずれているときの注意。
 * 終了を過ぎて完了でない → overdue（赤）、開始を過ぎて予定のまま → started（黄）。両方当てはまるときは赤だけ
 */
export function statusWarning(
  event: Period & { status: EventStatus },
  now: Date,
): StatusWarning | null {
  if (now.getTime() > event.endAt.getTime() && event.status !== "DONE") return "overdue";
  if (now.getTime() >= event.startAt.getTime() && event.status === "SCHEDULED") return "started";
  return null;
}
