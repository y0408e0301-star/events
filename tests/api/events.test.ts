import { describe, expect, it } from "vitest";
import { api, createEvent, eventBody } from "./helpers";

describe("POST /api/events", () => {
  it("作成したイベントを 201 で返す（日時は UTC）", async () => {
    const res = await api.create(eventBody());

    expect(res.status).toBe(201);
    const event = await res.json();
    expect(event).toMatchObject({
      id: expect.any(Number),
      title: "ゼミ発表",
      description: "スライド 10 枚",
      location: "3 号館 201",
      startAt: "2026-10-20T04:00:00.000Z",
      endAt: "2026-10-20T05:30:00.000Z",
      allDay: false,
      status: "SCHEDULED",
    });
  });

  it("前後の空白を除き、空のメモ・場所は null にする", async () => {
    const res = await api.create(eventBody({ title: "  発表  ", description: "  ", location: "" }));

    const event = await res.json();
    expect(event).toMatchObject({ title: "発表", description: null, location: null });
  });

  it("終日のイベントは日本時間の 0:00 〜 終了日の 23:59:59.999 にそろえる", async () => {
    const res = await api.create(
      eventBody({
        allDay: true,
        startAt: "2026-10-25T15:00:00+09:00",
        endAt: "2026-10-26T10:00:00+09:00",
      }),
    );

    const event = await res.json();
    expect(event.startAt).toBe("2026-10-24T15:00:00.000Z");
    expect(event.endAt).toBe("2026-10-26T14:59:59.999Z");
  });

  it("開始と終了が同じ日時なら作成できる（締め切りなど）", async () => {
    const res = await api.create(
      eventBody({ startAt: "2026-10-18T23:59:00+09:00", endAt: "2026-10-18T23:59:00+09:00" }),
    );

    expect(res.status).toBe(201);
  });

  it("終了が開始より前なら 400 で項目ごとのメッセージを返す", async () => {
    const res = await api.create(
      eventBody({ startAt: "2026-10-20T13:00:00+09:00", endAt: "2026-10-20T12:00:00+09:00" }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "入力内容を確かめてください",
      errors: { endAt: ["終了は開始より後にしてください"] },
    });
  });

  it("必須項目がないと 400", async () => {
    const res = await api.create({ title: " " });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toMatchObject({
      title: ["タイトルを入力してください"],
      startAt: ["開始の日時を入力してください"],
      endAt: ["終了の日時を入力してください"],
      status: ["ステータスを選んでください"],
    });
  });

  it("長すぎる入力は 400", async () => {
    const res = await api.create(
      eventBody({
        title: "あ".repeat(101),
        location: "い".repeat(101),
        description: "う".repeat(1001),
      }),
    );

    const body = await res.json();
    expect(body.errors).toEqual({
      title: ["タイトルは 100 文字以内で入力してください"],
      location: ["場所は 100 文字以内で入力してください"],
      description: ["メモは 1000 文字以内で入力してください"],
    });
  });

  it("時差のない日時や日時でない値は 400", async () => {
    const res = await api.create(eventBody({ startAt: "2026-10-20T13:00:00", endAt: null }));

    const body = await res.json();
    expect(Object.keys(body.errors).sort()).toEqual(["endAt", "startAt"]);
  });

  it("本文が JSON でなければ 400", async () => {
    const res = await api.create("{ title:");

    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("リクエストの本文が JSON ではありません");
  });
});

describe("GET /api/events/{id}", () => {
  it("1 件を返す", async () => {
    const created = await createEvent();

    const res = await api.get(created.id);

    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("ゼミ発表");
  });

  it.each(["9999", "abc", "0", "-1", "1.5", "99999999999"])(
    "存在しない id（%s）は 404",
    async (id) => {
      const res = await api.get(id);

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: "イベントが見つかりません", errors: {} });
    },
  );
});

describe("PUT /api/events/{id}", () => {
  it("全項目を更新する", async () => {
    const created = await createEvent();

    const res = await api.update(
      created.id,
      eventBody({ title: "ゼミ発表（延期）", status: "IN_PROGRESS", location: null }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: created.id,
      title: "ゼミ発表（延期）",
      status: "IN_PROGRESS",
      location: null,
    });
  });

  it("入力が正しくなければ 400、存在しなければ 404", async () => {
    const created = await createEvent();

    expect((await api.update(created.id, eventBody({ title: "" }))).status).toBe(400);
    expect((await api.update(9999, eventBody())).status).toBe(404);
  });
});

