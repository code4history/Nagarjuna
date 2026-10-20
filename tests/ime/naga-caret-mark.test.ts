/**
 * 【NOV26-IM-NAGA-CARET-MARK-0437】挿入位置の縦棒（.naga-caret-mark）の単体テスト。
 *
 * popup を開いている間、元の欄の挿入位置（selectionStart。measureCaret(field) の viewport 座標）に
 * 縦棒を出す。popup を開くと focus が読み欄へ移り、元の欄のキャレットが見えなくなるため
 * （人間の提案「IME の表示中はキャレットを目立つように変える」）。
 *
 * jsdom は layout を持たない ∴ measureCaret・getBoundingClientRect・window.scrollX/scrollY を
 * 決め打ちにし、style へ書かれる値・hidden・aria-live の中身だけを測る。実の矩形は e2e の
 * ios-popup.spec.ts（webkit-iphone）と pc-baseline.spec.ts（PC）が見る。
 *
 * あわせて、0436 まであった写し（.naga-copy。欄の直前 12 文字を ↵ で詰めた行）が要素にも CSS にも
 * 残っていないことを確かめる。写しに付いていた aria-live の告知は、確定文字だけを入れる
 * visually-hidden の live region（.naga-live）に置き換えた。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';
import { NAGA_STYLE_TEXT } from '@/lib/ime/naga-styles';

/** 辞書（生成済み dictionary.ts）の動的 import を伴うので既存テストと同じ猶予を与える。 */
const DICTIONARY_TEST_TIMEOUT_MS = 8000;

type NagaTarget = HTMLInputElement | HTMLTextAreaElement;
type Anchor = { x: number; y: number; lineHeight: number };

let ime: NagaIME;
let field: NagaTarget;

function popupOf(): HTMLElement {
  return ime.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
}

function part<T extends HTMLElement = HTMLElement>(selector: string): T {
  return ime.shadowRoot!.querySelector(selector) as T;
}

function caretMark(): HTMLElement {
  return part<HTMLElement>('.naga-caret-mark');
}

function itemsOf(): HTMLElement[] {
  return Array.from(popupOf().querySelectorAll('.naga-item')) as HTMLElement[];
}

/** 欄の getBoundingClientRect を決め打ちにする（jsdom の矩形はすべて 0 のため）。 */
function stubRect(el: Element, rect: { top: number; right: number; bottom: number; left: number }): void {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    }) as DOMRect;
}

/** window.scrollX/scrollY を決め打ちにする（jsdom はスクロールを持たない）。 */
function stubScroll(x: number, y: number): void {
  Object.defineProperty(window, 'scrollX', { configurable: true, get: () => x });
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
}

/** window.innerWidth を差し替える（狭幅の dock を作る）。 */
function stubInnerWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width });
}

/**
 * キャレットの計測を stub する（jsdom は layout を持たない）。null は「測れない」＝ 例外。
 * 返り値の関数で計測値を差し替えられる（確定や resize のあとの置き直しを測るため）。
 */
function stubCaret(anchor: Anchor | null): (next: Anchor | null) => void {
  let current = anchor;
  vi.spyOn(
    ime as unknown as { measureCaret: (f: NagaTarget) => Anchor },
    'measureCaret',
  ).mockImplementation(() => {
    if (!current) throw new Error('キャレットを測れない');
    return current;
  });
  return (next) => {
    current = next;
  };
}

/** 選択位置に比例して横へ進むキャレット（確定で縦棒が右へ動くことを測る）。 */
function stubCaretBySelection(baseX: number, y: number, lineHeight: number): void {
  vi.spyOn(
    ime as unknown as { measureCaret: (f: NagaTarget) => Anchor },
    'measureCaret',
  ).mockImplementation((f: NagaTarget) => ({
    x: baseX + (f.selectionStart ?? 0) * 10,
    y,
    lineHeight,
  }));
}

/** 開いた状態を作る（欄に値を入れ、キャレットを置いて open する）。 */
async function openWith(value: string, caret = value.length, target: NagaTarget = field): Promise<void> {
  target.value = value;
  ime.attach(target);
  target.setSelectionRange(caret, caret);
  await ime.open(target);
}

beforeEach(() => {
  localStorage.clear();
  field = document.createElement('input');
  field.type = 'text';
  document.body.append(field);
  // キャレット（y=120・行の高さ 20）が欄の可視範囲（100〜200）に入る矩形
  stubRect(field, { top: 100, right: 400, bottom: 200, left: 20 });
  stubScroll(40, 300);
  ime = new NagaIME({ loadFonts: false });
});

afterEach(() => {
  ime.destroy();
  field.remove();
  for (const name of ['scrollX', 'scrollY', 'innerWidth']) Reflect.deleteProperty(window, name);
  vi.restoreAllMocks();
});

