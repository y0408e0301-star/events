import Link from "next/link";
import { calendarMark, type CalendarEvent } from "@/lib/calendar";
import styles from "./Calendar.module.css";

type Props = {
  event: CalendarEvent;
  /** 注意表示の判定に使う今の時刻 */
  now: Date;
  /** タイトルの前に出す時刻（終日・日をまたぐものは出さない） */
  time?: string;
};

/**
 * カレンダーの中の 1 件。選ぶと詳細へ移る。
 * ステータスと注意表示は色と記号で示し、読み上げ用にはことばでも入れる（要件定義書 5. 画面「カレンダー」、N-07）
 */
export function CalendarEventLink({ event, now, time }: Props) {
  const mark = calendarMark(event, now);
  return (
    <Link
      href={`/events/${event.id}`}
      className={`${styles.event} ${styles[mark.tone]}`}
      title={`${time ? `${time} ` : ""}${event.title}（${mark.label}）`}
    >
      {mark.symbol && (
        <span className={styles.symbol} aria-hidden="true">
          {mark.symbol}
        </span>
      )}
      {time && <span className={styles.eventTime}>{time}</span>}
      <span className={styles.eventTitle}>{event.title}</span>
      <span className="visually-hidden">（{mark.label}）</span>
    </Link>
  );
}
