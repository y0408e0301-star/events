import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarMonth } from "@/components/CalendarMonth";
import { CalendarWeek } from "@/components/CalendarWeek";
import {
  calendarTitle,
  monthDays,
  parseCalendarQuery,
  shiftDate,
  weekDays,
  type CalendarView,
} from "@/lib/calendar";
import { toJstDateKey } from "@/lib/date";
import { listEvents } from "@/lib/events";
import pageStyles from "../pages.module.css";
import styles from "./calendar.module.css";

export const metadata: Metadata = { title: "カレンダー" };

/** カレンダー（要件定義書 F-07、5. 画面「カレンダー」）。表示の種類と日付は URL のクエリで決める */
export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<p className={pageStyles.loading}>読み込み中…</p>}>
      <Calendar searchParams={searchParams} />
    </Suspense>
  );
}

const calendarHref = (view: CalendarView, date: string) => `/calendar?view=${view}&date=${date}`;

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 「今日」と DB の読み取りはリクエストのたびに行う（ビルド時の事前描画に含めない）
  await connection();
  const now = new Date();
  const today = toJstDateKey(now);
  const { view, date } = parseCalendarQuery(await searchParams, now);
  const days = view === "month" ? monthDays(date) : weekDays(date);
  // 表示する範囲に一部でも重なるイベント（一覧の期間の絞り込みと同じ）
  const events = await listEvents({
    status: [],
    q: undefined,
    from: days[0],
    to: days[days.length - 1],
    sort: "startAt",
  });
  const unit = view === "month" ? "月" : "週";

  return (
    <>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}>{calendarTitle(view, date)}</h1>
        <Link href="/events/new" className="button button-primary">
          ＋ 新規作成
        </Link>
      </div>

      <div className={styles.toolbar}>
        <nav aria-label="表示する期間の移動" className={styles.moves}>
          <Link
            href={calendarHref(view, shiftDate(view, date, -1))}
            className="button button-small"
          >
            ← 前へ<span className="visually-hidden">（前の{unit}）</span>
          </Link>
          <Link href={calendarHref(view, today)} className="button button-small">
            今日
          </Link>
          <Link href={calendarHref(view, shiftDate(view, date, 1))} className="button button-small">
            次へ →<span className="visually-hidden">（次の{unit}）</span>
          </Link>
        </nav>
        <nav aria-label="表示の種類" className={styles.views}>
          <Link
            href={calendarHref("month", date)}
            className={styles.view}
            aria-current={view === "month" ? "page" : undefined}
          >
            月
          </Link>
          <Link
            href={calendarHref("week", date)}
            className={styles.view}
            aria-current={view === "week" ? "page" : undefined}
          >
            週
          </Link>
        </nav>
      </div>

      {view === "month" ? (
        <CalendarMonth days={days} date={date} today={today} events={events} now={now} />
      ) : (
        <CalendarWeek days={days} today={today} events={events} now={now} />
      )}

      <ul className={styles.legend} aria-label="記号の意味">
        <li>
          <span aria-hidden="true">✓</span> 完了
        </li>
        <li>
          <span aria-hidden="true">●</span> 進行中
        </li>
        <li>記号なし 予定</li>
        <li>
          <span aria-hidden="true" className={styles.overdue}>
            !
          </span>{" "}
          終了済み・未完了
        </li>
        <li>
          <span aria-hidden="true" className={styles.started}>
            ▶
          </span>{" "}
          開始済み
        </li>
      </ul>
    </>
  );
}
