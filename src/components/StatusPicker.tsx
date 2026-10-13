"use client";

// 一覧のカード上でステータスを切り替えて、その場で保存する（要件定義書 F-03）
import { useRouter } from "next/navigation";
import { useId, useOptimistic, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { ApiError, eventsApi } from "@/lib/api-client";
import { EVENT_STATUSES, STATUS_LABELS, type EventStatus } from "@/lib/schema";
import styles from "./StatusPicker.module.css";

type Props = { eventId: number; title: string; status: EventStatus };

export function StatusPicker({ eventId, title, status }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const id = useId();
  // 保存して一覧を読み直すまでは選んだ値を見せ、失敗したら自動で元に戻る
  const [value, setOptimisticValue] = useOptimistic(status);
  const [saving, startTransition] = useTransition();

  function handleChange(next: EventStatus) {
    startTransition(async () => {
      setOptimisticValue(next);
      try {
        await eventsApi.updateStatus(eventId, next);
      } catch (error) {
        showToast(
          error instanceof ApiError ? error.message : "ステータスを変更できませんでした",
          "error",
        );
        return;
      }
      showToast(`「${title}」を${STATUS_LABELS[next]}にしました`);
      // 注意表示はサーバーで計算しているので、一覧を読み直す
      router.refresh();
    });
  }

  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        「{title}」のステータス
      </label>
      <select
        id={id}
        className={`${styles.select} ${styles[value]}`}
        value={value}
        onChange={(e) => handleChange(e.target.value as EventStatus)}
        disabled={saving}
        aria-busy={saving}
      >
        {EVENT_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </>
  );
}
