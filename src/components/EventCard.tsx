import Link from "next/link";
import type { Event } from "@/generated/prisma/client";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { StatusPicker } from "@/components/StatusPicker";
import { StatusWarningBadge } from "@/components/StatusWarningBadge";
import { formatDayJst, formatTimeRangeJst } from "@/lib/date";
import { statusWarning } from "@/lib/status";
import styles from "./EventCard.module.css";

type Props = {
  event: Event;
  /** 注意表示の判定に使う今の時刻 */
  now: Date;
  /** 日付の見出しの下でないとき（更新の新しい順など）は、時刻の前に日付も出す */
  showDate?: boolean;
};

/** 一覧の 1 件。日時・タイトル・場所・注意表示・ステータスの切り替えと、削除の入口 */
export function EventCard({ event, now, showDate = false }: Props) {
  const warning = statusWarning(event, now);

  return (
    <article className={styles.card}>
      <p className={styles.time}>
        {showDate && <span className={styles.date}>{formatDayJst(event.startAt)}</span>}
        {formatTimeRangeJst(event)}
      </p>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        {event.location && <p className={styles.location}>{event.location}</p>}
      </div>
      <div className={styles.side}>
        <span className={styles.status}>
          {warning && <StatusWarningBadge warning={warning} />}
          <StatusPicker eventId={event.id} title={event.title} status={event.status} />
        </span>
        <DeleteEventButton eventId={event.id} title={event.title} className="button button-small" />
      </div>
    </article>
  );
}
