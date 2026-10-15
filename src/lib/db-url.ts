// DB の接続文字列に、コネクションプールの設定の既定値を足す（Prisma の MariaDB ドライバーにそのまま渡る）

/**
 * DB に届かないときに、接続を待つ上限（ミリ秒）。ドライバーの既定の 10 秒では、
 * 保存に失敗したことが分かるまで長いので短くする（要件定義書 F-05）。接続文字列で指定があればそちらを使う
 */
const ACQUIRE_TIMEOUT_MS = 3000;

export function withPoolDefaults(url: string): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("acquireTimeout")) {
    parsed.searchParams.set("acquireTimeout", String(ACQUIRE_TIMEOUT_MS));
  }
  return parsed.toString();
}
