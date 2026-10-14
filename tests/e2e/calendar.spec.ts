import { expect, test } from "@playwright/test";
import { createEvent, deleteAllEvents, field } from "./helpers";

// 日付は先の固定の日にする（今日によって注意表示や月の区切りが変わらないように）。
// 2030 年 1 月 13 日は日曜日なので、1/15（火）を含む週は 1/13〜1/19
test.beforeEach(async ({ request }) => {
  await deleteAllEvents(request);
  await createEvent(request, {
    title: "E2E 会議",
    startAt: "2030-01-15T10:00:00+09:00",
    endAt: "2030-01-15T11:30:00+09:00",
    status: "SCHEDULED",
  });
  await createEvent(request, {
    title: "E2E 合宿",
    allDay: true,
    startAt: "2030-01-16T00:00:00+09:00",
    endAt: "2030-01-17T00:00:00+09:00",
    status: "SCHEDULED",
  });
});

test("月表示・週表示の切り替えと移動、イベントから詳細へ", async ({ page }) => {
  await page.goto("/calendar?date=2030-01-15");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2030年1月");
  await expect(page.getByRole("link", { name: /E2E 会議/ })).toBeVisible();
  // 日をまたぐイベントは重なる日すべてに出る
  await expect(page.getByRole("link", { name: /E2E 合宿/ })).toHaveCount(2);

  // 次へ・前へ（表示中の月が URL に入る）
  await page.getByRole("link", { name: /次へ/ }).click();
  await expect(page).toHaveURL(/view=month&date=2030-02-01/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2030年2月");
  await page.getByRole("link", { name: /前へ/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2030年1月");

  // 週表示：時刻のあるものは時間軸に、終日・日をまたぐものは上の段に
  await page.goto("/calendar?view=month&date=2030-01-15");
  await page.getByRole("link", { name: "週", exact: true }).click();
  await expect(page).toHaveURL(/view=week&date=2030-01-15/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2030年1月13日〜19日");
  const meeting = page
    .getByRole("list", { name: "1月15日（火）" })
    .getByRole("link", { name: /E2E 会議/ });
  await expect(meeting).toBeVisible();
  // 10:00〜11:30 の 1.5 時間分の高さ（1 時間 48px）
  const box = await meeting.boundingBox();
  expect(box?.height).toBeGreaterThan(64);
  expect(box?.height).toBeLessThan(76);
  await expect(
    page
      .getByRole("list", { name: "1月16日（水）の終日・日をまたぐイベント" })
      .getByRole("link", { name: /E2E 合宿/ }),
  ).toBeVisible();

  // 再読み込みしても同じ表示
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2030年1月13日〜19日");

  // イベントを選ぶと詳細へ
  await meeting.click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E 会議");
});

test("日付の「＋」からその日を入れた作成フォームを開き、キャンセルでカレンダーへ戻る", async ({
  page,
}) => {
  await page.goto("/calendar?view=week&date=2030-01-15");
  await page.getByRole("link", { name: "1月15日（火）に作成" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/events\/new\?view=week&date=2030-01-15$/);
  await expect(field(page, "開始日")).toHaveValue("2030-01-15");
  await expect(field(page, "開始時刻")).toHaveValue("09:00");
  await expect(field(page, "終了時刻")).toHaveValue("10:00");

  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page).toHaveURL(/\/calendar\?view=week&date=2030-01-15$/);
});

test("スマートフォンの幅：月は件数、週は日ごとの一覧。横スクロールなし", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/calendar?date=2030-01-15");
  await expect(page.getByRole("link", { name: "1月16日（水）のイベント 1 件" })).toBeVisible();
  await expect(page.getByRole("link", { name: /E2E 会議/ })).toHaveCount(0);

  await page.goto("/calendar?view=week&date=2030-01-15");
  await expect(page.getByRole("heading", { name: "1月15日（火）", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: /10:00〜11:30\s*E2E 会議/ })).toBeVisible();

  for (const path of ["/calendar?date=2030-01-15", "/calendar?view=week&date=2030-01-15"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  }
});
