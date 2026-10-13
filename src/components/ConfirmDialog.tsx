"use client";

// 削除や入力の破棄の前に確かめるダイアログ。<dialog> の showModal で、背景の操作を止めてフォーカスを閉じ込める
import { useEffect, useId, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** 取り消せない操作なら赤いボタンにする */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Esc キーで閉じたときも onCancel を通す
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        {/* 取り消せない操作では、うっかり Enter で実行しないよう「キャンセル」に最初のフォーカスを置く */}
        <button type="button" className="button" onClick={onCancel} disabled={busy} autoFocus>
          キャンセル
        </button>
        <button
          type="button"
          className={danger ? "button button-danger" : "button button-primary"}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "処理中…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