describe('NagaIME 挿入位置の縦棒（0437）', () => {
  it(
    'popup を開くと縦棒が出て、left/top は measureCaret の座標 ＋ scroll の文書座標・高さは行の高さ',
    async () => {
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あいう');

      const mark = caretMark();
      expect(mark, '縦棒の要素がある').toBeTruthy();
      expect(mark.hidden, '開いている間は見える').toBe(false);
      expect(mark.style.left, 'キャレットの横 ＋ scrollX（文書の座標）').toBe(`${100 + 40}px`);
      expect(mark.style.top, 'キャレットの行の上端 ＋ scrollY（文書の座標）').toBe(`${120 + 300}px`);
      expect(mark.style.height, '高さは measureCaret の lineHeight').toBe('20px');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '狭幅（dock）でも同じように縦棒を出す（広幅・狭幅で扱いを変えない）',
    async () => {
      stubInnerWidth(390);
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あいう');

      expect(popupOf().classList.contains('naga-is-docked'), '前提: 狭幅は dock').toBe(true);
      const mark = caretMark();
      expect(mark.hidden).toBe(false);
      expect(mark.style.left).toBe(`${100 + 40}px`);
      expect(mark.style.top).toBe(`${120 + 300}px`);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '確定で selectionStart が進むと縦棒も右へ進む',
    async () => {
      stubCaretBySelection(100, 120, 20);
      await openWith('あい');
      const before = parseFloat(caretMark().style.left);
      expect(before).toBe(100 + 2 * 10 + 40);

      const item = itemsOf()[0];
      const char = item.dataset.char!;
      item.click();

      expect(field.value).toBe(`あい${char}`);
      const afterCaret = field.selectionStart!;
      expect(afterCaret, '前提: キャレットが進んだ').toBeGreaterThan(2);
      expect(parseFloat(caretMark().style.left), '縦棒もキャレットの進みに追随する').toBe(100 + afterCaret * 10 + 40);
      expect(parseFloat(caretMark().style.left), '縦棒は右へ進む').toBeGreaterThan(before);
      expect(caretMark().hidden).toBe(false);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '確定した文字だけを visually-hidden の live region（.naga-live）に入れる',
    async () => {
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あい');
      const live = part<HTMLElement>('.naga-live');
      expect(live.getAttribute('aria-live'), '写しの aria-live の代替').toBe('polite');
      expect(live.textContent, '開いた直後は空').toBe('');

      const item = itemsOf()[0];
      const char = item.dataset.char!;
      item.click();
      expect(live.textContent, '確定文字だけ（写しの文脈は入れない）').toBe(char);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'close（Escape・×・欄のタップ・detach・teardown）で縦棒を隠す',
    async () => {
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あいう');
      expect(caretMark().hidden).toBe(false);

      // Escape（読み欄の keydown の経路）
      part<HTMLInputElement>('.naga-search').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      expect(ime.isOpen).toBe(false);
      expect(caretMark().hidden, 'Escape で隠れる').toBe(true);

      // 欄のタップ（欄へ focus が戻る）で閉じる経路
      await ime.open(field);
      expect(caretMark().hidden).toBe(false);
      field.focus();
      expect(ime.isOpen).toBe(false);
      expect(caretMark().hidden, '欄のタップで隠れる').toBe(true);

      // detach（欄が無くなれば DOM ごと片付く）
      await ime.open(field);
      expect(caretMark().hidden).toBe(false);
      ime.detach(field);
      const afterDetach = ime.shadowRoot!.querySelector('.naga-caret-mark') as HTMLElement | null;
      expect(afterDetach === null || afterDetach.hidden, 'detach で消える').toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'type="password" の欄では縦棒を出さない',
    async () => {
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      (field as HTMLInputElement).type = 'password';
      await openWith('secret');
      expect(caretMark().hidden).toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'measureCaret が throw しても例外を外へ出さず、縦棒も出さない',
    async () => {
      stubCaret(null);
      ime.attach(field);
      await expect(ime.open(field), '例外を外へ出さない').resolves.toBeUndefined();
      expect(ime.isOpen, 'popup 自体は開く').toBe(true);
      expect(caretMark().hidden).toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'キャレットの行が欄の可視範囲の外（textarea の内部スクロールで見えない行）なら隠す',
    async () => {
      const setCaret = stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あいう');
      expect(caretMark().hidden).toBe(false);

      // 内部スクロールでキャレットの行が欄の上端より上へ出た（measureCaret は scrollTop を引いた値を返す）
      setCaret({ x: 100, y: 90, lineHeight: 20 });
      window.dispatchEvent(new Event('resize'));
      expect(caretMark().hidden, '見えない行では隠す').toBe(true);

      // 見える行へ戻れば resize（popup と同じ置き直しの契機）で出る
      setCaret({ x: 100, y: 120, lineHeight: 20 });
      window.dispatchEvent(new Event('resize'));
      expect(caretMark().hidden).toBe(false);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});

describe('NagaIME 写しの撤去（0437）', () => {
  it(
    '写し（.naga-copy）の要素は影の中に無い',
    async () => {
      stubCaret({ x: 100, y: 120, lineHeight: 20 });
      await openWith('あいう\nえお');
      expect(ime.shadowRoot!.querySelector('.naga-copy')).toBeNull();
      expect(ime.shadowRoot!.querySelector('.naga-copy-new')).toBeNull();
      expect(ime.shadowRoot!.querySelector('.naga-copy-caret')).toBeNull();
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it('写しの CSS は残っていない', () => {
    expect(NAGA_STYLE_TEXT).not.toMatch(/\.naga-copy\s*\{/);
    expect(NAGA_STYLE_TEXT).not.toMatch(/\.naga-copy-(new|caret|empty)\b/);
  });

  it('縦棒の見た目の約束（幅 2px・紫・点滅・pointer-events: none・popup より下）', () => {
    // 幅 2px・pointer-events: none・absolute
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*position:\s*absolute/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*width:\s*2px/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*pointer-events:\s*none/);
    // 色は NagaIME の紫（--naga-accent）で、popup と同じ値
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*background:\s*var\(--naga-accent\)/);
    expect(NAGA_STYLE_TEXT).toMatch(/--naga-accent:\s*#5b4a8a/);
    // 1s 周期の点滅と、動きを減らす設定での停止
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*animation:[^;]*1s/);
    expect(NAGA_STYLE_TEXT).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.naga-caret-mark\s*\{[^}]*animation:\s*none/);
    // z-index は popup（9999）より下・欄より上
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\s*\{[^}]*z-index:\s*9997/);
    // 隠すときは hidden
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-caret-mark\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});
