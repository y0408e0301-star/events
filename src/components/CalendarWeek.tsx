import Link from "next/link";
import { CalendarEventLink } from "@/components/CalendarEventLink";
import { CalendarScroll } from "@/components/CalendarScroll";
import {
  dayLabel,
  dayNumber,
  eventsOnDay,
  isAllDayLike,
  layoutTimedEvents,
  WEEKDAY_LABELS,
  type CalendarEvent,
} from "@/lib/calendar";
import { formatTimeRangeJst, toJstTime } from "@/lib/date";
import styles from "./Calendar.module.css";

/** 時間軸の 1 時間の高さ（px）。Calendar.module.css の --hour と合わせる */
const HOUR_PX = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

type Props = {
  /** 日曜から土曜の 7 日 */
  days: string[];
  today: string;
  events: CalendarEvent[];
  now: Date;
};

/**
 * 週表示（要件定義書 5. 画面「カレンダー」）。
 * 広い画面では時間軸の上に置き、スマートフォンの幅では日ごとの縦の一覧にする（CSS で出し分ける）
 */
export function CalendarWeek({ days, today, events, now }: Props) {
  return (
    <>
      <div className={styles.week}>
        <div className={styles.weekRow}>
          <div className={styles.gutter} />
          {days.map((day, i) => (
            <div
              key={day}
              className={`${styles.weekDayHeader} ${day === today ? styles.today : ""}`}
              aria-current={day === today ? "date" : undefined}
            >
              <Link
                href={`/?from=${day}&to=${day}`}
                className={styles.dayNumber}
                aria-label={`${dayLabel(day)}の一覧`}
              >
                {dayNumber(day)}（{WEEKDAY_LABELS.at(i)}）
              </Link>
              <Link
                href={`/events/new?view=week&date=${day}`}
                className={styles.add}
                aria-label={`${dayLabel(day)}に作成`}
              >
                +
              </Link>
            </div>
          ))}
        </div>

        <div className={`${styles.weekRow} ${styles.allDayRow}`}>
          <div className={styles.gutter}>終日</div>
          {days.map((day) => (
            <ul
              key={day}
              className={styles.allDayCell}
              aria-label={`${dayLabel(day)}の終日・日をまたぐイベント`}
            >
              {eventsOnDay(events, day)
                .filter(isAllDayLike)
                .map((event) => (
                  <li key={event.id}>
                    <CalendarEventLink event={event} now={now} />
                  </li>
                ))}
            </ul>
          ))}
        </div>

        <CalendarScroll className={styles.timeScroll} scrollTop={8 * HOUR_PX - 8}>
          <div className={styles.timeGrid}>
            <div className={styles.hours} aria-hidden="true">
              {HOURS.map((hour) => (
                <span key={hour} style={{ top: hour * HOUR_PX }}>
                  {hour}:00
                </span>
              ))}
            </div>
            {days.map((day) => (
              <ul
                key={day}
                className={`${styles.dayColumn} ${day === today ? styles.today : ""}`}
                aria-label={dayLabel(day)}
              >
                {layoutTimedEvents(events, day).map((placed) => (
                  <li
                    key={placed.event.id}
                    className={styles.timed}
                    style={{
                      top: `${(placed.startMinute / 1440) * 100}%`,
                      height: `${((placed.endMinute - placed.startMinute) / 1440) * 100}%`,
                      left: `${(placed.column / placed.columns) * 100}%`,
                      width: `${100 / placed.columns}%`,
                    }}
                  >
                    <CalendarEventLink
                      event={placed.event}
                      now={now}
                      time={
                        // 1 時間未満は 2 行分の高さがないので、時刻（位置で分かる）を省いてタイトルを出す
                        placed.endMinute - placed.startMinute >= 60
                          ? toJstTime(placed.event.startAt)
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </CalendarScroll>
      </div>

      <ol className={styles.weekList}>
        {days.map((day) => {
          const items = eventsOnDay(events, day);
          return (
            <li key={day} className={day === today ? styles.today : undefined}>
              <div className={styles.weekListHeader}>
                <h2 className={styles.weekListDay}>
                  <Link href={`/?from=${day}&to=${day}`}>{dayLabel(day)}</Link>
                </h2>
                <Link
                  href={`/events/new?view=week&date=${day}`}
                  className={styles.add}
                  aria-label={`${dayLabel(day)}に作成`}
                >
                  +
                </Link>
              </div>
              {items.length > 0 ? (
                <ul className={styles.weekListEvents}>
                  {items.map((event) => (
                    <li key={event.id}>
                      <CalendarEventLink event={event} now={now} time={formatTimeRangeJst(event)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.none}>イベントはありません</p>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
