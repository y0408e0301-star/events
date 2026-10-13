import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "イベント・予定管理",
  description: "イベント・予定を日時とステータスで管理するアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
