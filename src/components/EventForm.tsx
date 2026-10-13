"use client";

// イベントの作成・編集フォーム（要件定義書 5. 画面）。
// 入力は日本時間として扱い、API には時差付きの ISO 8601（+09:00）で送る
import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { z } from "zod";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { ApiError, eventsApi } from "@/lib/api-client";
import {
  EVENT_STATUSES,
  STATUS_LABELS,
  eventInputSchema,
  type EventPayload,
  type EventStatus,
} from "@/lib/schema";
import styles from "./EventForm.module.css";

export type EventFormValues = {
  title: string;
  allDay: boolean;
  /** YYYY-MM-DD（日本時間） */
  startDate: string;
  /** HH:mm（日本時間） */
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  status: EventStatus;
};

type FieldErrors = Partial<Record<keyof EventPayload, string[]>>;

type Props =
  | { mode: "create"; initialValues: EventFormValues }
  | { mode: "edit"; eventId: number; initialValues: EventFormValues };

/** フォームの値を API に送る形にする。日付が空なら空文字のまま送り、入力チェックで止める */
export function toPayload(values: EventFormValues): EventPayload {
  const toIso = (date: string, time: string) =>
    date ? `${date}T${values.allDay || !time ? "00:00" : time}:00+09:00` : "";
  return {
    title: values.title,
    allDay: values.allDay,
    startAt: toIso(values.startDate, values.startTime),
    endAt: toIso(values.endDate, values.endTime),
    location: values.location,
    description: values.description,
    status: values.status,
  };
}

function validate(payload: EventPayload): FieldErrors {
  const result = eventInputSchema.safeParse(payload);
  return result.success ? {} : (z.flattenError(result.error).fieldErrors as FieldErrors);
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className={styles.error}>
      {messages.join("、")}
    </p>
  );
}

export function EventForm(props: Props) {
  const { mode } = props;
  // 初期値は最初に受け取った値に固定する（作り直しは呼び出し側の key で行う）
  const [initialValues] = useState(props.initialValues);
  const router = useRouter();
  const showToast = useToast();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  // 保存・破棄したあとは、次に開いたとき新しいフォームにする
  const shouldReset = useRef(false);
  const id = useId();

  // Cache Components では、画面を離れてもこのフォームは隠れるだけで状態が残る。
  // 隠れるときに、確認ダイアログは必ず閉じ、保存・破棄済みなら入力も初期状態に戻す
  // （入力途中で離れた場合は、戻ったときに続きから書けるよう残す）
  useLayoutEffect(() => {
    return () => {
      setConfirmingCancel(false);
      if (shouldReset.current) {
        shouldReset.current = false;
        setValues(initialValues);
        setErrors({});
        setFormError(null);
        setSaving(false);
      }
    };
  }, [initialValues]);

  const backHref = props.mode === "edit" ? `/events/${props.eventId}` : "/";
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = toPayload(values);
    const clientErrors = validate(payload);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setFormError("入力内容を確かめてください");
      summaryRef.current?.focus();
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const saved =
        props.mode === "edit"
          ? await eventsApi.update(props.eventId, payload)
          : await eventsApi.create(payload);
      shouldReset.current = true;
      showToast(mode === "edit" ? "イベントを保存しました" : "イベントを作成しました");
      router.push(`/events/${saved.id}`);
    } catch (error) {
      // 入力内容は消さずに、理由を表示する（要件定義書 F-05）
      const apiError = error instanceof ApiError ? error : new ApiError(0, "保存できませんでした");
      setErrors(apiError.errors);
      setFormError(apiError.message);
      setSaving(false);
      summaryRef.current?.focus();
    }
  }

  function handleCancel() {
    if (dirty) {
      setConfirmingCancel(true);
    } else {
      router.push(backHref);
    }
  }

  const fieldId = (name: string) => `${id}-${name}`;
  const errorId = (name: keyof EventPayload) => `${id}-${name}-error`;
  const describedBy = (name: keyof EventPayload) => (errors[name] ? errorId(name) : undefined);

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div ref={summaryRef} tabIndex={-1} className={styles.summary} role="alert">
        {formError}
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("title")}>
          タイトル<span className={styles.required}>必須</span>
        </label>
        <input
          id={fieldId("title")}
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={100}
          required
          aria-invalid={!!errors.title}
          aria-describedby={describedBy("title")}
          autoComplete="off"
        />
        <FieldError id={errorId("title")} messages={errors.title} />
      </div>

      <div className={styles.field}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={values.allDay}
            onChange={(e) => set("allDay", e.target.checked)}
          />
          終日（時刻を指定しない）
        </label>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>
          開始<span className={styles.required}>必須</span>
        </legend>
        <div className={styles.dateTime}>
          <input
            type="date"
            aria-label="開始日"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
            aria-invalid={!!errors.startAt}
            aria-describedby={describedBy("startAt")}
          />
          {!values.allDay && (
            <input
              type="time"
              aria-label="開始時刻"
              value={values.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              aria-invalid={!!errors.startAt}
              aria-describedby={describedBy("startAt")}
            />
          )}
        </div>
        <FieldError id={errorId("startAt")} messages={errors.startAt} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>
          終了<span className={styles.required}>必須</span>
        </legend>
        <div className={styles.dateTime}>
          <input
            type="date"
            aria-label="終了日"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            required
            aria-invalid={!!errors.endAt}
            aria-describedby={describedBy("endAt")}
          />
          {!values.allDay && (
            <input
              type="time"
              aria-label="終了時刻"
              value={values.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              aria-invalid={!!errors.endAt}
              aria-describedby={describedBy("endAt")}
            />
          )}
        </div>
        <FieldError id={errorId("endAt")} messages={errors.endAt} />
      </fieldset>

      <div className={styles.field}>
        <label htmlFor={fieldId("location")}>場所</label>
        <input
          id={fieldId("location")}
          type="text"
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          maxLength={100}
          aria-invalid={!!errors.location}
          aria-describedby={describedBy("location")}
        />
        <FieldError id={errorId("location")} messages={errors.location} />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("description")}>メモ</label>
        <textarea
          id={fieldId("description")}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={1000}
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={describedBy("description")}
        />
        <FieldError id={errorId("description")} messages={errors.description} />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("status")}>
          ステータス<span className={styles.required}>必須</span>
        </label>
        <select
          id={fieldId("status")}
          value={values.status}
          onChange={(e) => set("status", e.target.value as EventStatus)}
          aria-invalid={!!errors.status}
          aria-describedby={describedBy("status")}
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <FieldError id={errorId("status")} messages={errors.status} />
      </div>

      <div className={styles.actions}>
        <button type="button" className="button" onClick={handleCancel} disabled={saving}>
          キャンセル
        </button>
        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "保存中…" : mode === "edit" ? "保存する" : "作成する"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="入力内容を破棄しますか？"
        message="保存していない入力内容は失われます。"
        confirmLabel="破棄する"
        danger
        onConfirm={() => {
          shouldReset.current = true;
          router.push(backHref);
        }}
        onCancel={() => setConfirmingCancel(false)}
      />
    </form>
  );
}
