import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EventForm } from "@/components/EventForm";
import { toFormValues } from "@/lib/form-values";
import styles from "../../../pages.module.css";
import { loadEvent } from "../load-event";

export const metadata: Metadata = { title: "イベントを編集" };

export default function EditEventPage({ params }: PageProps<"/events/[id]/edit">) {
  return (
    <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
      <EditEvent params={params} />
    </Suspense>
  );
}

async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const event = await loadEvent(params);
  return (
    <>
      <Link href={`/events/${event.id}`} className={styles.back}>
        ← 詳細へ戻る
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>イベントを編集</h1>
      </div>
      {/* 別の画面で更新されていたら、古い入力を残さずフォームを作り直す */}
      <EventForm
        key={event.updatedAt.getTime()}
        mode="edit"
        eventId={event.id}
        initialValues={toFormValues(event)}
      />
    </>
  );
}
