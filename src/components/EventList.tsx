import Link from "next/link";
import { connection } from "next/server";
import { EventCard } from "@/components/EventCard";
import { formatDayJst, groupByStartDayJst } from "@/lib/date";
import { listEvents } from "@/lib/events";
import { listQuerySchema } from "@/lib/schema";
import pageStyles from "@/app/pages.module.css";
import styles from "./EventList.module.css";

/** 一覧（要件定義書 5. 画面）。開始日ごとの見出しの下に並べる */
export async function EventList() {
  // DB の読み取りはリクエストのたびに行う（ビルド時の事前描画に含めない）
  await connection();
  const events = await listEvents(listQuerySchema.parse({}));
  // 注意表示（開始済み・終了済み）は、読み込んだときの時刻で判定する
  const now = new Date();

  if (events.length === 0) {
    return (
      <div className={pageStyles.empty}>
        <p>イベントはありません。</p>
        <Link href="/events/new" className="button button-primary">
          ＋ 新規作成
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.list}>
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
