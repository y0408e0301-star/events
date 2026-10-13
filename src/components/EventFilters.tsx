import Form from "next/form";
import Link from "next/link";
import { SORT_LABELS } from "@/lib/list-query";
import { EVENT_SORTS, EVENT_STATUSES, STATUS_LABELS, type EventStatus } from "@/lib/schema";
import styles from "./EventFilters.module.css";

export type FilterValues = {
  status: EventStatus[];
  from: string;
  to: string;
  q: string;
  sort: string;
};

type Props = {
  values: FilterValues;
  /** 条件が正しくないときのメッセージ */
  errors?: string[];
};

/**
 * 一覧の絞り込み・並べ替え（要件定義書 F-04）。
 * 送ると条件が URL のクエリに入り、画面を読み直さずに一覧だけ変わる（再読み込み・URL の共有でも同じ結果）
 */
export function EventFilters({ values, errors = [] }: Props) {
  const filtered = values.status.length > 0 || !!values.from || !!values.to || !!values.q;

  return (
    // スマートフォンの幅では、たたんで「絞り込み・並べ替え」から開く。条件が入っていれば開いておく
    <details className={styles.details} open={filtered || errors.length > 0}>
      <summary className={styles.summary}>絞り込み・並べ替え</summary>
      <Form action="/" className={styles.form} aria-label="絞り込み・並べ替え">
        <fieldset className={styles.statuses}>
          <legend className={styles.label}>ステータス</legend>
          {EVENT_STATUSES.map((status) => (
            <label key={status} className={styles.chip}>
              <input
                type="checkbox"
                name="status"
                value={status}
                defaultChecked={values.status.includes(status)}
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.period}>
          <legend className={styles.label}>期間</legend>
          <input type="date" name="from" aria-label="期間の開始日" defaultValue={values.from} />
          <span aria-hidden="true">〜</span>
          <input type="date" name="to" aria-label="期間の終了日" defaultValue={values.to} />
        </fieldset>

        <label className={styles.field}>
          <span className={styles.label}>キーワード</span>
          <input
            type="search"
            name="q"
            placeholder="タイトルの一部"
            defaultValue={values.q}
            maxLength={100}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>並べ順</span>
          <select name="sort" defaultValue={values.sort}>
            {EVENT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actions}>
          <button type="submit" className="button button-primary">
            絞り込む
          </button>
          <Link href="/" className="button">
            クリア
          </Link>
        </div>

        {errors.length > 0 && (
          <p className={styles.error} role="alert">
            {errors.join("、")}
          </p>
        )}
      </Form>
    </details>
  );
}
