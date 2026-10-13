import Link from "next/link";
import { Suspense } from "react";
import { EventList } from "@/components/EventList";
import styles from "./pages.module.css";

export default function Home() {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>イベント</h1>
        <Link href="/events/new" className="button button-primary">
          ＋ 新規作成
        </Link>
      </div>
      <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
        <EventList />
      </Suspense>
    </>
  );
}
