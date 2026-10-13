import Link from "next/link";
import type { Event } from "@/generated/prisma/client";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTimeRangeJst } from "@/lib/date";
import styles from "./EventCard.module.css";

/** 一覧の 1 件。日時・タイトル・場所・ステータスと、削除の入口 */
export function EventCard({ event }: { event: Event }) {
  return (
    <article className={styles.card}>
      <p className={styles.time}>{formatTimeRangeJst(event)}</p>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        {event.location && <p className={styles.location}>{event.location}</p>}
      </div>
      <div className={styles.side}>
        <StatusBadge status={event.status} />
        <DeleteEventButton eventId={event.id} title={event.title} className="button button-small" />
      </div>
    </article>
  );
}
