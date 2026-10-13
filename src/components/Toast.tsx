"use client";

// 保存・削除の結果を画面上部に出すメッセージ。レイアウトに置くので、画面を移っても消えない
import { createContext, useCallback, useContext, useRef, useState } from "react";
import styles from "./Toast.module.css";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast | null>(null);

const HIDE_AFTER_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (message, kind = "success") => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, kind, message }]);
      // エラーは読み落とさないよう、閉じるまで残す
      if (kind === "success") {
        setTimeout(() => dismiss(id), HIDE_AFTER_MS);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* 読み上げソフトに伝わるよう、領域は常に置いておき、中身だけ入れ替える */}
      <div className={styles.region} role="status" aria-live="polite">
        {items
          .filter((item) => item.kind === "success")
          .map((item) => (
            <ToastMessage key={item.id} item={item} onClose={dismiss} />
          ))}
      </div>
      <div className={styles.region} role="alert" aria-live="assertive">
        {items
          .filter((item) => item.kind === "error")
          .map((item) => (
            <ToastMessage key={item.id} item={item} onClose={dismiss} />
          ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  return (
    <div className={`${styles.toast} ${styles[item.kind]}`}>
      <span>{item.message}</span>
      <button
        type="button"
        className={styles.close}
        aria-label="メッセージを閉じる"
        onClick={() => onClose(item.id)}
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error("useToast は ToastProvider の中で使ってください");
  }
  return show;
}
