import { updateEventStatus } from "@/lib/events";
import { handleErrors, notFound, parseId, readJson } from "@/lib/http";
import { statusInputSchema } from "@/lib/schema";

// ステータスだけを変える（一覧のカード上での切り替え。要件定義書 F-03）
export async function PATCH(request: Request, ctx: RouteContext<"/api/events/[id]/status">) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  return handleErrors(async () => {
    const { status } = statusInputSchema.parse(await readJson(request));
    return Response.json(await updateEventStatus(id, status));
  });
}
