import { deleteEvent, getEvent, updateEvent } from "@/lib/events";
import { handleErrors, notFound, parseId, readJson } from "@/lib/http";
import { eventInputSchema } from "@/lib/schema";

type Context = RouteContext<"/api/events/[id]">;

export async function GET(_request: Request, ctx: Context) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  return handleErrors(async () => Response.json(await getEvent(id)));
}

export async function PUT(request: Request, ctx: Context) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  return handleErrors(async () => {
    const input = eventInputSchema.parse(await readJson(request));
    return Response.json(await updateEvent(id, input));
  });
}

export async function DELETE(_request: Request, ctx: Context) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  return handleErrors(async () => {
    await deleteEvent(id);
    return new Response(null, { status: 204 });
  });
}
