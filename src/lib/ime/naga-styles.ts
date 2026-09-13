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

.naga-popup.naga-is-docked {
  border-radius: 12px 12px 0 0;
  max-height: 45vh;
}
.naga-popup.naga-is-docked .naga-list {
  max-height: 30vh;
}
.naga-popup.naga-is-docked .naga-hint {
  display: none;
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
