import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventForm } from "@/components/EventForm";
import { defaultFormValues } from "@/lib/form-values";
import styles from "../../pages.module.css";

export const metadata: Metadata = { title: "イベントを作成" };

export default function NewEventPage() {
  return (
    <>
      <Link href="/" className={styles.back}>
        ← 一覧へ戻る
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>イベントを作成</h1>
      </div>
      <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
        <NewEventForm />
      </Suspense>
    </>
  );
}

async function NewEventForm() {
  // 初期値の日時は「今」から決めるので、ビルド時ではなくリクエストのたびに作る
  await connection();
  return <EventForm mode="create" initialValues={defaultFormValues(new Date())} />;
}
