/**
 * NagaIME モバイル dock の機械判定（oct26-m7-t1 是正設計 v2 §7.2 AC10 / §7.3）。
 *
 * 是正の要点は「静的な vh で画面を満たす」のをやめ、ソフトキーボード表示中の
 * 残り可視高（visualViewport.height）から popup の高さを逆算することである。
 * jsdom は layout を持たないため、ここで測るのは「レイアウトの実物」ではなく
 * 「仕組み」（style へ書かれる値・class・textContent）である（設計 §7.2 の但し書き）。
 *
 * 採用案は案 A（縦リスト圧縮＋タブ一文字表記。設計 §4・§8.2-2 の既定）。
 * 割り付け（設計 §3.3）: タブ 40 ＋ 読み 40 ＋ 候補 3 行 ×44 ＋ 境界 2 = 224px、
 * 本体入力欄の可視最小確保分 H_CTX = 48px、キーボード上端との間隔 8px。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';
import { NAGA_STYLE_TEXT } from '@/lib/ime/naga-styles';
import { NAGA_CATEGORIES } from '@/lib/ime/naga-dictionary';

/** 辞書（生成済み dictionary.ts）の動的 import を伴うので既存テストと同じ猶予を与える。 */
const DICTIONARY_TEST_TIMEOUT_MS = 8000;

/** 設計 §3.3 の割り付け（実装の private const と一致していることを外から確かめる値）。 */
const H_CTX = 48;
const DOCK_GAP = 8;
const PLAN_A_MAX = 224;

const originalVisualViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');

interface ViewportStub {
  width: number;
  height: number;
  offsetTop: number;
}

/** visualViewport と window.inner* を差し替える（キーボード表示中の状態を作る）。 */
function stubViewport({ width, height, offsetTop = 0, innerHeight }: ViewportStub & { innerHeight: number }): void {
  const vv = {
    width,
    height,
    offsetTop,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true });
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true, writable: true });
}

function restoreViewport(): void {
  if (originalVisualViewport) Object.defineProperty(window, 'visualViewport', originalVisualViewport);
  else Reflect.deleteProperty(window, 'visualViewport');
  if (originalInnerWidth) Object.defineProperty(window, 'innerWidth', originalInnerWidth);
  if (originalInnerHeight) Object.defineProperty(window, 'innerHeight', originalInnerHeight);
}

function popupOf(): HTMLElement {
  return document.body.querySelector('.naga-popup') as HTMLElement;
}

function tabTextsOf(): string[] {
  return Array.from(popupOf().querySelectorAll('.naga-tab')).map((t) => (t as HTMLElement).textContent ?? '');
}

function itemsOf(): HTMLElement[] {
  return Array.from(popupOf().querySelectorAll('.naga-item')) as HTMLElement[];
}

/** iPhone 標準級（390×844）でかなキーボードが出ている状態。残り可視高 480px。 */
const PHONE_KEYBOARD = { width: 390, height: 480, offsetTop: 0, innerHeight: 844 };

