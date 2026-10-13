import Link from "next/link";
import { connection } from "next/server";
import { EventCard } from "@/components/EventCard";
import { formatDayJst, groupByStartDayJst } from "@/lib/date";
import { listEvents } from "@/lib/events";
import { hasFilters, SORT_LABELS } from "@/lib/list-query";
import type { ListQuery } from "@/lib/schema";
import pageStyles from "@/app/pages.module.css";
import styles from "./EventList.module.css";

/** 一覧（要件定義書 5. 画面）。開始日時順なら開始日ごとの見出しの下に並べる */
export async function EventList({ query }: { query: ListQuery }) {
  // DB の読み取りはリクエストのたびに行う（ビルド時の事前描画に含めない）
  await connection();
  const events = await listEvents(query);
  // 注意表示（開始済み・終了済み）は、読み込んだときの時刻で判定する
  const now = new Date();
  const filtered = hasFilters(query);

  if (events.length === 0) {
    return (
      <div className={pageStyles.empty}>
        {filtered ? (
          <>
            <p>条件に合うイベントはありません。</p>
            <Link href="/" className="button">
              条件をクリア
            </Link>
          </>
        ) : (
          <>
            <p>イベントはありません。</p>
            <Link href="/events/new" className="button button-primary">
              ＋ 新規作成
            </Link>
          </>
        )}
      </div>
    );
  }

  const count = (
    <p className={styles.count}>
      {filtered ? `条件に合うイベント ${events.length} 件` : `${events.length} 件`}（
      {SORT_LABELS[query.sort]}）
    </p>
  );

  // 更新の新しい順では日付がばらばらになるので、見出しでまとめずに各イベントに日付を出す
  if (query.sort === "-updatedAt") {
    return (
      <div className={styles.list}>
        {count}
        <ul className={styles.events}>
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} now={now} showDate />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {count}
      {groupByStartDayJst(events).map((group) => (
        <section key={group.id} aria-labelledby={`day-${group.id}`}>
          <h2 id={`day-${group.id}`} className={styles.day}>
            {formatDayJst(group.date)}
          </h2>
          <ul className={styles.events}>
            {group.items.map((event) => (
              <li key={event.id}>
                <EventCard event={event} now={now} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
