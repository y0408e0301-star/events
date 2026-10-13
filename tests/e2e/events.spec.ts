import { expect, test } from "@playwright/test";
import { createEvent, deleteAllEvents, field, jstDate } from "./helpers";

test.beforeEach(async ({ request }) => {
  await deleteAllEvents(request);
});

test("作成 → 編集 → ステータス変更 → 絞り込み → 削除", async ({ page }) => {
  const tomorrow = jstDate(1);

  // 作成
  await page.goto("/");
  await expect(page.getByText("イベントはありません。")).toBeVisible();
  await page.getByRole("link", { name: "＋ 新規作成" }).first().click();
  await field(page, /タイトル/).fill("E2E ゼミ発表");
  await field(page, "開始日").fill(tomorrow);
  await field(page, "開始時刻").fill("10:00");
  await field(page, "終了日").fill(tomorrow);
  await field(page, "終了時刻").fill("11:30");
  await field(page, "場所").fill("3 号館 201");
  await page.getByRole("button", { name: "作成する" }).click();

  await expect(page).toHaveURL(/\/events\/\d+$/);
  await expect(page.getByRole("status")).toContainText("イベントを作成しました");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E ゼミ発表");
  await expect(page.getByText("10:00〜11:30")).toBeVisible();

  // 編集
  await page.getByRole("link", { name: "編集" }).click();
  await field(page, /タイトル/).fill("E2E ゼミ発表（資料つき）");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E ゼミ発表（資料つき）");

  // 一覧でステータスを変える（画面は移らない）
  await page.getByRole("link", { name: "← 一覧へ戻る" }).click();
  await field(page, "「E2E ゼミ発表（資料つき）」のステータス").selectOption("IN_PROGRESS");
  await expect(page.getByRole("status")).toContainText(
    "「E2E ゼミ発表（資料つき）」を進行中にしました",
  );
  await expect(page).toHaveURL("/");

  // 別のイベントを足して、ステータスとキーワードで絞り込む
  await page.goto("/");
  await page.getByRole("link", { name: "＋ 新規作成" }).first().click();
  await field(page, /タイトル/).fill("E2E 買い物");
  await page.getByRole("button", { name: "作成する" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E 買い物");

  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "進行中" }).check();
  await field(page, "キーワード").fill("ゼミ");
  await page.getByRole("button", { name: "絞り込む" }).click();
  await expect(page).toHaveURL(/status=IN_PROGRESS/);
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "E2E ゼミ発表（資料つき）" })).toBeVisible();

  // 再読み込みしても条件は残る
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "進行中" })).toBeChecked();

  // 削除（キャンセルでは消えない）
  await page.getByRole("button", { name: "「E2E ゼミ発表（資料つき）」を削除" }).click();
  const dialog = page.getByRole("alertdialog", { name: "イベントを削除しますか？" });
  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);

  await page.getByRole("button", { name: "「E2E ゼミ発表（資料つき）」を削除" }).click();
  await dialog.getByRole("button", { name: "削除する" }).click();
  await expect(page.getByText("条件に合うイベントはありません。")).toBeVisible();

  await page.getByRole("link", { name: "クリア", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "E2E 買い物" })).toBeVisible();
});

test("終了が開始より前なら保存せず、入力を残してエラーを出す", async ({ page }) => {
  const tomorrow = jstDate(1);
  await page.goto("/events/new");
  await field(page, /タイトル/).fill("E2E 時刻の誤り");
  await field(page, "開始日").fill(tomorrow);
  await field(page, "開始時刻").fill("10:00");
  await field(page, "終了日").fill(tomorrow);
  await field(page, "終了時刻").fill("09:00");
  await page.getByRole("button", { name: "作成する" }).click();

  await expect(page.getByText("終了は開始より後にしてください")).toBeVisible();
  await expect(field(page, /タイトル/)).toHaveValue("E2E 時刻の誤り");
  await expect(page).toHaveURL("/events/new");

  await page.goto("/");
  await expect(page.getByText("イベントはありません。")).toBeVisible();
});

test("終了を過ぎて完了でないイベントに注意表示が出て、完了にすると消える", async ({
  page,
  request,
}) => {
  const lastWeek = jstDate(-7);
  await createEvent(request, {
    title: "E2E 先週の提出",
    startAt: `${lastWeek}T23:59:00+09:00`,
    endAt: `${lastWeek}T23:59:00+09:00`,
    status: "SCHEDULED",
  });

  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "E2E 先週の提出" });
  await expect(card.getByText("終了済み・未完了")).toBeVisible();

  await field(page, "「E2E 先週の提出」のステータス").selectOption("DONE");
  await expect(page.getByRole("status")).toContainText("完了にしました");
  await expect(card.getByText("終了済み・未完了")).toHaveCount(0);
});
