// 入力チェックのルール。画面と API で同じものを使う（要件定義書 4. データ構造「入力チェックとメッセージ」）
import { z } from "zod";

export const EVENT_STATUSES = ["SCHEDULED", "IN_PROGRESS", "DONE"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const statusSchema = z.enum(EVENT_STATUSES, { error: "ステータスを選んでください" });

/** 任意の文字列：前後の空白を除き、空なら null として保存する */
function optionalText(max: number, label: string) {
  return z
    .string({ error: `${label}は文字列で入力してください` })
    .trim()
    .max(max, { error: `${label}は ${max} 文字以内で入力してください` })
    .nullish()
    .transform((value) => (value ? value : null));
}

/** 日時は時差付きの ISO 8601（例：2026-10-20T13:00:00+09:00）で受け取り、Date にする */
function dateTime(label: string) {
  return z.iso
    .datetime({ offset: true, error: `${label}の日時を入力してください` })
    .transform((value) => new Date(value));
}

export const eventInputSchema = z
  .object({
    title: z
      .string({ error: "タイトルを入力してください" })
      .trim()
      .min(1, { error: "タイトルを入力してください" })
      .max(100, { error: "タイトルは 100 文字以内で入力してください" }),
    description: optionalText(1000, "メモ"),
    location: optionalText(100, "場所"),
    startAt: dateTime("開始"),
    endAt: dateTime("終了"),
    allDay: z.boolean({ error: "終日は true か false で指定してください" }).default(false),
    status: statusSchema,
  })
  .refine((input) => input.endAt.getTime() >= input.startAt.getTime(), {
    error: "終了は開始より後にしてください",
    path: ["endAt"],
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const statusInputSchema = z.object({ status: statusSchema });

export const EVENT_SORTS = ["startAt", "-startAt", "-updatedAt"] as const;
export type EventSort = (typeof EVENT_SORTS)[number];

const dateOnly = (label: string) =>
  z.iso.date({ error: `${label}は YYYY-MM-DD の形で指定してください` }).optional();

/** GET /api/events のクエリ */
export const listQuerySchema = z
  .object({
    status: z
      .string()
      .optional()
      .transform((value) => (value ? value.split(",").filter(Boolean) : []))
      .pipe(z.array(statusSchema)),
    from: dateOnly("期間の開始"),
    to: dateOnly("期間の終了"),
    q: z
      .string()
      .trim()
      .max(100, { error: "キーワードは 100 文字以内で入力してください" })
      .optional()
      .transform((value) => value || undefined),
    sort: z.enum(EVENT_SORTS, { error: "並べ順の指定が正しくありません" }).default("startAt"),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    error: "期間の終了は開始と同じ日か後にしてください",
    path: ["to"],
  });

export type ListQuery = z.infer<typeof listQuerySchema>;