describe("PATCH /api/events/{id}/status", () => {
  it("ステータスだけを変える", async () => {
    const created = await createEvent();

    const res = await api.setStatus(created.id, { status: "DONE" });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ title: "ゼミ発表", status: "DONE" });
  });

  it("決まった 3 つ以外は 400、存在しなければ 404", async () => {
    const created = await createEvent();

    const bad = await api.setStatus(created.id, { status: "CANCELLED" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).errors).toEqual({ status: ["ステータスを選んでください"] });
    expect((await api.setStatus(9999, { status: "DONE" })).status).toBe(404);
  });
});

describe("DELETE /api/events/{id}", () => {
  it("204 を返し、以後は 404 になる", async () => {
    const created = await createEvent();

    expect((await api.remove(created.id)).status).toBe(204);
    expect((await api.get(created.id)).status).toBe(404);
    expect((await api.remove(created.id)).status).toBe(404);
  });
});

describe("GET /api/events", () => {
  async function titles(query = "") {
    const res = await api.list(query);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: { title: string }[] };
    return body.events.map((event) => event.title);
  }

  async function seed() {
    await createEvent({
      title: "レポート提出",
      startAt: "2026-10-18T23:59:00+09:00",
      endAt: "2026-10-18T23:59:00+09:00",
      status: "IN_PROGRESS",
    });
    await createEvent({
      title: "ゼミ発表",
      startAt: "2026-10-20T13:00:00+09:00",
      endAt: "2026-10-20T14:30:00+09:00",
    });
    await createEvent({
      title: "学園祭",
      allDay: true,
      startAt: "2026-10-31T00:00:00+09:00",
      endAt: "2026-11-01T00:00:00+09:00",
      status: "DONE",
    });
  }

  it("条件がなければ全件を開始日時の早い順に返す", async () => {
    await seed();

    expect(await titles()).toEqual(["レポート提出", "ゼミ発表", "学園祭"]);
  });

  it("並べ順を変えられる", async () => {
    await seed();

    expect(await titles("sort=-startAt")).toEqual(["学園祭", "ゼミ発表", "レポート提出"]);
    expect(await titles("sort=-updatedAt")).toEqual(["学園祭", "ゼミ発表", "レポート提出"]);
  });

  it("ステータスで絞り込む（カンマ区切りで複数）", async () => {
    await seed();

    expect(await titles("status=DONE")).toEqual(["学園祭"]);
    expect(await titles("status=SCHEDULED,IN_PROGRESS")).toEqual(["レポート提出", "ゼミ発表"]);
  });

  it("期間に一部でも重なるイベントを返す（日付は日本時間）", async () => {
    await seed();

    expect(await titles("from=2026-10-19&to=2026-10-20")).toEqual(["ゼミ発表"]);
    expect(await titles("from=2026-10-18&to=2026-10-18")).toEqual(["レポート提出"]);
    // 10/31〜11/1 の終日イベントは、11 月だけを指定しても出る
    expect(await titles("from=2026-11-01&to=2026-11-30")).toEqual(["学園祭"]);
    expect(await titles("from=2026-10-21")).toEqual(["学園祭"]);
    expect(await titles("to=2026-10-19")).toEqual(["レポート提出"]);
  });

  it("タイトルの一部で絞り込む", async () => {
    await seed();

    expect(await titles(`q=${encodeURIComponent("発表")}`)).toEqual(["ゼミ発表"]);
    expect(await titles(`q=${encodeURIComponent("該当なし")}`)).toEqual([]);
  });

  it("条件を組み合わせられる", async () => {
    await seed();

    expect(await titles("status=SCHEDULED,DONE&from=2026-10-01&to=2026-10-31")).toEqual([
      "ゼミ発表",
      "学園祭",
    ]);
  });

  it.each([
    ["status=CANCELLED", "status"],
    ["from=2026/10/01", "from"],
    ["from=2026-10-31&to=2026-10-01", "to"],
    ["sort=title", "sort"],
  ])("正しくないクエリ（%s）は 400", async (query, field) => {
    const res = await api.list(query);

    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).errors)).toEqual([field]);
  });
});
