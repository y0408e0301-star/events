import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { ToastProvider } from "@/components/Toast";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const initialValues: EventFormValues = {
  title: "",
  allDay: false,
  startDate: "2026-10-20",
  startTime: "13:00",
  endDate: "2026-10-20",
  endTime: "14:00",
  location: "",
  description: "",
  status: "SCHEDULED",
};

function renderForm() {
  return render(
    <ToastProvider>
      <EventForm mode="create" initialValues={initialValues} />
    </ToastProvider>,
  );
}

describe("EventForm", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    push.mockReset();
  });

  it("入力の誤りは送信せずに項目の下に出す", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(screen.getByLabelText("終了時刻"));
    await user.type(screen.getByLabelText("終了時刻"), "12:00");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/タイトル/)).toHaveAccessibleDescription(
      "タイトルを入力してください",
    );
    expect(screen.getByLabelText("終了時刻")).toHaveAccessibleDescription(
      "終了は開始より後にしてください",
    );
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("入力内容を確かめてください");
  });

  it("保存したら詳細画面へ移り、メッセージを出す", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 42 }, { status: 201 }));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/タイトル/), "ゼミ発表");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/events",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      title: "ゼミ発表",
      startAt: "2026-10-20T13:00:00+09:00",
    });
    expect(push).toHaveBeenCalledWith("/events/42");
    expect(screen.getByRole("status")).toHaveTextContent("イベントを作成しました");
  });

  it("API のエラーは入力を残したまま項目に出す", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { message: "入力内容を確かめてください", errors: { title: ["サーバーからのメッセージ"] } },
        { status: 400 },
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/タイトル/), "ゼミ発表");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(screen.getByLabelText(/タイトル/)).toHaveValue("ゼミ発表");
    expect(screen.getByLabelText(/タイトル/)).toHaveAccessibleDescription(
      "サーバーからのメッセージ",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("サーバーにつながらなければ理由を出し、入力は残す", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/タイトル/), "ゼミ発表");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("サーバーにつながりませんでした");
    expect(screen.getByLabelText(/タイトル/)).toHaveValue("ゼミ発表");
    expect(screen.getByRole("button", { name: "作成する" })).toBeEnabled();
  });

  it("終日にすると時刻の入力を隠す", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByLabelText("終日（時刻を指定しない）"));

    expect(screen.queryByLabelText("開始時刻")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("終了時刻")).not.toBeInTheDocument();
  });

  it("入力していなければキャンセルですぐ戻り、入力していれば確認する", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(push).toHaveBeenCalledWith("/");
    push.mockReset();

    await user.type(screen.getByLabelText(/タイトル/), "下書き");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "入力内容を破棄しますか？" })).toBeVisible();
  });
});
