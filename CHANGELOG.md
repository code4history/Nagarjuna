# Changelog

このプロジェクトの主な変更を記録します。版数は [Semantic Versioning](https://semver.org/) に従います。
Notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-05

1.1.0-rc.3 と同じ内容の正式版です（版番号のみ変更）。変更点は 1.1.0-rc.3 までの各項を参照してください。

The stable release with the same content as 1.1.0-rc.3 (version number only). See the entries up to 1.1.0-rc.3 for the changes.

## [1.1.0-rc.3] - 2026-10-01

1.1.0 の位置づけを変更しました。**正式な IME は従来どおり `IMEManager` / `<ime-ui>` です。** 新しい IME UI（`NagaIME`）は次のトレインで公開する予定で、1.1.0 ではデモ上のプレビューとしてのみ提供します（API は公開しません）。1.1.0-rc.1 に記載した内容のうち、`NagaIME` の追加（「追加」）と legacy IME の非推奨化（「非推奨」）は、この版で取り消しました。1.1.0-rc.2 は npm に公開していません（欠番）。

The positioning of 1.1.0 has changed. **The official IME remains `IMEManager` / `<ime-ui>`.** The new IME UI (`NagaIME`) is planned for the next release train; in 1.1.0 it is offered only as a preview in the demo, and its API is not public. Of the items listed under 1.1.0-rc.1, the addition of `NagaIME` ("Added") and the deprecation of the legacy IME ("Deprecated") are reverted in this version. 1.1.0-rc.2 was not published to npm (skipped).

### 取り消し / Reverted (1.1.0-rc.1)

- `nagarjuna/ime` への `NagaIME` と型 `NagaIMEOptions`・`NagaCandidate`・`NagaCategoryId` の追加を取り消しました。`nagarjuna/ime` はこれらを export しません（公開 API は 1.0.0 と同じです）。 / Reverted the addition of `NagaIME` and the types `NagaIMEOptions`, `NagaCandidate` and `NagaCategoryId` to `nagarjuna/ime`; they are not exported (the public API is the same as 1.0.0).
- `IMEManager`・`IIMEManager`・`IMEOptions`・`IMEAttachOptions`・`onChange`・`updateOptions`・`<ime-ui>` の非推奨化を取り消しました。`@deprecated` を外し、`console.warn` の非推奨警告も出しません。「2.0.0 でも維持・3.0.0 で削除予定」とした予定も撤回します。 / Reverted the deprecation of `IMEManager`, `IIMEManager`, `IMEOptions`, `IMEAttachOptions`, `onChange`, `updateOptions` and `<ime-ui>`: the `@deprecated` tags are removed, no deprecation warning is printed via `console.warn`, and the announced "kept in 2.0.0, removed in 3.0.0" schedule is withdrawn.

### 追加 / Added

- 次のトレインで公開予定の新しい IME UI（NagaIME）のプレビューを、デモの `naga.html` に置きました。API は公開されておらず、変更される可能性があります。 / Added a preview of the new IME UI (NagaIME) planned for the next release train to the demo as `naga.html`. Its API is not public and may change.

### 変更 / Changed

- デモのトップ（`index.html`）は従来どおり `IMEManager` / `<ime-ui>` の IME デモです。トップから `naga.html`（新 UI のプレビュー）へリンクしています。1.1.0-rc.2 で行ったトップの入れ替えと `legacy.html` は取り消しました。 / The demo top page (`index.html`) remains the `IMEManager` / `<ime-ui>` IME demo and links to `naga.html` (the new UI preview). The top-page swap and `legacy.html` from 1.1.0-rc.2 are reverted.
- テスト: `<ime-ui>` を直接接続するテストに個別の時間制限を付けました（1.1.0-rc.2 から引き継ぎ。公開 API への影響はありません）。 / Test: gave the direct `<ime-ui>` connection test its own timeout (carried over from 1.1.0-rc.2; no public API impact).

### 1.1.0 のまとめ（1.0.0 からの変更）/ Summary of 1.1.0 (changes since 1.0.0)

- 公開 API は 1.0.0 と同じです（`nagarjuna`: `FontLoader`・`FontSettings`、`nagarjuna/ime`: `IMEManager`・`IMEOptions`・`IMEAttachOptions`・`IIMEManager`）。非推奨になった API はありません。 / The public API is the same as 1.0.0 (`nagarjuna`: `FontLoader`, `FontSettings`; `nagarjuna/ime`: `IMEManager`, `IMEOptions`, `IMEAttachOptions`, `IIMEManager`). Nothing is deprecated.
- デモに新しい IME UI のプレビュー（`naga.html`）を追加しました（API は非公開）。 / Added a preview of the new IME UI to the demo (`naga.html`; API not public).
- 配布物に `CHANGELOG.md` を含めるようにしました。 / `CHANGELOG.md` is now included in the published package.
- テスト環境の是正（公開 API への影響はありません）。 / Test environment fixes (no public API impact).

## [1.1.0-rc.2] - 2026-10-01

> npm には公開していません（欠番）。下記のデモの入れ替えは 1.1.0-rc.3 で取り消しました。 / Not published to npm (skipped). The demo change below is reverted in 1.1.0-rc.3.

### 変更 / Changed

- デモのトップ（`index.html`）を NagaIME にし、非推奨の旧 `IMEManager` / `<ime-ui>` のデモを `legacy.html` へ移しました。旧 URL の `naga.html` はトップへ転送します。 / The demo top page is now NagaIME; the deprecated legacy `IMEManager` / `<ime-ui>` demo moved to `legacy.html`, and `naga.html` redirects to the top page.
- テスト: 負荷の高い環境で時間切れになっていた legacy 警告のテストに、個別の時間制限を付けました（公開 API への影響はありません）。 / Test: gave the legacy-warning test its own timeout (no public API impact).

## [1.1.0-rc.1] - 2026-09-28

### 追加 / Added

> `NagaIME` と型 `NagaIMEOptions`・`NagaCandidate`・`NagaCategoryId` の追加は 1.1.0-rc.3 で取り消しました（1.1.0 には含まれません）。`naga.html` は新 UI のプレビューとして残ります。 / The addition of `NagaIME` and its types is reverted in 1.1.0-rc.3 (not part of 1.1.0); `naga.html` remains as a preview of the new UI.

- `nagarjuna/ime` に `NagaIME` を追加しました。明示 trigger（起動ボタン・Ctrl+J / Cmd+J）、読みと説明文による検索、カテゴリタブ（最近・変体仮名・悉曇・仏名・異体字・組文字）、最近使った文字、キャレット位置への挿入（`setRangeText()` と bubbles な `input` event）、連続入力、狭い viewport での下部ドッキングを提供します。辞書は従来どおり package に同梱し（fetch しません）、書体は `FontLoader` で読み込みます。
- Added `NagaIME` to `nagarjuna/ime`: an on-demand special-character picker (trigger button / Ctrl+J / Cmd+J, search by reading or description, category tabs, recent characters, caret insertion via `setRangeText()` with a bubbling `input` event, continuous input, bottom docking on narrow viewports). The dictionary stays bundled with the package and fonts are loaded with `FontLoader`.
- 型 `NagaIMEOptions`・`NagaCandidate`・`NagaCategoryId` を追加しました。 / Added the types `NagaIMEOptions`, `NagaCandidate` and `NagaCategoryId`.
- NagaIME の demo ページ `naga.html` を追加しました。 / Added the NagaIME demo page `naga.html`.

### 非推奨 / Deprecated

> この非推奨化は 1.1.0-rc.3 で取り消しました（1.1.0 には含まれません）。 / This deprecation is reverted in 1.1.0-rc.3 (not part of 1.1.0).

`IMEManager`、`IIMEManager`、`IMEOptions`、`IMEAttachOptions`、`onChange`、`updateOptions`、および legacy custom element `<ime-ui>` は非推奨です。1.1.0 では後方互換のまま維持します。`IMEManager` または `<ime-ui>` を使用すると、同一プロセスで 1 回だけ `console.warn` に `[nagarjuna] DEPRECATED: …` を出力します。1.1.0 にこの警告の抑止オプションはありません。新規実装では `NagaIME` と対象 input / textarea の `input` event を使用してください。これらの legacy API は **2.0.0 でも維持**し、**3.0.0 で削除予定**です。

注意: `nagarjuna/ime` を import すると、`NagaIME` だけを使う場合でも legacy の `<ime-ui>` custom element が登録されます。同一の input / textarea に `IMEManager` と `NagaIME` を同時に attach する使い方はサポートしません。

`IMEManager`, `IIMEManager`, `IMEOptions`, `IMEAttachOptions`, `onChange`, `updateOptions` and the legacy custom element `<ime-ui>` are deprecated. They keep working unchanged in 1.1.0, will still be kept in 2.0.0, and are scheduled for removal in 3.0.0. Using `IMEManager` or `<ime-ui>` prints `[nagarjuna] DEPRECATED: …` once per process via `console.warn`; there is no option to suppress it in 1.1.0. Use `NagaIME` and the `input` event of the target input / textarea for new code.

### 変更 / Changed

- テスト環境: `tests/setup.ts` が vitest の jsdom 環境の `document` を別の JSDOM で上書きしないようにしました（`<ime-ui>` が昇格しない問題の是正。公開 API への影響はありません）。 / Test setup no longer replaces the jsdom environment's `document` with a separate JSDOM instance (no public API impact).
- 配布物に `CHANGELOG.md` を含めるようにしました。 / `CHANGELOG.md` is now included in the published package.