describe('NagaIME モバイル dock（AC10）', () => {
  let field: HTMLInputElement;
  let ime: NagaIME;

  beforeEach(() => {
    localStorage.clear();
    field = document.createElement('input');
    field.type = 'text';
    document.body.append(field);
    ime = new NagaIME({ loadFonts: false });
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    restoreViewport();
    vi.restoreAllMocks();
  });

  it('AC10-a: 静的な 45vh / 30vh を持たず、dock の高さは JS 設定（var）と flex に依る', () => {
    expect(NAGA_STYLE_TEXT).not.toContain('45vh');
    expect(NAGA_STYLE_TEXT).not.toContain('30vh');
    expect(NAGA_STYLE_TEXT).toContain('.naga-popup.naga-is-docked');
    // dock の max-height は JS が実測で設定する custom property（未設定時のみ案 A の既定へ落ちる）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s*\{[^}]*max-height:\s*var\(--naga-dock-max/);
    // 内側の list だけが縮む（flex: 1 1 auto; min-height: 0）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-list\s*\{[^}]*flex:\s*1\s+1\s+auto/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-list\s*\{[^}]*min-height:\s*0/);
    // PC（non-docked）の list は従来どおり 260px 固定（後退していない）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-list\s*\{[^}]*max-height:\s*260px/);
  });

  it(
    'AC10-c: dock 時 bottom はキーボード上端＋8px、max-height は min(案上限, vvAvail − H_CTX)',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.classList.contains('naga-is-docked')).toBe(true);
      expect(pop.style.position).toBe('fixed');
      // H_kb = 844 − (480 + 0) = 364 → bottom = 372
      expect(pop.style.bottom).toBe(`${844 - 480 + DOCK_GAP}px`);
      // min(224, 480 − 48) = 224
      expect(pop.style.maxHeight).toBe(`${PLAN_A_MAX}px`);
      expect(pop.style.getPropertyValue('--naga-dock-max')).toBe(`${PLAN_A_MAX}px`);
      expect(pop.style.getPropertyValue('--naga-dock-avail')).toBe('480px');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'AC10-c: 残り可視高が小さい機種では vvAvail − H_CTX まで縮む（本体入力欄の帯を必ず残す）',
    async () => {
      // 横持ち SE 級: 残り可視高 200px
      stubViewport({ width: 390, height: 200, offsetTop: 0, innerHeight: 375 });
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      // min(224, 200 − 48) = 152
      expect(pop.style.maxHeight).toBe(`${200 - H_CTX}px`);
      // popup の上に残る帯（vvAvail − gap − popupMax）が H_CTX − gap 以上ある
      const clearance = 200 - DOCK_GAP - (200 - H_CTX);
      expect(clearance).toBeGreaterThanOrEqual(H_CTX - DOCK_GAP);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'AC10-c: キーボード開閉（visualViewport の変化）に追従して max-height を測り直す',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      expect(popupOf().style.maxHeight).toBe(`${PLAN_A_MAX}px`);

      // キーボードが閉じた（残り可視高が 844 に戻る）
      stubViewport({ width: 390, height: 844, offsetTop: 0, innerHeight: 844 });
      window.dispatchEvent(new Event('resize'));
      const pop = popupOf();
      expect(pop.style.bottom).toBe(`${DOCK_GAP}px`);
      expect(pop.style.maxHeight).toBe(`${PLAN_A_MAX}px`);

      // より大きなキーボード（残り可視高 240px）
      stubViewport({ width: 390, height: 240, offsetTop: 0, innerHeight: 844 });
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe(`${240 - H_CTX}px`);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'AC10-b: dock 時は非選択タブが一文字・選択タブだけ正式名称',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);

      // 最近が空なので既定の選択は先頭カテゴリ（変体仮名）
      expect(tabTextsOf()).toEqual(['近', '変体仮名', '悉', '仏', '異', '組']);

      const siddham = popupOf().querySelector('.naga-tab[data-category="siddham"]') as HTMLButtonElement;
      siddham.click();
      expect(tabTextsOf()).toEqual(['近', '変', '悉曇', '仏', '異', '組']);

      // 正式名称は支援技術・長押しのために aria-label / title で常に取れる
      expect(siddham.getAttribute('aria-label')).toBe('悉曇');
      expect(siddham.title).toBe('悉曇');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'AC10-b: dock ↔ PC の遷移でタブ表示名が戻る（PC は常に正式名称）',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      expect(tabTextsOf()).toEqual(['近', '変体仮名', '悉', '仏', '異', '組']);

      // 回転・ウィンドウ拡大などで dockBreakpoint(560) を上へ跨ぐ
      stubViewport({ width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().classList.contains('naga-is-docked')).toBe(false);
      expect(tabTextsOf()).toEqual(['最近', '変体仮名', '悉曇', '仏名', '異体字', '組文字']);

      // 下へ跨ぎ直すと再び一文字へ
      stubViewport(PHONE_KEYBOARD);
      window.dispatchEvent(new Event('resize'));
      expect(tabTextsOf()).toEqual(['近', '変体仮名', '悉', '仏', '異', '組']);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'AC10-d: PC（non-docked）では dock 用の style を一切書かない',
    async () => {
      stubViewport({ width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.classList.contains('naga-is-docked')).toBe(false);
      expect(pop.style.position).toBe('absolute');
      expect(pop.style.maxHeight).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-max')).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-avail')).toBe('');
      expect(tabTextsOf()).toEqual(['最近', '変体仮名', '悉曇', '仏名', '異体字', '組文字']);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '§7.3: dock 中に候補をタップすると確定し、開いたまま次の候補を続けて入れられる',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      field.focus();
      await ime.open(field);

      const first = itemsOf()[0];
      expect(first).toBeTruthy();
      const firstChar = first.dataset.char!;
      first.click();
      expect(field.value).toBe(firstChar);
      expect(ime.isOpen).toBe(true);
      expect(popupOf().classList.contains('naga-is-docked')).toBe(true);
      // 確定のたびに逆算し直す（キーボードが出たままでも高さが崩れない）
      expect(popupOf().style.maxHeight).toBe(`${PLAN_A_MAX}px`);

      const next = itemsOf()[1];
      const nextChar = next.dataset.char!;
      next.click();
      expect(field.value).toBe(`${firstChar}${nextChar}`);
      expect(ime.isOpen).toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it('カテゴリ定義は一文字の短縮名を持つ（タブ表示名の出どころ）', () => {
    expect(NAGA_CATEGORIES.map((c) => c.short)).toEqual(['変', '悉', '仏', '異', '組']);
    for (const c of NAGA_CATEGORIES) expect(c.short.length).toBe(1);
  });

  it('区別の付け方（設計 §5）は dock スコープの CSS だけで足りている', () => {
    // 読み入力欄: アクセント縦線と「読み」ラベル
    expect(NAGA_STYLE_TEXT).toContain('.naga-popup.naga-is-docked .naga-search-row');
    expect(NAGA_STYLE_TEXT).toContain('.naga-popup.naga-is-docked .naga-search-label');
    // タブ帯: 背景で候補領域の白と分ける
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-titlebar\s*\{[^}]*background/);
  });

  it(
    '読み入力欄は「読み」ラベルと aria-label を持ち、PC では行を増やさない（display: contents）',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);

      const row = popupOf().querySelector('.naga-search-row') as HTMLElement;
      expect(row).toBeTruthy();
      const label = row.querySelector('.naga-search-label') as HTMLElement;
      expect(label.textContent).toBe('読み');
      const search = row.querySelector('.naga-search') as HTMLInputElement;
      expect(search.getAttribute('aria-label')).toBe('読みを入力');
      // PC では wrapper が display: contents なので従来と同じ 1 行のまま
      expect(NAGA_STYLE_TEXT).toMatch(/\.naga-search-row\s*\{[^}]*display:\s*contents/);
      expect(NAGA_STYLE_TEXT).toMatch(/\.naga-search-label\s*\{[^}]*display:\s*none/);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});
