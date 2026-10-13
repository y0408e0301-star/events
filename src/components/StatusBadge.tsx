import { STATUS_LABELS, type EventStatus } from "@/lib/schema";
import styles from "./StatusBadge.module.css";

const CLASS_NAMES: Record<EventStatus, string> = {
  SCHEDULED: styles.scheduled,
  IN_PROGRESS: styles.inProgress,
  DONE: styles.done,
};

/** ステータスは色だけでなく文字でも示す（要件定義書 N-07） */
export function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={`${styles.badge} ${CLASS_NAMES[status]}`}>{STATUS_LABELS[status]}</span>;
}
