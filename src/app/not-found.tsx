import Link from "next/link";
import styles from "./pages.module.css";

export default function NotFound() {
  return (
    <div className={styles.empty}>
      <p>ページが見つかりません。</p>
      <Link href="/" className="button">
        一覧へ戻る
      </Link>
    </div>
  );
}
