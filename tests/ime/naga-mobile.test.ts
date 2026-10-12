/**
 * NagaIME モバイル dock の機械判定（oct26-m7-t1 是正設計 v2 §7.2 AC10 / §7.3、
 * nov26-m3-t3 タスク設計 §3.6 で書き直した）。
 *
 * dock の popup の高さは、ソフトキーボード表示中の残り可視高（visualViewport.height）から逆算する。
 * jsdom は layout を持たないため、ここで測るのは「レイアウトの実物」ではなく
 * 「仕組み」（style へ書かれる値・class・textContent・hidden・focus の引数）である。実の矩形は e2e の M-1〜M-5 が見る。
 *
 * 割り付け（nov26-m3-t3 タスク設計 §3.1）: タイトル行 34 ＋ 写しの行 22 ＋ 読み欄 36 ＋ 枠 2 ＝ 固定部分 94、
 * 候補 1 行 44、上限 3 行。popup の上に残す帯 40、キーボード上端との間 8。
 *   avail = vvAvail − 8
 *   popupMax = min(226, avail − 40)。それが 138（固定部分＋候補 1 行）未満なら min(138, avail)
 * 畳んだ高さは 58（タイトル行＋写しの行＋枠）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';
import { NAGA_STYLE_TEXT } from '@/lib/ime/naga-styles';
import { NAGA_CATEGORIES } from '@/lib/ime/naga-dictionary';

/** 辞書（生成済み dictionary.ts）の動的 import を伴うので既存テストと同じ猶予を与える。 */
const DICTIONARY_TEST_TIMEOUT_MS = 8000;

/** 設計 §3.1 の割り付け（実装の private const と一致していることを外から確かめる値）。 */
const DOCK_GAP = 8;
const DOCK_BAND = 40;
const DOCK_MIN = 138;
const DOCK_MAX = 226;
const DOCK_FOLDED = 58;

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

/** nov26-m3-t2: popup は <naga-ime>（describe の ime）の影の中にある。 */
let ime: NagaIME;

function popupOf(): HTMLElement {
  return ime.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
}

function part<T extends HTMLElement = HTMLElement>(selector: string): T {
  return popupOf().querySelector(selector) as T;
}

function tabTextsOf(): string[] {
  return Array.from(popupOf().querySelectorAll('.naga-tab')).map((t) => (t as HTMLElement).textContent ?? '');
}

function itemsOf(): HTMLElement[] {
  return Array.from(popupOf().querySelectorAll('.naga-item')) as HTMLElement[];
}

function copyText(): string {
  return part('.naga-copy').textContent ?? '';
}

/** 書かれた style から帯（popup の上に残る高さ）を計算する（4-4: 恒真式をやめる）。 */
function bandOf(pop: HTMLElement): number {
  const vv = window.visualViewport!;
  return window.innerHeight - parseFloat(pop.style.bottom) - parseFloat(pop.style.maxHeight) - vv.offsetTop;
}

/** iPhone 標準級（390×844）でかなキーボードが出ている状態。残り可視高 480px。 */
const PHONE_KEYBOARD = { width: 390, height: 480, offsetTop: 0, innerHeight: 844 };
/** 10 月の HV の実測（使える高さ 188px）。 */
const PHONE_SMALL = { width: 375, height: 188, offsetTop: 0, innerHeight: 844 };

