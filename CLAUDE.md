# Claude Code への指示

@CONTRIBUTING.md
@AGENTS.md

上の開発ルールは **例外なく厳守する**。ユーザーに急ぎと言われても、変更が 1 行でも同じ。

## 作業を始める前に必ずやること

1. `git config core.hooksPath` が `.githooks` か確かめる。違えば `git config core.hooksPath .githooks` を実行する
2. 対応する Issue を確かめる（`gh issue list`）。なければ `gh issue create` で立ててから作業する
3. `git switch main` → `git pull` → `git switch -c <種類>/<Issue 番号>-<短い説明>` でブランチを切る

## してはいけないこと

- main でファイルを変更してコミットすること、main へ push すること
- `--no-verify`、`git config core.hooksPath` の変更、force push でフックやルールを回避すること
- フックに拒否されたときに回避策を探すこと。拒否されたら上の手順に戻る
- ユーザーの了承なしに PR をマージすること。PR を作ったら URL を伝えて指示を待つ
- 下の「サーバーのポート」と違うポートでサーバーを起動すること

## サーバーのポート

動作確認などでサーバーを起動するときは、必ず次のポートを使う。

| サーバー | ポート | 決めている場所 |
| --- | --- | --- |
| データベース（MySQL） | 3306 | [compose.yaml](compose.yaml) |
| 画面と API（Next.js） | 3000 | Next.js の既定値（`-p` や環境変数 `PORT` は指定しない） |

- ポートが使われていたら、そのポートを使っているプロセスを止めてから、上のポートで起動し直す
- 別のポートでの一時起動（`-p`、`--port`、環境変数 `PORT` など）はしない
- 接続先などを差し替えた一時的な設定ファイルで起動しない

## PR を作るとき

- タイトルは変更内容を日本語で短く書く（squash マージ後のコミットメッセージになる）
- 本文はテンプレートに従い、`Closes #<Issue 番号>` を必ず書く
