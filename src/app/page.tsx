import Link from "next/link";
import { Suspense } from "react";
import { EventFilters, type FilterValues } from "@/components/EventFilters";
import { EventList } from "@/components/EventList";
import { normalizeSearchParams, parseListQuery } from "@/lib/list-query";
import styles from "./pages.module.css";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>イベント</h1>
        <Link href="/events/new" className="button button-primary">
          ＋ 新規作成
        </Link>
      </div>
      <Suspense fallback={<p className={styles.loading}>読み込み中…</p>}>
        <FilteredEventList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FilteredEventList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const normalized = normalizeSearchParams(params);
  const result = parseListQuery(params);

  // フォームには、URL に書かれた値をそのまま出す（正しくない値も、直せるように残す）
  const values: FilterValues = {
    status: result.success ? result.data.status : [],
    from: normalized.from ?? "",
    to: normalized.to ?? "",
    q: normalized.q ?? "",
    sort: result.success ? result.data.sort : (normalized.sort ?? "startAt"),
  };
  const errors = result.success ? [] : result.error.issues.map((issue) => issue.message);
  // 条件が変わったら（「クリア」など）入力欄も作り直す
  const key = new URLSearchParams(normalized).toString();

  return (
    <>
      <EventFilters key={key} values={values} errors={errors} />
      {result.success && <EventList query={result.data} />}
    </>
  );
}
