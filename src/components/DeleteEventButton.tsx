"use client";

// 削除ボタン。確認ダイアログで「削除する」を選んだときだけ削除する（要件定義書 F-01）
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { ApiError, eventsApi } from "@/lib/api-client";

type Props = {
  eventId: number;
  title: string;
  /** 削除後に移る画面。省略すると今の画面を読み直す */
  redirectTo?: string;
  className?: string;
};

export function DeleteEventButton({ eventId, title, redirectTo, className = "button" }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 画面を離れても状態が残る（Cache Components）ので、隠れるときにダイアログを閉じる
  useLayoutEffect(() => {
    return () => {
      setOpen(false);
      setBusy(false);
    };
  }, []);

  async function handleConfirm() {
    setBusy(true);
    try {
      await eventsApi.remove(eventId);
      showToast(`「${title}」を削除しました`);
    } catch (error) {
      // すでに消えていた（別の画面で削除済み）なら、削除できたものとして扱う
      if (!(error instanceof ApiError && error.status === 404)) {
        showToast(error instanceof ApiError ? error.message : "削除できませんでした", "error");
        setBusy(false);
        setOpen(false);
        return;
      }
    }
    setBusy(false);
    setOpen(false);
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={`「${title}」を削除`}
      >
        削除
      </button>
      <ConfirmDialog
        open={open}
        title="イベントを削除しますか？"
        message={`「${title}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        danger
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
