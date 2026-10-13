# イベント・予定管理アプリ（events）

イベント・予定を登録し、日時とステータス（予定／進行中／完了）で管理する Web アプリです。Next.js・Prisma・MySQL で作ります。

要件は [docs/要件定義書.md](docs/要件定義書.md) を、開発ルールは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 必要なもの

- Node.js 24
- Docker（開発用の MySQL を動かす）

## 起動方法

クローンしたら最初に 1 回だけ実行します。

```
git config core.hooksPath .githooks
cp .env.example .env
npm ci
```

毎回の起動：

```
docker compose up -d   # MySQL（ポート 3306）
npm run dev            # 画面と API（http://localhost:3000）
```

http://localhost:3000/api/health が `{"status":"ok"}` を返せば、DB までつながっています。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動（3000 番） |
| `npm run build` | 本番用にビルド |
| `npm run lint` | ESLint（警告もエラー扱い） |
| `npm run typecheck` | TypeScript の型チェック |
| `npm test` | ユニットテスト（Vitest） |
| `npm run format` / `npm run format:check` | Prettier で整形／整形済みか確認 |
| `npm run db:migrate` | `prisma/schema.prisma` の変更からマイグレーションを作って DB に反映 |

`npm ci` のあとに `prisma generate` が自動で実行され、`src/generated/prisma` に Prisma Client が作られます（git には入れません）。

## フォルダ構成

| フォルダ・ファイル | 役割 |
| --- | --- |
| src/app/ | 画面と API（`api/` の下の Route Handler） |
| src/lib/ | DB への接続など、画面と API で使う処理 |
| prisma/ | テーブル定義とマイグレーション |
| tests/unit/ | ユニットテスト |
| compose.yaml, docker/ | 開発用の MySQL |
| docs/ | 要件定義書 |
