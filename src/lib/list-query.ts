// 一覧の URL のクエリ（?status=...&from=...）と、一覧の条件（ListQuery）のあいだの変換
import { listQuerySchema, type ListQuery } from "@/lib/schema";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * 画面の URL のクエリを、API と同じ入力チェックにかけられる形にする。
 * フォームから送るとステータスは ?status=A&status=B と複数になり、空の項目は q= のように空文字で来る
 */
export function normalizeSearchParams(params: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const text = Array.isArray(value) ? value.filter(Boolean).join(",") : (value ?? "");
    if (text.trim() !== "") {
      result[key] = text;
    }
  }
  return result;
}

export function parseListQuery(params: SearchParams) {
  return listQuerySchema.safeParse(normalizeSearchParams(params));
}

/** 並べ順以外の絞り込みが指定されているか */
export function hasFilters(query: ListQuery): boolean {
  return query.status.length > 0 || !!query.from || !!query.to || !!query.q;
}

export const SORT_LABELS: Record<ListQuery["sort"], string> = {
  startAt: "開始の早い順",
  "-startAt": "開始の遅い順",
  "-updatedAt": "更新の新しい順",
};
