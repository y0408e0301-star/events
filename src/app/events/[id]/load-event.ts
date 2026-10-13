import { notFound } from "next/navigation";
import { connection } from "next/server";
import { NotFoundError, getEvent } from "@/lib/events";
import { parseId } from "@/lib/http";

/** URL の id のイベントを読む。なければ「イベントが見つかりません」の画面にする */
export async function loadEvent(params: Promise<{ id: string }>) {
  // DB の読み取りはリクエストのたびに行う（ビルド時の事前描画に含めない）
  await connection();
  const id = parseId((await params).id);
  if (id === null) notFound();
  try {
    return await getEvent(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
