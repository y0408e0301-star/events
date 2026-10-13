"use client";

import styles from "./pages.module.css";

// 読み込みに失敗したとき（DB に接続できないなど）
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.empty} role="alert">
      <p>読み込みに失敗しました。時間をおいてやり直してください。</p>
      <button type="button" className="button" onClick={reset}>
        もう一度読み込む
      </button>
    </div>
  );
}
