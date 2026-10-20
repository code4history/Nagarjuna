/**
 * NagaIME 専用の style（oct26-m7-t1 設計 §3.2-3・nov26-m3-t2 で Shadow DOM へ移した）。
 *
 * - `<naga-ime>` の影の中に閉じる（`<style data-naga-style>` を影の中に 1 つ置く。document.head には入れない）。
 *   selector は `.naga-` か `:host` で始める（legacy の `ime-*` / 利用者の CSS と衝突させない・AC6）。
 * - 影の中の最上位 `.naga-root` に `all: initial` を当て、ページの継承性質を断つ。`all` は `direction` と
 *   custom property を戻さないので `direction` は明示し、`--naga-*` は popup / trigger の要素上で宣言する。
 * - 寸法は px で書く（rem・em を使わない。ページの `html { font-size }` に引きずられないため）。
 * - 書体は FontLoader が読む family（NINJAL Hentaigana / Noto Sans Siddham / Noto Sans JP）を使う。
 *   @font-face は FontLoader 側が注入するため、ここでは宣言しない。
 * - 見た目は PoC（Playground/NextNaga/css/naga-ime.css）に合わせる。PoC の状態 class
 *   `is-active` / `is-selected` は接頭辞規則のため `naga-is-active` / `naga-is-selected` に改めた。
 */
