import Link from "next/link";
import styles from "../../pages.module.css";

export default function EventNotFound() {
  return (
    <div className={styles.empty}>
      <p>イベントが見つかりません。削除されたか、URL が間違っている可能性があります。</p>
      <Link href="/" className="button">
        一覧へ戻る
      </Link>
    </div>
  );
}
