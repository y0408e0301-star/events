import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventForm } from "@/components/EventForm";
import { parseDateParam } from "@/lib/calendar";
import { defaultFormValues } from "@/lib/form-values";
import styles from "../../pages.module.css";

export const metadata: Metadata = { title: "イベントを作成" };

export default function NewEventPage({ searchParams }: PageProps<"/events/new">) {
  return (
    <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
      <NewEvent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewEvent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 初期値の日時は「今」から決めるので、ビルド時ではなくリクエストのたびに作る
  await connection();
  const params = await searchParams;
  // カレンダーの日付の「＋」から開いたとき（?date=2026-10-20&view=week）は、その日を入れてカレンダーへ戻れるようにする
  const date = parseDateParam(params.date);
  const view = params.view === "week" ? "week" : "month";
  const backHref = date ? `/calendar?view=${view}&date=${date}` : "/";

  return (
    <>
      <Link href={backHref} className={styles.back}>
        {date ? "← カレンダーへ戻る" : "← 一覧へ戻る"}
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>イベントを作成</h1>
      </div>
      <EventForm
        mode="create"
        initialValues={defaultFormValues(new Date(), date)}
        backHref={backHref}
      />
    </>
  );
}