export const NAGA_STYLE_TEXT = `
:host {
  display: contents;
}
:host([hidden]) {
  display: none;
}
.naga-root {
  all: initial;
  display: contents;
  direction: ltr;
}

.naga-popup,
.naga-trigger {
  --naga-special-font: 'NINJAL Hentaigana', 'Noto Sans Siddham', 'Noto Sans JP', serif;
  --naga-accent: #5b4a8a;
}

.naga-popup[hidden],
.naga-trigger[hidden],
.naga-search-row[hidden],
.naga-list[hidden] {
  display: none !important;
}

/* 起動ボタンは文書の座標で置く（positionTrigger が top/left に文書座標を書く）。
   fixed ＋ JS 追随は iOS の visual viewport とずれる（NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430）。
   host と .naga-root が display: contents なので、position を持つ祖先が無ければ包含ブロックは文書になる。 */
.naga-trigger {
  position: absolute;
  z-index: 9998;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: var(--naga-accent);
  font-family: var(--naga-special-font);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.55;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: opacity 0.15s;
  padding: 0;
}
.naga-trigger:hover,
.naga-trigger:focus-visible {
  opacity: 1;
}

/* popup も文書の座標で置く（positionPopup が top/left に文書座標を書く）。
   狭幅は欄のすぐ下、広幅はキャレットの行の下。fixed ＋ visualViewport の offset は iOS のキーボードで
   ずれる（NOV26-IM-NAGA-POPUP-ANCHOR-0432）。包含ブロックは .naga-root が display: contents なので、
   position を持つ祖先が無ければ文書になる。 */
.naga-popup {
  position: absolute;
  z-index: 9999;
  box-sizing: border-box;
  background: #fff;
  color: #333;
  border: 1px solid #d0d0d0;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  text-align: left;
}

.naga-titlebar {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #eee;
  flex: none;
}
.naga-tabs {
  display: flex;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
}
.naga-close {
  flex: none;
  border: none;
  background: none;
  font-size: 18px;
  line-height: 1;
  padding: 0 12px;
  cursor: pointer;
  color: #999;
  border-left: 1px solid #eee;
}
.naga-close:hover {
  color: #333;
  background: #f5f5f5;
}
.naga-tab {
  flex: 1 0 auto;
  border: none;
  background: none;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.naga-tab.naga-is-active {
  color: var(--naga-accent);
  border-bottom-color: var(--naga-accent);
  font-weight: 600;
}

/*
 * 非 dock（PC）で隠す・構造の selector は base に置く（nov26-m3-t3 タスク設計 §1 の 4-2 の定め直し）。
 * dock 専用の見た目は下の .naga-popup.naga-is-docked スコープに置く。
 */
.naga-fold {
  display: none;
  flex: none;
  border: none;
  background: none;
  font-size: 16px;
  line-height: 1;
  padding: 0 12px;
  cursor: pointer;
  color: #666;
  border-left: 1px solid #eee;
}
.naga-copy {
  display: none;
}

/*
 * 読み入力欄の行（是正設計 v2 §5「区別の付け方」）。
 * 行は flex（nov26-m3-t3: a11y の木から要素を落としうる contents の箱をやめた）。PC では input が
 * 行いっぱいに広がり、外余白 8px で従来と同じ位置に来る（e2e の P-8）。ラベルは PC では出さない。
 */
.naga-search-row {
  display: flex;
  flex: none;
}
.naga-search-label {
  display: none;
}

.naga-search {
  margin: 8px;
  padding: 8px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
.naga-search:focus {
  outline: 2px solid var(--naga-accent);
  outline-offset: -1px;
}

.naga-list {
  overflow-y: auto;
  max-height: 260px;
  min-height: 60px;
}

.naga-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.naga-item.naga-is-selected {
  background: #efeafa;
}
.naga-item:hover {
  background: #f5f5f5;
}
.naga-item.naga-is-selected:hover {
  background: #efeafa;
}

.naga-num {
  width: 14px;
  font-size: 11px;
  color: #aaa;
  text-align: right;
  flex: none;
}

.naga-char {
  font-family: var(--naga-special-font);
  font-size: 26px;
  line-height: 1.2;
  min-width: 36px;
  text-align: center;
  flex: none;
}

.naga-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.naga-reading {
  font-size: 13px;
  color: #333;
}
.naga-desc {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.naga-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.naga-hint {
  flex: none;
  padding: 5px 10px;
  font-size: 10px;
  color: #aaa;
  border-top: 1px solid #eee;
  background: #fafafa;
}

/*
 * モバイル dock（是正設計 v2 §3・§4 案 A・§5、nov26-m3-t3 タスク設計 §3.1〜§3.3）。
 * ここから下の規則はすべて .naga-popup.naga-is-docked スコープに閉じる（PC 非影響）。
 * 高さの静的な viewport 比指定（旧 dock ルールの vh 値）は使わない。--naga-dock-max は
 * positionPopup() が visualViewport の実測から毎回設定する（未設定時のみ既定 204px）。
 * 各行の高さは naga-ime.ts の DOCK_*_PX と一致させる（タイトル 34・写し 22・読み欄 36・候補 44・枠 2）。
 */
.naga-popup.naga-is-docked {
  /* 画面の下に据え付けた板（「ふわふわ浮いて」への対応）: 左右いっぱい・上端のアクセントの線・上向きの影 */
  border: none;
  border-top: 2px solid var(--naga-accent);
  border-radius: 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.18);
  max-height: var(--naga-dock-max, 204px); /* 未設定時の既定（0436: 写しの行を外して 204） */
}
/* 縮むのは内側の list だけ（タイトル行・読み欄は潰さない） */
.naga-popup.naga-is-docked .naga-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.naga-popup.naga-is-docked .naga-hint {
  display: none;
}
/* タイトル行: 背景と下線で「ヘッダー帯」に見せ、候補領域の白と分ける */
.naga-popup.naga-is-docked .naga-titlebar {
  box-sizing: border-box;
  height: 34px;
  background: #fafafa;
  border-bottom: 1px solid #e2e2e2;
}
.naga-popup.naga-is-docked .naga-tab {
  padding: 0 10px;
  font-size: 15px;
  line-height: 20px;
}
.naga-popup.naga-is-docked .naga-close,
.naga-popup.naga-is-docked .naga-fold {
  padding: 0 14px;
}
.naga-popup.naga-is-docked .naga-fold {
  display: block;
}
/*
 * 【NOV26-IM-NAGA-POPUP-REFOCUS-0436】挿入先の写し（欄の中身を ↵ で 1 行に詰めた文脈の表示）は、
 * 狭幅では出さない。実機の「元フォームと IME の間にわかりにくい文字列が表示され、狭いのに場所を取る」
 * への対応 ∴ dock スコープに表示規則を置かない（base の display: none のまま）。行の高さ 22px も
 * naga-ime.ts の DOCK_FIXED_PX から外してある（高さの計算にも入れない）。
 */
/* 読み入力欄: アクセント縦線＋「読み」ラベルで本体の入力欄と見分ける（高さは 1 行のまま） */
.naga-popup.naga-is-docked .naga-search-row {
  box-sizing: border-box;
  height: 30px;
  align-items: stretch;
  margin: 3px 8px;
  border: 1px solid #ccc;
  border-left: 3px solid var(--naga-accent);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}
.naga-popup.naga-is-docked .naga-search-label {
  display: flex;
  align-items: center;
  flex: none;
  padding: 0 8px;
  font-size: 12px;
  line-height: 1;
  color: var(--naga-accent);
  background: #f3f0fa;
  border-right: 1px solid #e4dff2;
}
.naga-popup.naga-is-docked .naga-search {
  box-sizing: border-box;
  margin: 0;
  border: none;
  border-radius: 0;
  font-size: 16px; /* iOS の focus 時自動ズームを避ける下限 */
  line-height: 20px;
  padding: 4px 10px;
}
.naga-popup.naga-is-docked .naga-search:focus {
  outline-offset: -2px;
}
/* 候補行: 44px/行（タップの的の大きさ） */
.naga-popup.naga-is-docked .naga-item {
  box-sizing: border-box;
  height: 44px;
  padding: 5px 10px;
}
`;

/** 影の中の `<style>` に付ける印（テストが引く）。 */
export const NAGA_STYLE_ATTRIBUTE = 'data-naga-style';