describe('NagaIME モバイル dock（AC10）', () => {
  let field: HTMLInputElement;

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
    // dock の max-height は JS が実測で設定する custom property（未設定時のみ既定へ落ちる）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s*\{[^}]*max-height:\s*var\(--naga-dock-max/);
    // 内側の list だけが縮む（flex: 1 1 auto; min-height: 0）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-list\s*\{[^}]*flex:\s*1\s+1\s+auto/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-list\s*\{[^}]*min-height:\s*0/);
    // PC（non-docked）の list は従来どおり 260px 固定（後退していない）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-list\s*\{[^}]*max-height:\s*260px/);
  });

  describe('AC10-c: 帯 40 を残し、候補 1 行を優先し、可視の領域を超えない（4-1・4-4）', () => {
    const cases = [
      { vvAvail: 188, popupMax: 140 },
      { vvAvail: 216, popupMax: 168 },
      { vvAvail: 320, popupMax: DOCK_MAX },
      { vvAvail: 480, popupMax: DOCK_MAX },
    ];
    for (const c of cases) {
      it(
        `使える高さ ${c.vvAvail}: popupMax ${c.popupMax}・帯 ≥ ${DOCK_BAND}・候補 1 行以上`,
        async () => {
          stubViewport({ width: 375, height: c.vvAvail, offsetTop: 0, innerHeight: 844 });
          ime.attach(field);
          await ime.open(field);
          const pop = popupOf();
          expect(pop.classList.contains('naga-is-docked')).toBe(true);
          expect(pop.style.position).toBe('fixed');
          // bottom はキーボード上端＋8
          expect(pop.style.bottom).toBe(`${844 - c.vvAvail + DOCK_GAP}px`);
          expect(pop.style.maxHeight).toBe(`${c.popupMax}px`);
          expect(pop.style.getPropertyValue('--naga-dock-max')).toBe(`${c.popupMax}px`);
          expect(pop.style.getPropertyValue('--naga-dock-avail')).toBe(`${c.vvAvail}px`);
          // 帯は書かれた値から計算する
          expect(bandOf(pop)).toBeGreaterThanOrEqual(DOCK_BAND);
          expect(parseFloat(pop.style.maxHeight)).toBeGreaterThanOrEqual(DOCK_MIN);
        },
        DICTIONARY_TEST_TIMEOUT_MS,
      );
    }

    const tiny = [
      { vvAvail: 150, popupMax: DOCK_MIN },
      { vvAvail: 120, popupMax: 112 },
      { vvAvail: 100, popupMax: 92 },
    ];
    for (const c of tiny) {
      it(
        `使える高さ ${c.vvAvail}（M-2 の対象外）: popup は可視の領域（vvAvail − 8）を超えない`,
        async () => {
          stubViewport({ width: 375, height: c.vvAvail, offsetTop: 0, innerHeight: 844 });
          ime.attach(field);
          await ime.open(field);
          const pop = popupOf();
          expect(pop.style.maxHeight).toBe(`${c.popupMax}px`);
          expect(parseFloat(pop.style.maxHeight)).toBeLessThanOrEqual(c.vvAvail - DOCK_GAP);
          expect(bandOf(pop)).toBeGreaterThanOrEqual(0);
        },
        DICTIONARY_TEST_TIMEOUT_MS,
      );
    }

    it(
      'visualViewport.offsetTop があっても帯は可視の領域の上端から数える',
      async () => {
        stubViewport({ width: 375, height: 216, offsetTop: 30, innerHeight: 844 });
        ime.attach(field);
        await ime.open(field);
        const pop = popupOf();
        // H_kb = 844 − (216 + 30) = 598 → bottom = 606
        expect(pop.style.bottom).toBe(`${844 - 216 - 30 + DOCK_GAP}px`);
        expect(pop.style.maxHeight).toBe('168px');
        expect(bandOf(pop)).toBe(DOCK_BAND);
      },
      DICTIONARY_TEST_TIMEOUT_MS,
    );
  });

  it(
    'AC10-c: キーボード開閉（visualViewport の変化）に追従して max-height を測り直す',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      expect(popupOf().style.maxHeight).toBe(`${DOCK_MAX}px`);

      // キーボードが閉じた（残り可視高が 844 に戻る）
      stubViewport({ width: 390, height: 844, offsetTop: 0, innerHeight: 844 });
      window.dispatchEvent(new Event('resize'));
      const pop = popupOf();
      expect(pop.style.bottom).toBe(`${DOCK_GAP}px`);
      expect(pop.style.maxHeight).toBe(`${DOCK_MAX}px`);

      // より大きなキーボード（残り可視高 240px → avail 232 − 帯 40 = 192）
      stubViewport({ width: 390, height: 240, offsetTop: 0, innerHeight: 844 });
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe('192px');
      expect(bandOf(popupOf())).toBe(DOCK_BAND);
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

  describe('短縮名: 選ばれたタブ（最近・5 カテゴリ）× dock の有無の全組（4-6）', () => {
    const FULL = ['最近', '変体仮名', '悉曇', '仏名', '異体字', '組文字'];
    const SHORT = ['近', '変', '悉', '仏', '異', '組'];
    const IDS = ['recent', ...NAGA_CATEGORIES.map((c) => c.id)];
    for (const [i, id] of IDS.entries()) {
      for (const docked of [true, false]) {
        it(
          `選択 ${id}・${docked ? 'dock' : 'PC'}`,
          async () => {
            stubViewport(docked ? PHONE_KEYBOARD : { width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
            ime.attach(field);
            await ime.open(field);
            (popupOf().querySelector(`.naga-tab[data-category="${id}"]`) as HTMLButtonElement).click();
            const expected = docked ? SHORT.map((s, j) => (j === i ? FULL[j] : s)) : FULL;
            expect(tabTextsOf()).toEqual(expected);
          },
          DICTIONARY_TEST_TIMEOUT_MS,
        );
      }
    }
  });

  it(
    'AC10-d: PC では dock 用の値を残さない（dock から戻ると消す）',
    async () => {
      stubViewport({ width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.classList.contains('naga-is-docked')).toBe(false);
      // nov26-m3-t2（マイルストーン設計 §5.2）: viewport 基準の fixed。見え方の非後退は e2e の P-1〜P-8 が見る
      expect(pop.style.position).toBe('fixed');
      expect(pop.style.maxHeight).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-max')).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-avail')).toBe('');
      expect(tabTextsOf()).toEqual(['最近', '変体仮名', '悉曇', '仏名', '異体字', '組文字']);

      // dock へ行って戻ると、dock 用の値を消す
      stubViewport(PHONE_KEYBOARD);
      window.dispatchEvent(new Event('resize'));
      expect(pop.style.maxHeight).toBe(`${DOCK_MAX}px`);
      stubViewport({ width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
      window.dispatchEvent(new Event('resize'));
      expect(pop.style.maxHeight).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-max')).toBe('');
      expect(pop.style.getPropertyValue('--naga-dock-avail')).toBe('');
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
      expect(popupOf().style.maxHeight).toBe(`${DOCK_MAX}px`);

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

  it('区別の付け方（設計 §5）は dock スコープの CSS で足りている', () => {
    // 読み入力欄: アクセント縦線と「読み」ラベル
    expect(NAGA_STYLE_TEXT).toContain('.naga-popup.naga-is-docked .naga-search-row');
    expect(NAGA_STYLE_TEXT).toContain('.naga-popup.naga-is-docked .naga-search-label');
    // タブ帯: 背景で候補領域の白と分ける
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-titlebar\s*\{[^}]*background/);
    // 「ふわふわ浮いて」（§1 の 5）: 画面の下に据え付けた板（上端のアクセントの線・上向きの影）
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s*\{[^}]*border-top:\s*2px solid var\(--naga-accent\)/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s*\{[^}]*box-shadow:\s*0 -4px 16px/);
  });

  it(
    '読み入力欄は「読み」ラベルと aria-label を持ち、行は display: flex（display: contents を使わない。4-2・4-5）',
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
      // display: contents は a11y の木から要素を落としうる ∴ やめた。PC の見え方は e2e の P-8 が見る
      expect(NAGA_STYLE_TEXT).toMatch(/\.naga-search-row\s*\{[^}]*display:\s*flex/);
      expect(NAGA_STYLE_TEXT).not.toMatch(/\.naga-search-row\s*\{[^}]*display:\s*contents/);
      // 非 dock で隠す selector は base に置く（4-2 の定め直し）
      expect(NAGA_STYLE_TEXT).toMatch(/\.naga-search-label\s*\{[^}]*display:\s*none/);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'dock の popup は画面の左右いっぱい（left / right 0）',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      expect(popupOf().style.left).toBe('0px');
      expect(popupOf().style.right).toBe('0px');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});

describe('NagaIME 挿入先の写し（§3.2・t3/AC2）', () => {
  let field: HTMLInputElement;

  beforeEach(() => {
    localStorage.clear();
    field = document.createElement('input');
    field.type = 'text';
    document.body.append(field);
    ime = new NagaIME({ loadFonts: false });
    stubViewport(PHONE_KEYBOARD);
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    restoreViewport();
    vi.restoreAllMocks();
  });

  async function openWith(value: string, caret = value.length, target: HTMLInputElement | HTMLTextAreaElement = field) {
    target.value = value;
    ime.attach(target);
    target.setSelectionRange(caret, caret);
    await ime.open(target);
  }

  it(
    '写しの行は aria-live="polite" で、キャレットの直前の文字と印 ▏ を出す',
    async () => {
      await openWith('あいう');
      const copy = part('.naga-copy');
      expect(copy.getAttribute('aria-live')).toBe('polite');
      expect(copyText()).toBe('あいう▏');
      expect(copy.querySelector('.naga-copy-new')).toBeNull();
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'キャレットの位置まで（後ろは写さない）',
    async () => {
      await openWith('あいうえお', 2);
      expect(copyText()).toBe('あい▏');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '12 文字を超えると先頭に … を付け、直前の 12 文字だけ',
    async () => {
      await openWith('abcdefghijklmnop');
      expect(copyText()).toBe('…efghijklmnop▏');
      await ime.close();
      await openWith('abcdefghijkl');
      expect(copyText()).toBe('abcdefghijkl▏');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'サロゲートペアを分けずに 12 文字を数える',
    async () => {
      await openWith('𠮷'.repeat(13));
      expect(copyText()).toBe(`…${'𠮷'.repeat(12)}▏`);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'textarea の改行は ↵ で見せる（§1 の 6）',
    async () => {
      const ta = document.createElement('textarea');
      document.body.append(ta);
      try {
        await openWith('一行目\n二行目', undefined, ta);
        expect(copyText()).toBe('一行目↵二行目▏');
      } finally {
        ta.remove();
      }
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '欄が空・キャレットが先頭なら（先頭）',
    async () => {
      await openWith('');
      expect(copyText()).toBe('（先頭）');
      await ime.close();
      await openWith('あいう', 0);
      expect(copyText()).toBe('（先頭）');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'type="password" の欄は中身を写さない（非表示）',
    async () => {
      field.type = 'password';
      await openWith('secret');
      expect(copyText()).toBe('（非表示）');
      expect(copyText()).not.toContain('secret');
      itemsOf()[0].click();
      expect(copyText()).toBe('（非表示）');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '確定のたびに更新し、直前の確定で入った文字を .naga-copy-new で包む。次に開くとき・タブを替えたときは包まない',
    async () => {
      await openWith('あい');
      const first = itemsOf()[0];
      const c1 = first.dataset.char!;
      first.click();
      expect(copyText()).toBe(`あい${c1}▏`);
      expect(part('.naga-copy .naga-copy-new').textContent).toBe(c1);

      const second = itemsOf()[1];
      const c2 = second.dataset.char!;
      second.click();
      expect(copyText()).toBe(`あい${c1}${c2}▏`);
      expect(part('.naga-copy .naga-copy-new').textContent).toBe(c2);

      (popupOf().querySelector('.naga-tab[data-category="siddham"]') as HTMLButtonElement).click();
      expect(copyText()).toBe(`あい${c1}${c2}▏`);
      expect(popupOf().querySelector('.naga-copy .naga-copy-new')).toBeNull();

      itemsOf()[0].click();
      expect(popupOf().querySelector('.naga-copy .naga-copy-new')).not.toBeNull();
      ime.close();
      field.setSelectionRange(field.value.length, field.value.length);
      await ime.open(field);
      expect(popupOf().querySelector('.naga-copy .naga-copy-new')).toBeNull();
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '写しは innerHTML を使わずに組む（t2/AC7）',
    async () => {
      const setter = vi.fn();
      const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!;
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        get: desc.get,
        set(this: Element, v: string) {
          setter(v);
          desc.set!.call(this, v);
        },
      });
      try {
        await openWith('<b>x</b>');
        itemsOf()[0].click();
        expect(copyText().startsWith('<b>x</b>')).toBe(true);
        expect(part('.naga-copy').querySelector('b')).toBeNull();
        expect(setter).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(Element.prototype, 'innerHTML', desc);
      }
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});

describe('NagaIME 折りたたみ（§3.3・t3/AC4）', () => {
  let field: HTMLInputElement;

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

  it(
    '畳むボタンは aria-expanded・aria-label を持ち、mousedown で focus を奪わない',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      const fold = part<HTMLButtonElement>('.naga-fold');
      expect(fold).toBeTruthy();
      expect(fold.type).toBe('button');
      expect(fold.getAttribute('aria-expanded')).toBe('true');
      expect(fold.getAttribute('aria-label')).toBe('たたむ');
      expect(fold.textContent).toBe('▾');
      const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      fold.dispatchEvent(md);
      expect(md.defaultPrevented).toBe(true);
      // 閉じるボタンの前にある
      expect(fold.nextElementSibling?.classList.contains('naga-close')).toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '畳むと高さ 58px・読み欄の行と一覧が hidden・aria-expanded false。focus は動かさない',
    async () => {
      stubViewport(PHONE_SMALL);
      ime.attach(field);
      await ime.open(field);
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      part<HTMLButtonElement>('.naga-fold').click();

      const pop = popupOf();
      expect(pop.style.maxHeight).toBe(`${DOCK_FOLDED}px`);
      expect(pop.style.getPropertyValue('--naga-dock-max')).toBe(`${DOCK_FOLDED}px`);
      expect(part('.naga-search-row').hidden).toBe(true);
      expect(part('.naga-list').hidden).toBe(true);
      expect(part('.naga-copy').hidden).toBe(false);
      const fold = part<HTMLButtonElement>('.naga-fold');
      expect(fold.getAttribute('aria-expanded')).toBe('false');
      expect(fold.getAttribute('aria-label')).toBe('ひらく');
      expect(fold.textContent).toBe('▴');
      expect(pop.classList.contains('naga-is-folded')).toBe(true);
      expect(focusSpy).not.toHaveBeenCalled();
      // 帯が広がる（書かれた値から）
      expect(bandOf(pop)).toBe(188 - DOCK_GAP - DOCK_FOLDED);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '閉じて開いても畳んだまま。開く操作で読み欄へ focus({ preventScroll: true })、高さが戻る',
    async () => {
      stubViewport(PHONE_SMALL);
      ime.attach(field);
      await ime.open(field);
      part<HTMLButtonElement>('.naga-fold').click();
      ime.close();
      await ime.open(field);
      expect(popupOf().style.maxHeight).toBe(`${DOCK_FOLDED}px`);
      expect(part('.naga-list').hidden).toBe(true);

      const search = part<HTMLInputElement>('.naga-search');
      const focusSpy = vi.spyOn(search, 'focus');
      part<HTMLButtonElement>('.naga-fold').click();
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(popupOf().style.maxHeight).toBe('140px');
      expect(part('.naga-search-row').hidden).toBe(false);
      expect(part('.naga-list').hidden).toBe(false);
      expect(part('.naga-fold').getAttribute('aria-expanded')).toBe('true');
      expect(popupOf().classList.contains('naga-is-folded')).toBe(false);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'dock でなくなると畳んだ状態を見た目に出さない（PC は不変）が、状態は保つ',
    async () => {
      stubViewport(PHONE_SMALL);
      ime.attach(field);
      await ime.open(field);
      part<HTMLButtonElement>('.naga-fold').click();

      stubViewport({ width: 1024, height: 768, offsetTop: 0, innerHeight: 768 });
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe('');
      expect(part('.naga-search-row').hidden).toBe(false);
      expect(part('.naga-list').hidden).toBe(false);
      expect(popupOf().classList.contains('naga-is-folded')).toBe(false);

      stubViewport(PHONE_SMALL);
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe(`${DOCK_FOLDED}px`);
      expect(part('.naga-list').hidden).toBe(true);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it('畳むボタンと写しの行は dock のときだけ見える（非 dock で隠す selector は base）', () => {
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-fold\s*\{[^}]*display:\s*none/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-copy\s*\{[^}]*display:\s*none/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-fold\s*\{[^}]*display:\s*(block|flex|inline-block)/);
    expect(NAGA_STYLE_TEXT).toMatch(/\.naga-popup\.naga-is-docked\s+\.naga-copy\s*\{[^}]*display:\s*(block|flex)/);
  });
});

describe('NagaIME はページも欄もスクロールしない（M-1・MIN-1・t3/AC1）', () => {
  let field: HTMLInputElement;

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
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  });

  it(
    'focus はすべて { preventScroll: true }（開く・タブ切替・確定・閉じて欄へ戻す）',
    async () => {
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      await ime.open(field);
      (popupOf().querySelector('.naga-tab[data-category="siddham"]') as HTMLButtonElement).click();
      itemsOf()[0].click();
      ime.close({ refocus: true });
      expect(focusSpy.mock.calls.length).toBeGreaterThanOrEqual(4);
      for (const call of focusSpy.mock.calls) expect(call).toEqual([{ preventScroll: true }]);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '候補の選択で scrollIntoView を呼ばず、一覧の scrollTop だけで見える範囲に入れる',
    async () => {
      const siv = vi.fn();
      Object.defineProperty(Element.prototype, 'scrollIntoView', { value: siv, configurable: true, writable: true });
      // jsdom は layout を持たない ∴ 行 44px・一覧の見える高さ 88px を与える
      vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('naga-item') ? Number(this.dataset.index) * 44 : 0;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('naga-item') ? 44 : 0;
      });
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('naga-list') ? 88 : 0;
      });
      stubViewport(PHONE_KEYBOARD);
      ime.attach(field);
      await ime.open(field);
      const list = part('.naga-list');
      const search = part<HTMLInputElement>('.naga-search');
      const key = (k: string) => search.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

      expect(list.scrollTop).toBe(0);
      key('ArrowDown'); // 1: 44〜88 は見える
      expect(list.scrollTop).toBe(0);
      key('ArrowDown'); // 2: 88〜132 → 下端を合わせる
      expect(list.scrollTop).toBe(44);
      key('ArrowDown'); // 3: 132〜176
      expect(list.scrollTop).toBe(88);
      key('ArrowUp'); // 2: 88〜132 は見える
      expect(list.scrollTop).toBe(88);
      key('ArrowUp'); // 1: 44 → 上端を合わせる
      expect(list.scrollTop).toBe(44);
      key('ArrowUp'); // 0
      expect(list.scrollTop).toBe(0);
      expect(siv).not.toHaveBeenCalled();
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});
