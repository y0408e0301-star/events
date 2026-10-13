// イベントの DB 処理（サービス層）。Route Handler と Server Component の両方から使う
import { Prisma } from "@/generated/prisma/client";
import { endOfDayJst, parseDateJst, startOfDayJst } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import type { EventInput, EventStatus, ListQuery } from "@/lib/schema";

export class NotFoundError extends Error {
  constructor() {
    super("イベントが見つかりません");
    this.name = "NotFoundError";
  }
}

/** 終日のイベントは、日本時間で開始日の 0:00 〜 終了日の 23:59:59.999 にそろえる */
function toData(input: EventInput) {
  const startAt = input.allDay ? startOfDayJst(input.startAt) : input.startAt;
  const endAt = input.allDay ? endOfDayJst(input.endAt) : input.endAt;
  return { ...input, startAt, endAt };
}

const ORDER_BY: Record<ListQuery["sort"], Prisma.EventOrderByWithRelationInput[]> = {
  startAt: [{ startAt: "asc" }, { id: "asc" }],
  "-startAt": [{ startAt: "desc" }, { id: "desc" }],
  "-updatedAt": [{ updatedAt: "desc" }, { id: "desc" }],
};

export async function listEvents(query: ListQuery) {
  const where: Prisma.EventWhereInput = {};
  if (query.status.length > 0) {
    where.status = { in: query.status };
  }
  // 期間に一部でも重なるもの：開始が期間の終わり以前、かつ終了が期間の始め以降
  if (query.to) {
    where.startAt = { lte: endOfDayJst(parseDateJst(query.to)) };
  }
  if (query.from) {
    where.endAt = { gte: parseDateJst(query.from) };
  }
  if (query.q) {
    where.title = { contains: query.q };
  }
  return prisma.event.findMany({ where, orderBy: ORDER_BY[query.sort] });
}

export async function getEvent(id: number) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    throw new NotFoundError();
  }
  return event;
}

export async function createEvent(input: EventInput) {
  return prisma.event.create({ data: toData(input) });
}

export async function updateEvent(id: number, input: EventInput) {
  return rethrowNotFound(prisma.event.update({ where: { id }, data: toData(input) }));
}

export async function updateEventStatus(id: number, status: EventStatus) {
  return rethrowNotFound(prisma.event.update({ where: { id }, data: { status } }));
}

export async function deleteEvent(id: number) {
  await rethrowNotFound(prisma.event.delete({ where: { id } }));
}

/** 更新・削除の対象がないとき（Prisma の P2025）は NotFoundError にする */
async function rethrowNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError();
    }
    throw error;
  }
}
