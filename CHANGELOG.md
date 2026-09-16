# Changelog

このプロジェクトの主な変更を記録します。版数は [Semantic Versioning](https://semver.org/) に従います。
Notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 1.1.0

### 追加 / Added

- `nagarjuna/ime` に `NagaIME` を追加しました。明示 trigger（起動ボタン・Ctrl+J / Cmd+J）、読みと説明文による検索、カテゴリタブ（最近・変体仮名・悉曇・仏名・異体字・組文字）、最近使った文字、キャレット位置への挿入（`setRangeText()` と bubbles な `input` event）、連続入力、狭い viewport での下部ドッキングを提供します。辞書は従来どおり package に同梱し（fetch しません）、書体は `FontLoader` で読み込みます。
- Added `NagaIME` to `nagarjuna/ime`: an on-demand special-character picker (trigger button / Ctrl+J / Cmd+J, search by reading or description, category tabs, recent characters, caret insertion via `setRangeText()` with a bubbling `input` event, continuous input, bottom docking on narrow viewports). The dictionary stays bundled with the package and fonts are loaded with `FontLoader`.
- 型 `NagaIMEOptions`・`NagaCandidate`・`NagaCategoryId` を追加しました。 / Added the types `NagaIMEOptions`, `NagaCandidate` and `NagaCategoryId`.
- NagaIME の demo ページ `naga.html` を追加しました。 / Added the NagaIME demo page `naga.html`.

### 非推奨 / Deprecated

`IMEManager`、`IIMEManager`、`IMEOptions`、`IMEAttachOptions`、`onChange`、`updateOptions`、および legacy custom element `<ime-ui>` は非推奨です。1.1.0 では後方互換のまま維持します。`IMEManager` または `<ime-ui>` を使用すると、同一プロセスで 1 回だけ `console.warn` に `[nagarjuna] DEPRECATED: …` を出力します。1.1.0 にこの警告の抑止オプションはありません。新規実装では `NagaIME` と対象 input / textarea の `input` event を使用してください。これらの legacy API は **2.0.0 でも維持**し、**3.0.0 で削除予定**です。

注意: `nagarjuna/ime` を import すると、`NagaIME` だけを使う場合でも legacy の `<ime-ui>` custom element が登録されます。同一の input / textarea に `IMEManager` と `NagaIME` を同時に attach する使い方はサポートしません。

`IMEManager`, `IIMEManager`, `IMEOptions`, `IMEAttachOptions`, `onChange`, `updateOptions` and the legacy custom element `<ime-ui>` are deprecated. They keep working unchanged in 1.1.0, will still be kept in 2.0.0, and are scheduled for removal in 3.0.0. Using `IMEManager` or `<ime-ui>` prints `[nagarjuna] DEPRECATED: …` once per process via `console.warn`; there is no option to suppress it in 1.1.0. Use `NagaIME` and the `input` event of the target input / textarea for new code.

### 変更 / Changed

- テスト環境: `tests/setup.ts` が vitest の jsdom 環境の `document` を別の JSDOM で上書きしないようにしました（`<ime-ui>` が昇格しない問題の是正。公開 API への影響はありません）。 / Test setup no longer replaces the jsdom environment's `document` with a separate JSDOM instance (no public API impact).
- 配布物に `CHANGELOG.md` を含めるようにしました。 / `CHANGELOG.md` is now included in the published package.
