import { expect, test, type Page } from "@playwright/test";
import { createEvent, deleteAllEvents, field, jstDate } from "../e2e/helpers";

// README のスクリーンショット（docs/images）を撮る。npm run screenshots で実行する。
// 注意表示（終了済み・未完了など）はサーバーの今の時刻で決まるので、日付は撮る日からの相対で作り、
// 5 枚とも同じデータ・同じ「今日」で撮る
const images = "docs/images";

/** 今日から days 日後の time（日本時間）。time を省くとその日の 0:00（終日のイベント用） */
function at(days: number, time = "00:00") {
  return `${jstDate(days)}T${time}:00+09:00`;
}

test.beforeAll(async ({ request }) => {
  await deleteAllEvents(request);
  const events = [
    { title: "歯医者", startAt: at(-12, "10:00"), endAt: at(-12, "10:30"), status: "DONE" },
    {
      title: "前回のゼミ",
      startAt: at(-7, "13:00"),
      endAt: at(-7, "14:30"),
      location: "3 号館 201",
      status: "DONE",
    },
    {
      title: "学園祭の準備",
      allDay: true,
      startAt: at(-2),
      endAt: at(0),
      location: "サークル棟",
      status: "IN_PROGRESS",
    },
    {
      title: "統計学のレポート提出",
      startAt: at(-2, "23:59"),
      endAt: at(-2, "23:59"),
      status: "SCHEDULED",
    },
    {
      title: "アルバイト",
      startAt: at(-1, "08:00"),
      endAt: at(-1, "23:30"),
      location: "駅前のカフェ",
      status: "SCHEDULED",
    },
    {
      title: "サークルの打ち合わせ",
      startAt: at(0, "18:00"),
      endAt: at(0, "19:00"),
      location: "部室",
      status: "SCHEDULED",
    },
    {
      title: "英語の小テスト",
      startAt: at(1, "09:00"),
      endAt: at(1, "09:30"),
      location: "1 号館 105",
      status: "SCHEDULED",
    },
    {
      title: "研究室のミーティング",
      startAt: at(1, "13:00"),
      endAt: at(1, "15:00"),
      status: "SCHEDULED",
    },
    { title: "図書館で勉強", startAt: at(1, "14:00"), endAt: at(1, "16:00"), status: "SCHEDULED" },
    {
      title: "就活の説明会（オンライン）",
      startAt: at(2, "18:00"),
      endAt: at(2, "19:30"),
      status: "SCHEDULED",
    },
    { title: "学園祭", allDay: true, startAt: at(2), endAt: at(3), status: "SCHEDULED" },
    {
      title: "中間発表",
      startAt: at(11, "13:00"),
      endAt: at(11, "14:30"),
      location: "3 号館 201",
      status: "SCHEDULED",
    },
  ];
  for (const event of events) {
    await createEvent(request, event);
  }
});

async function shoot(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${images}/${name}.png` });
}

test("一覧（PC）", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1264 });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  await shoot(page, "list");
});

test("カレンダー（週表示）", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 936 });
  await page.goto(`/calendar?view=week&date=${jstDate(0)}`);
  await expect(page.getByRole("link", { name: /研究室のミーティング/ })).toBeVisible();
  await shoot(page, "calendar-week");
});

test("カレンダー（月表示）", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/calendar?view=month&date=${jstDate(0)}`);
  await expect(page.getByRole("link", { name: /サークルの打ち合わせ/ })).toBeVisible();
  await shoot(page, "calendar-month");
});

test("編集フォームのステータスの提案", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1068 });
  await page.goto("/");
  await page.getByRole("link", { name: "アルバイト" }).click();
  await page.getByRole("link", { name: "編集" }).click();
  await field(page, "終了時刻").fill("23:45");
  // 入力欄の選択の反転が写らないように、フォーカスを外す
  await field(page, "場所").focus();
  await page.locator(":focus").blur();
  await expect(page.getByRole("button", { name: /提案：完了にする/ })).toBeVisible();
  await shoot(page, "edit-suggestion");
});

test.describe("スマートフォン（ダーク）", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "dark" });

  test("一覧", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(12);
    await shoot(page, "list-mobile-dark");
  });
});
