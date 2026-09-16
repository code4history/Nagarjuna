/**
 * NagaIME 専用の style（oct26-m7-t1 設計 §3.2-3）。
 *
 * - selector はすべて `.naga-` で始める（legacy の `ime-*` / 利用者の CSS と衝突させない・AC6）。
 * - global `:root` へ custom property を足さない。`--naga-*` は popup / trigger の要素上だけに置く。
 * - 書体は FontLoader が読む family（NINJAL Hentaigana / Noto Sans Siddham / Noto Sans JP）を使う。
 *   @font-face は FontLoader 側が注入するため、ここでは宣言しない。
 * - 見た目は PoC（Playground/NextNaga/css/naga-ime.css）に合わせる。PoC の状態 class
 *   `is-active` / `is-selected` は接頭辞規則のため `naga-is-active` / `naga-is-selected` に改めた。
 */
export const NAGA_STYLE_TEXT = `
.naga-popup,
.naga-trigger {
  --naga-special-font: 'NINJAL Hentaigana', 'Noto Sans Siddham', 'Noto Sans JP', serif;
  --naga-accent: #5b4a8a;
}

.naga-popup[hidden],
.naga-trigger[hidden] {
  display: none !important;
}

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
 * 読み入力欄の行（是正設計 v2 §5「区別の付け方」）。
 * PC（non-docked）では display: contents なので、input は従来どおり popup 直下の
 * flex item として並び、行も高さも増えない。ラベルは PC では出さない。
 */
.naga-search-row {
  display: contents;
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
  flex: none;
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
 * モバイル dock（是正設計 v2 §3「使える高さからの逆算」・§4 案 A・§5・§6.2）。
 * ここから下の規則はすべて .naga-popup.naga-is-docked スコープに閉じる（PC 非影響）。
 * 高さの静的な viewport 比指定（旧 dock ルールの vh 値）は廃止した。--naga-dock-max は
 * positionPopup() が visualViewport の実測から毎回設定する（未設定時のみ案 A の既定 224px）。
 */
.naga-popup.naga-is-docked {
  border-radius: 12px 12px 0 0;
  max-height: var(--naga-dock-max, 224px);
}
/* 縮むのは内側の list だけ（タブ帯と読み入力欄は潰さない） */
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
/* タブ帯: 背景と下線で「ヘッダー帯」に見せ、候補領域の白と分ける（高さは増やさない） */
.naga-popup.naga-is-docked .naga-titlebar {
  background: #fafafa;
  border-bottom: 1px solid #e2e2e2;
}
.naga-popup.naga-is-docked .naga-tab {
  padding: 9px 12px;
  font-size: 15px;
  line-height: 1.25;
}
.naga-popup.naga-is-docked .naga-close {
  padding: 0 14px;
}
/* 読み入力欄: アクセント縦線＋「読み」ラベルで本体の入力欄と見分ける（高さは 1 行のまま） */
.naga-popup.naga-is-docked .naga-search-row {
  display: flex;
  align-items: stretch;
  flex: none;
  margin: 6px 8px;
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
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  font-size: 16px; /* iOS の focus 時自動ズームを避ける下限 */
  padding: 7px 10px;
}
.naga-popup.naga-is-docked .naga-search:focus {
  outline-offset: -2px;
}
/* 候補行: 44px/行（設計 §3.3）。max-height 224px で 3 件強が見える */
.naga-popup.naga-is-docked .naga-item {
  box-sizing: border-box;
  min-height: 44px;
  padding: 5px 10px;
}
`;

const STYLE_ATTRIBUTE = 'data-naga-style';

/** 文書に NagaIME の style が無ければ 1 つだけ入れる（複数インスタンスで共有する）。 */
export function ensureNagaStyle(doc: Document = document): void {
  if (doc.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)) return;
  const style = doc.createElement('style');
  style.setAttribute(STYLE_ATTRIBUTE, '');
  style.textContent = NAGA_STYLE_TEXT;
  doc.head.appendChild(style);
}
