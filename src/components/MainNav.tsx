"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MainNav.module.css";

const LINKS = [
  { href: "/", label: "一覧" },
  { href: "/calendar", label: "カレンダー" },
] as const;

type Current = (typeof LINKS)[number]["href"] | null;

/** 一覧とカレンダーの切り替え（要件定義書 5. 画面）。今いる方に印を付ける */
export function MainNav() {
  const pathname = usePathname();
  const current = pathname.startsWith("/calendar") ? "/calendar" : pathname === "/" ? "/" : null;
  return <MainNavLinks current={current} />;
}

/**
 * リンクだけの部分。URL を読む前（事前描画した外側の部分）は印なしで出す。
 * MainNav は URL を読むので、layout では <Suspense> の中に置き、これを代わりに出しておく
 */
export function MainNavLinks({ current }: { current: Current }) {
  return (
    <nav aria-label="表示の切り替え">
      <ul className={styles.links}>
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={styles.link}
              aria-current={current === href ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
