// API のエラー応答をそろえる：{ message, errors: { 項目: [メッセージ] } }（要件定義書 6. API）
import { z } from "zod";
import { NotFoundError } from "@/lib/events";

type FieldErrors = Record<string, string[]>;

export function errorResponse(status: number, message: string, errors: FieldErrors = {}) {
  return Response.json({ message, errors }, { status });
}

export function notFound() {
  return errorResponse(404, new NotFoundError().message);
}

class BadRequestError extends Error {}

/** URL の id を正の整数として読む。読めなければ 404（そういうイベントはない） */
export function parseId(value: string): number | null {
  if (!/^[1-9][0-9]{0,9}$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return id <= 2147483647 ? id : null;
}

/** リクエストの本文を JSON として読む */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("リクエストの本文が JSON ではありません");
  }
}

/** 例外を 400 / 404 / 500 の応答に変える */
export async function handleErrors(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { fieldErrors, formErrors } = z.flattenError(error);
      const errors = Object.fromEntries(
        Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => !!entry[1]),
      );
      const message = formErrors[0] ?? "入力内容を確かめてください";
      return errorResponse(400, message, errors);
    }
    if (error instanceof BadRequestError) {
      return errorResponse(400, error.message);
    }
    if (error instanceof NotFoundError) {
      return notFound();
    }
    console.error("API の処理に失敗しました", error);
    return errorResponse(500, "サーバーでエラーが起きました。時間をおいてやり直してください");
  }
}
