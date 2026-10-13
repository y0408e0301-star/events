import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: { default: "イベント・予定管理", template: "%s | イベント・予定管理" },
  description: "イベント・予定を日時とステータスで管理するアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>
          <header className={styles.header}>
            <div className={styles.inner}>
              <Link href="/" className={styles.brand}>
                イベント・予定管理
              </Link>
            </div>
          </header>
          <main className={styles.main}>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
