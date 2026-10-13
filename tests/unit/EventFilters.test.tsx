import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventFilters } from "@/components/EventFilters";

// next/form と next/link は Next.js のルーターが要るので、ただの form と a にする
vi.mock("next/form", () => ({
  default: (props: React.FormHTMLAttributes<HTMLFormElement>) => <form {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props} />
  ),
}));

describe("EventFilters", () => {
  it("URL の条件を入力欄の初期値にする", () => {
    render(
      <EventFilters
        values={{
          status: ["SCHEDULED", "DONE"],
          from: "2026-10-01",
          to: "2026-10-31",
          q: "ゼミ",
          sort: "-startAt",
        }}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "予定" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "進行中" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "完了" })).toBeChecked();
    expect(screen.getByLabelText("期間の開始日")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("期間の終了日")).toHaveValue("2026-10-31");
    expect(screen.getByRole("searchbox", { name: "キーワード" })).toHaveValue("ゼミ");
    expect(screen.getByRole("combobox", { name: "並べ順" })).toHaveValue("-startAt");
    expect(screen.getByRole("link", { name: "クリア" })).toHaveAttribute("href", "/");
  });

  it("条件が正しくなければ理由を出す", () => {
    render(
      <EventFilters
        values={{ status: [], from: "2026-10-31", to: "2026-10-01", q: "", sort: "startAt" }}
        errors={["期間の終了は開始と同じ日か後にしてください"]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "期間の終了は開始と同じ日か後にしてください",
    );
  });
});
