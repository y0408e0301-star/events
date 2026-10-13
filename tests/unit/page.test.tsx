import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("トップページ", () => {
  it("見出しを表示する", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "イベント" })).toBeInTheDocument();
  });
});
