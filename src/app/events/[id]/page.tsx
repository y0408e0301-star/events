import Link from "next/link";
import { Suspense } from "react";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTimeJst, formatEventPeriodJst } from "@/lib/date";
import styles from "../../pages.module.css";
import detailStyles from "./detail.module.css";
import { loadEvent } from "./load-event";

export default function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  return (
    <>
      <Link href="/" className={styles.back}>
        ← 一覧へ戻る
      </Link>
      <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
        <EventDetail params={params} />
      </Suspense>
    </>
  );
}

async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const event = await loadEvent(params);

  return (
    <>
      <title>{`${event.title} | イベント・予定管理`}</title>
      <div className={styles.header}>
        <h1 className={styles.title}>{event.title}</h1>
        <div className={styles.actions}>
          <Link href={`/events/${event.id}/edit`} className="button">
            編集
          </Link>
          <DeleteEventButton eventId={event.id} title={event.title} redirectTo="/" />
        </div>
      </div>
      <dl className={detailStyles.list}>
        <dt>日時</dt>
        <dd>{formatEventPeriodJst(event)}</dd>
        <dt>ステータス</dt>
        <dd>
          <StatusBadge status={event.status} />
        </dd>
        <dt>場所</dt>
        <dd>{event.location ?? <span className={detailStyles.none}>なし</span>}</dd>
        <dt>メモ</dt>
        <dd className={detailStyles.description}>
          {event.description ?? <span className={detailStyles.none}>なし</span>}
        </dd>
        <dt>作成日時</dt>
        <dd>{formatDateTimeJst(event.createdAt)}</dd>
        <dt>更新日時</dt>
        <dd>{formatDateTimeJst(event.updatedAt)}</dd>
      </dl>
    </>
  );
}
