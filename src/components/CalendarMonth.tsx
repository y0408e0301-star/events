import Link from "next/link";
import { CalendarEventLink } from "@/components/CalendarEventLink";
import {
  dayLabel,
  dayNumber,
  eventsOnDay,
  isAllDayLike,
  isSameMonth,
  WEEKDAY_LABELS,
  type CalendarEvent,
} from "@/lib/calendar";
import { toJstTime } from "@/lib/date";
import styles from "./Calendar.module.css";

/** 1 日に出すイベントの数。残りは「ほか N 件」にする */
const MAX_EVENTS_PER_DAY = 3;

type Props = {
  /** 表示する日（日曜始まりで 7 の倍数） */
  days: string[];
  /** 基準の日付（この月の日だけを濃く出す） */
  date: string;
  today: string;
  events: CalendarEvent[];
  now: Date;
};

/** 月表示（要件定義書 5. 画面「カレンダー」） */
export function CalendarMonth({ days, date, today, events, now }: Props) {
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  return (
    <table className={styles.month}>
      <thead>
        <tr>
          {WEEKDAY_LABELS.map((weekday) => (
            <th key={weekday} scope="col" className={styles.weekday}>
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((day) => (
              <MonthDay
                key={day}
                day={day}
                inMonth={isSameMonth(day, date)}
                isToday={day === today}
                events={eventsOnDay(events, day)}
                now={now}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthDay({
  day,
  inMonth,
  isToday,
  events,
  now,
}: {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  now: Date;
}) {
  const label = dayLabel(day);
  // 日付の数字と「ほか N 件」は、その日で絞り込んだ一覧へ
  const listHref = `/?from=${day}&to=${day}`;
  const shown = events.slice(0, MAX_EVENTS_PER_DAY);
  const rest = events.length - shown.length;
  const className = [styles.day, !inMonth && styles.otherMonth, isToday && styles.today]
    .filter(Boolean)
    .join(" ");

  return (
    <td className={className} aria-current={isToday ? "date" : undefined}>
      <div className={styles.dayHeader}>
        <Link href={listHref} className={styles.dayNumber} aria-label={`${label}の一覧`}>
          {dayNumber(day)}
        </Link>
        <Link
          href={`/events/new?view=month&date=${day}`}
          className={styles.add}
          aria-label={`${label}に作成`}
        >
          +
        </Link>
      </div>
      {events.length > 0 && (
        <>
          <ul className={styles.dayEvents} aria-label={label}>
            {shown.map((event) => (
              <li key={event.id}>
                <CalendarEventLink
                  event={event}
                  now={now}
                  time={isAllDayLike(event) ? undefined : toJstTime(event.startAt)}
                />
              </li>
            ))}
          </ul>
          {rest > 0 && (
            <Link href={listHref} className={styles.more}>
              ほか {rest} 件
            </Link>
          )}
          {/* スマートフォンの幅では、イベントの代わりに件数だけを出す */}
          <Link
            href={listHref}
            className={styles.count}
            aria-label={`${label}のイベント ${events.length} 件`}
          >
            {events.length} 件
          </Link>
        </>
      )}
    </td>
  );
}
