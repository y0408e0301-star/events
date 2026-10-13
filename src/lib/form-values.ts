// イベントの作成・編集フォームの初期値
import type { EventFormValues } from "@/components/EventForm";
import { toJstDateKey, toJstTime } from "@/lib/date";
import type { EventStatus } from "@/lib/schema";

type EventLike = {
  title: string;
  allDay: boolean;
  startAt: Date;
  endAt: Date;
  location: string | null;
  description: string | null;
  status: EventStatus;
};

/** 保存済みのイベントからフォームの値を作る（編集画面） */
export function toFormValues(event: EventLike): EventFormValues {
  return {
    title: event.title,
    allDay: event.allDay,
    startDate: toJstDateKey(event.startAt),
    startTime: toJstTime(event.startAt),
    endDate: toJstDateKey(event.endAt),
    endTime: toJstTime(event.endAt),
    location: event.location ?? "",
    description: event.description ?? "",
    status: event.status,
  };
}

const HOUR_MS = 60 * 60 * 1000;

/** 作成画面の初期値：次の正時から 1 時間 */
export function defaultFormValues(now: Date): EventFormValues {
  const start = new Date(Math.ceil(now.getTime() / HOUR_MS) * HOUR_MS);
  const end = new Date(start.getTime() + HOUR_MS);
  return toFormValues({
    title: "",
    allDay: false,
    startAt: start,
    endAt: end,
    location: null,
    description: null,
    status: "SCHEDULED",
  });
}
