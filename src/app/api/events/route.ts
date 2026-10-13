import { createEvent, listEvents } from "@/lib/events";
import { handleErrors, readJson } from "@/lib/http";
import { eventInputSchema, listQuerySchema } from "@/lib/schema";

// 一覧（絞り込み・並べ替え）。クエリは要件定義書 6. API
export async function GET(request: Request) {
  return handleErrors(async () => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listQuerySchema.parse(params);
    const events = await listEvents(query);
    return Response.json({ events });
  });
}

export async function POST(request: Request) {
  return handleErrors(async () => {
    const input = eventInputSchema.parse(await readJson(request));
    const event = await createEvent(input);
    return Response.json(event, { status: 201 });
  });
}
