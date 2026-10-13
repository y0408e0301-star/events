import { WARNING_LABELS, type StatusWarning } from "@/lib/status";
import styles from "./StatusWarningBadge.module.css";

/** ステータスが日時とずれていることを知らせる印（色だけでなく文字でも示す） */
export function StatusWarningBadge({ warning }: { warning: StatusWarning }) {
  return (
    <span className={`${styles.badge} ${styles[warning]}`}>
      <span aria-hidden="true">{warning === "overdue" ? "!" : "▶"}</span>
      {WARNING_LABELS[warning]}
    </span>
  );
}
