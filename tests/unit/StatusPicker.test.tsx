import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusPicker } from "@/components/StatusPicker";
import { ToastProvider } from "@/components/Toast";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function renderPicker() {
  return render(
    <ToastProvider>
      <StatusPicker eventId={7} title="ゼミ発表" status="SCHEDULED" />
    </ToastProvider>,
  );
}

describe("StatusPicker", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    refresh.mockReset();
  });

  it("選んだステータスをその場で保存し、一覧を読み直す", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 7 }));
    const user = userEvent.setup();
    renderPicker();

    await user.selectOptions(screen.getByLabelText("「ゼミ発表」のステータス"), "IN_PROGRESS");

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/events/7/status",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "IN_PROGRESS" }) }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("「ゼミ発表」を進行中にしました");
  });

  it("保存できなければ理由を出し、元のステータスに戻す", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "イベントが見つかりません", errors: {} }, { status: 404 }),
    );
    const user = userEvent.setup();
    renderPicker();
    const select = screen.getByLabelText("「ゼミ発表」のステータス");

    await user.selectOptions(select, "DONE");

    await waitFor(() => expect(select).toHaveValue("SCHEDULED"));
    expect(screen.getByRole("alert")).toHaveTextContent("イベントが見つかりません");
    expect(refresh).not.toHaveBeenCalled();
  });
});
