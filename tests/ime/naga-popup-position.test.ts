/**
 * 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup の置き場所の単体テスト。
 *
 * 0431 まで狭幅（dock）の popup は `position: fixed` で画面の下に据え付け、visualViewport の offset から
 * `bottom` を計算し、ページのスクロールのたびに置き直していた。実機の iPhone では、キーボード表示中は
 * fixed が visual viewport とずれ、スクロールやキーボードの出入りで popup が欄と無関係に動いた
 * （起動ボタンと同じ種類の不具合）。
 * いまは起動ボタンと同じく文書の座標（`position: absolute`）で置く ∴ ページのスクロールではブラウザが
 * 本文と一緒に動かし、置き直しの購読は resize と「スクロールコンテナ要素の scroll」だけになる。
 * 【NOV26-IM-NAGA-POPUP-CARET-0434】0432 は狭幅だけ欄の下端のすぐ下に置いていた ∴ 複数行の欄では
 * キャレットの行から遠く、高さの上限も欄の高さに縮んでいた。狭幅も広幅と同じくキャレットの行のすぐ下に
 * 置き、上限は「popup の上端から可視域の下端（キーボードの上）まで」で決める。可視域に DOCK_MIN が
 * 残らないときだけ、開いた直後に 1 回だけページを寄せる（例外）。
 *
 * ここでは jsdom に layout が無いことを逆手に取り、`getBoundingClientRect` と `window.scrollX/scrollY` を
 * 決め打ちにして、style へ書かれる値と購読の寿命だけを測る（実の矩形は e2e/ios-popup.spec.ts が
 * WebKit の iPhone 模擬で見る）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';

interface StubRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 可視域の偽物。EventTarget なので dispatchEvent は本物の購読経路を通る。 */
class FakeVisualViewport extends EventTarget {
  offsetTop = 0;
  offsetLeft = 0;
  height = 852;
  width = 393;
}

/** 実装の private const と一致していることを外から確かめる値（naga-ime.ts の DOCK_*_PX）。 */
const GAP_TO_FIELD = 4;
const CARET_GAP = 2;
const DOCK_GAP = 8;
// 【0436】狭幅では文脈の表示（写しの行 22px）を出さない ∴ 固定部分は 72px（3 行上限 204・下限 116・畳み 36）
const DOCK_MIN = 116;
const DOCK_MAX = 204;
const DOCK_FOLDED = 36;
const TOL = 1;

/** 欄の getBoundingClientRect を決め打ちにする（jsdom の矩形はすべて 0 のため）。 */
function stubRect(el: Element, rect: StubRect): void {
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

/** window.innerHeight を決め打ちにする（visualViewport と別に持つ値）。 */
function stubInnerHeight(h: number): void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => h });
}

/** rAF を手で回す（間引きの有無を決め打ちで測る）。 */
function useManualFrames(): () => void {
  const queue: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue[id - 1] = () => {};
  });
  return () => {
    const pending = queue.splice(0, queue.length);
    for (const cb of pending) cb(0);
  };
}

describe('popup の置き場所（文書の座標・position: absolute）', () => {
  let field: HTMLInputElement;
  let ime: NagaIME;
  let vv: FakeVisualViewport;
  let runFrames: () => void;
  let scrollBySpy: ReturnType<typeof vi.spyOn>;

  function popupOf(): HTMLElement {
    return ime.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
  }

  /** 表示中の popup の置き直しを数える（private の positionPopup を包む）。 */
  function spyPosition(): ReturnType<typeof vi.spyOn> {
    return vi.spyOn(ime as unknown as { positionPopup: () => void }, 'positionPopup');
  }

  /** dock の対象になる狭幅にする（visualViewport の幅 < dockBreakpoint 560）。 */
  function useNarrow(width = 393): void {
    vv.width = width;
  }

  /**
   * キャレットの計測を stub する（jsdom は layout を持たない）。null は「測れない」＝ 例外。
   * 【NOV26-IM-NAGA-POPUP-CARET-0434】狭幅もキャレットの行のすぐ下に置くようになった ∴ 欄の下端を
   * 基準にする経路（測れないときの落とし所）は、この stub で明示したときだけ通る。
   */
  function stubCaret(anchor: { x: number; y: number; lineHeight: number } | null): (next: typeof anchor) => void {
    let current = anchor;
    vi.spyOn(
      ime as unknown as { measureCaret: () => { x: number; y: number; lineHeight: number } },
      'measureCaret',
    ).mockImplementation(() => {
      if (!current) throw new Error('キャレットを測れない');
      return current;
    });
    return (next) => {
      current = next;
    };
  }

  /** dock の対象にならない広幅にする。 */
  function useWide(): void {
    vv.width = 1280;
    vv.height = 800;
    stubInnerHeight(800);
  }

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vv = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    runFrames = useManualFrames();
    // 【0434】可視域に収めるための 1 回のスクロール（例外）を数える。jsdom の scrollBy は空振りするので差し替える
    scrollBySpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    stubScroll(0, 0);
    stubInnerHeight(852);
    field = document.createElement('input');
    field.type = 'text';
    document.body.append(field);
    ime = new NagaIME({ loadFonts: false });
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    vi.unstubAllGlobals();
    for (const name of ['scrollX', 'scrollY', 'innerHeight']) Reflect.deleteProperty(window, name);
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vi.restoreAllMocks();
  });

  /* ---------------------------------------------------------- *
   * 狭幅（dock）: キャレットの行のすぐ下に付ける（0434）
   * ---------------------------------------------------------- */

  it(
    '狭幅では position: absolute でキャレットの行のすぐ下に置き、横は文書の可視幅いっぱい（文書の座標）',
    async () => {
      useNarrow();
      stubScroll(120, 500);
      // 高い textarea（高さ 200）。キャレットは 3 行目（欄の上端から 60px）にある
      stubRect(field, { top: 400, right: 376, bottom: 600, left: 16 });
      stubCaret({ x: 30, y: 460, lineHeight: 22 });
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.classList.contains('naga-is-docked'), '前提: 狭幅は dock').toBe(true);
      expect(pop.style.position, 'fixed ではなく absolute（文書の座標）').toBe('absolute');
      expect(pop.style.top, 'キャレットの行の下端 ＋ 2 ＋ scrollY（文書の縦座標）').toBe(
        `${460 + 22 + CARET_GAP + 500}px`,
      );
      expect(parseFloat(pop.style.top), '欄の下端より上に出る（複数行の欄）').toBeLessThan(600 + 500);
      expect(pop.style.left, '文書の可視域の左端').toBe(`${120}px`);
      // jsdom は layout を持たない ∴ documentElement.clientWidth は 0。実装はそのとき innerWidth に落ちる
      const docWidth = document.documentElement.clientWidth || window.innerWidth;
      expect(pop.style.width, '文書の可視幅いっぱい').toBe(`${docWidth}px`);
      expect(pop.style.right, 'right は使わない').toBe('');
      expect(pop.style.bottom, 'bottom は使わない').toBe('');
      expect(pop.style.maxHeight, '可視域に収まっているので上限は DOCK_MAX').toBe(`${DOCK_MAX}px`);
      expect(scrollBySpy, '収まっているのでページを寄せない').not.toHaveBeenCalled();
    },
    8000,
  );

  it(
    'キャレットを測れない欄では、狭幅でも従来どおり欄の下端のすぐ下に置く',
    async () => {
      useNarrow();
      stubScroll(120, 500);
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.style.top, '欄の下端 ＋ 間隔（文書の縦座標）').toBe(`${432 + 500 + GAP_TO_FIELD}px`);
      expect(pop.style.left, '文書の可視域の左端').toBe(`${120}px`);
      expect(pop.style.maxHeight).toBe(`${DOCK_MAX}px`);
      expect(scrollBySpy).not.toHaveBeenCalled();
    },
    8000,
  );

  it(
    'visualViewport の offset は位置に使わない（パンしても top / left は変わらない）',
    async () => {
      useNarrow();
      stubScroll(0, 200);
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret({ x: 16, y: 400, lineHeight: 20 });
      ime.attach(field);
      await ime.open(field);
      runFrames();
      const before = { top: popupOf().style.top, left: popupOf().style.left };

      // キーボードで可視域が縮み（高さ 852 → 480）、パンした（offsetTop 150）
      vv.offsetTop = 150;
      vv.offsetLeft = 20;
      vv.height = 480;
      vv.dispatchEvent(new Event('scroll'));
      vv.dispatchEvent(new Event('resize'));
      runFrames();
      expect(popupOf().style.top, 'visualViewport の offset は位置に使わない').toBe(before.top);
      expect(popupOf().style.left, 'visualViewport の offset は位置に使わない').toBe(before.left);
    },
    8000,
  );

  it(
    '高さの上限は「キャレットの行の下から可視域の下端（キーボードの上）まで」で、欄の高さを引かない',
    async () => {
      useNarrow();
      // 高い textarea（高さ 400）。キャレットは 1 行目 ∴ popup の上端（viewport）は 132
      stubRect(field, { top: 100, right: 376, bottom: 500, left: 16 });
      stubCaret({ x: 16, y: 110, lineHeight: 20 });
      ime.attach(field);
      await ime.open(field);
      // 852 − 132 − 8 = 712 → 上限 204（0432 の式は 400 − 8 − 欄 400 = 0 まで縮んでいた）
      expect(popupOf().style.maxHeight).toBe(`${DOCK_MAX}px`);

      // 可視域の下端が 300 まで縮んだ → 300 − 132 − 8 = 160（欄の高さ 400 でも 0 にならない）
      vv.height = 300;
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe(`${300 - 132 - DOCK_GAP}px`);
      expect(popupOf().style.getPropertyValue('--naga-dock-max')).toBe(`${300 - 132 - DOCK_GAP}px`);

      // 380 まで縮んだ → 380 − 132 − 8 = 240 → 上限 204
      vv.height = 380;
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.maxHeight).toBe(`${DOCK_MAX}px`);
      expect(scrollBySpy, '上限が DOCK_MIN 以上ならページを寄せない').not.toHaveBeenCalled();
    },
    8000,
  );

  it(
    '可視域に残る高さが DOCK_MIN に満たないときは DOCK_MIN をとり、開いた直後にページを 1 回だけ寄せる',
    async () => {
      useNarrow();
      stubRect(field, { top: 100, right: 376, bottom: 500, left: 16 });
      stubCaret({ x: 16, y: 400, lineHeight: 20 }); // popup の上端（viewport）= 422
      vv.height = 300; // room = 300 − 422 − 8 = −130 < DOCK_MIN(116)
      ime.attach(field);
      await ime.open(field);

      const pop = popupOf();
      expect(pop.style.maxHeight, '候補 1 行は見せる（DOCK_MIN）').toBe(`${DOCK_MIN}px`);
      expect(scrollBySpy, '開いた直後に 1 回だけ寄せる').toHaveBeenCalledTimes(1);
      // popup の下端（422 + 116 = 538）が可視域の下端（300）に入るまで寄せる
      expect(scrollBySpy).toHaveBeenCalledWith(0, 422 + DOCK_MIN - 300);
      expect(pop.style.top, '寄せても位置（文書の座標）は変わらない').toBe(`${422}px`);

      // 2 回目以降（開いた直後の置き直し・resize）では寄せない
      runFrames();
      vv.height = 280;
      window.dispatchEvent(new Event('resize'));
      vv.dispatchEvent(new Event('resize'));
      runFrames();
      expect(scrollBySpy, '寄せるのは開いた直後の 1 回だけ').toHaveBeenCalledTimes(1);
      expect(popupOf().style.maxHeight).toBe(`${DOCK_MIN}px`);
    },
    8000,
  );

  it(
    '畳んだときの上限は畳んだ高さ（36px）',
    async () => {
      useNarrow();
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);
      (popupOf().querySelector('.naga-fold') as HTMLButtonElement).click();
      expect(popupOf().style.maxHeight).toBe(`${DOCK_FOLDED}px`);
      expect(popupOf().style.top, '畳んでも欄のすぐ下のまま').toBe(`${432 + GAP_TO_FIELD}px`);
    },
    8000,
  );

  /* ---------------------------------------------------------- *
   * 置き直しの購読
   * ---------------------------------------------------------- */

  it(
    'ページのスクロール（window・document・visualViewport）では置き直さない',
    async () => {
      useNarrow();
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret({ x: 16, y: 400, lineHeight: 20 });
      ime.attach(field);
      await ime.open(field);
      runFrames(); // 開いた直後の 1 回を流す
      const before = popupOf().style.top;

      const spy = spyPosition();
      // スクロールして欄は画面の上のほうへ動いた（矩形が変わる）
      stubScroll(0, 300);
      stubRect(field, { top: 100, right: 376, bottom: 132, left: 16 });
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('scroll'));
      document.documentElement.dispatchEvent(new Event('scroll'));
      document.body.dispatchEvent(new Event('scroll'));
      vv.dispatchEvent(new Event('scroll'));
      runFrames();
      expect(spy, 'ページのスクロールでは置き直さない').not.toHaveBeenCalled();
      expect(popupOf().style.top, '置き場所は文書の座標のまま（ブラウザが本文と一緒に動かす）').toBe(before);
      spy.mockRestore();
    },
    8000,
  );

  it(
    'スクロールコンテナ要素の scroll では置き直す（1 フレームに 1 回へ間引く）',
    async () => {
      useNarrow();
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);
      runFrames();

      const spy = spyPosition();
      // 欄が overflow: auto の箱の中にある。そのスクロールで欄は箱の中を動く
      stubRect(field, { top: 200, right: 376, bottom: 232, left: 16 });
      const scroller = document.createElement('div');
      document.body.append(scroller);
      try {
        scroller.dispatchEvent(new Event('scroll'));
        scroller.dispatchEvent(new Event('scroll'));
        expect(spy).not.toHaveBeenCalled();
        runFrames();
        expect(spy, '何度届いても 1 回').toHaveBeenCalledTimes(1);
        expect(popupOf().style.top).toBe(`${232 + GAP_TO_FIELD}px`);
      } finally {
        scroller.remove();
      }
      spy.mockRestore();
    },
    8000,
  );

  it(
    'window / visualViewport の resize で置き直す',
    async () => {
      useNarrow();
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);
      runFrames();

      stubRect(field, { top: 250, right: 376, bottom: 282, left: 16 });
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().style.top, 'window の resize').toBe(`${282 + GAP_TO_FIELD}px`);

      stubRect(field, { top: 120, right: 376, bottom: 152, left: 16 });
      vv.dispatchEvent(new Event('resize'));
      expect(popupOf().style.top, 'visualViewport の resize').toBe(`${152 + GAP_TO_FIELD}px`);
    },
    8000,
  );

  it(
    '閉じたら scroll でも resize でも置き直さない（購読を外す）',
    async () => {
      useNarrow();
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);
      runFrames();
      const before = popupOf().style.top;
      ime.close();
      runFrames();

      const spy = spyPosition();
      stubRect(field, { top: 100, right: 376, bottom: 132, left: 16 });
      const scroller = document.createElement('div');
      document.body.append(scroller);
      try {
        scroller.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        vv.dispatchEvent(new Event('resize'));
        runFrames();
        expect(spy).not.toHaveBeenCalled();
        expect(popupOf().style.top).toBe(before);
      } finally {
        scroller.remove();
      }
      spy.mockRestore();
    },
    8000,
  );

  it(
    'position 付きの要素の中に置かれたら、offsetParent の矩形とスクロールを引いて補正する',
    async () => {
      useNarrow();
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      Object.defineProperty(wrapper, 'scrollTop', { configurable: true, value: 30 });
      Object.defineProperty(wrapper, 'scrollLeft', { configurable: true, value: 10 });
      document.body.append(wrapper);
      stubRect(wrapper, { top: 100, left: 40, bottom: 900, right: 400 });

      stubScroll(0, 200);
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      stubCaret(null);
      ime.attach(field);
      await ime.open(field);
      // 包含ブロックをこの要素にする（jsdom は offsetParent を持たないので決め打ち）
      Object.defineProperty(popupOf(), 'offsetParent', { configurable: true, value: wrapper });

      window.dispatchEvent(new Event('resize'));
      const pop = popupOf();
      // 文書座標 636 から、要素の padding box の文書座標（100+200−30）を引く
      expect(pop.style.top).toBe(`${432 + 200 + GAP_TO_FIELD - (100 + 200 - 30)}px`);
      wrapper.remove();
    },
    8000,
  );

  /* ---------------------------------------------------------- *
   * 広幅（PC）: キャレットの行の下。下に入らなければ上
   * ---------------------------------------------------------- */

  it(
    '広幅では position: absolute でキャレットの行の下に置く（scrollX / scrollY を足す）',
    async () => {
      useWide();
      stubScroll(40, 300);
      stubRect(field, { top: 100, right: 300, bottom: 130, left: 20 });
      field.style.lineHeight = '20px';
      ime.attach(field);
      // jsdom は layout を持たない ∴ popup の高さを決め打ちにする（下に入るかどうかの判定に使う）
      Object.defineProperty(popupOf(), 'offsetHeight', { configurable: true, value: 200 });
      await ime.open(field);

      const pop = popupOf();
      expect(pop.classList.contains('naga-is-docked'), '前提: 広幅は dock しない').toBe(false);
      expect(pop.style.position, 'fixed ではなく absolute（文書の座標）').toBe('absolute');
      expect(pop.style.top, 'キャレットの行の下端 ＋ 2（文書の縦座標）').toBe(`${100 + 300 + 20 + 2}px`);
      expect(pop.style.left, 'キャレットの横 ＋ scrollX').toBe(`${20 + 40}px`);
      expect(pop.style.maxHeight, 'PC は dock 用の高さを残さない').toBe('');
    },
    8000,
  );

  it(
    '広幅で可視域の下端（scrollY + innerHeight）に入らなければ、キャレットの行の上に出す',
    async () => {
      useWide();
      stubInnerHeight(140); // 可視域の下端は 300 + 140 = 440
      stubScroll(0, 300);
      stubRect(field, { top: 100, right: 300, bottom: 130, left: 20 });
      field.style.lineHeight = '20px';
      ime.attach(field);
      Object.defineProperty(popupOf(), 'offsetHeight', { configurable: true, value: 200 });
      await ime.open(field);

      const pop = popupOf();
      expect(pop.style.top, 'キャレットの行の上端 − 高さ − 2（文書の縦座標）').toBe(`${100 + 300 - 200 - 2}px`);
    },
    8000,
  );

  it(
    '広幅でもページのスクロールでは置き直さない（キャレットの相対位置は保たれる）',
    async () => {
      useWide();
      stubScroll(0, 0);
      stubRect(field, { top: 100, right: 300, bottom: 130, left: 20 });
      field.style.lineHeight = '20px';
      ime.attach(field);
      Object.defineProperty(popupOf(), 'offsetHeight', { configurable: true, value: 200 });
      await ime.open(field);
      runFrames();
      const before = popupOf().style.top;

      const spy = spyPosition();
      stubScroll(0, 300);
      window.dispatchEvent(new Event('scroll'));
      vv.dispatchEvent(new Event('scroll'));
      runFrames();
      expect(spy).not.toHaveBeenCalled();
      expect(popupOf().style.top).toBe(before);
      spy.mockRestore();
    },
    8000,
  );

  it(
    '広幅と狭幅を行き来すると、それぞれの置き方に戻る',
    async () => {
      useWide();
      stubScroll(0, 0);
      stubRect(field, { top: 100, right: 300, bottom: 130, left: 20 });
      field.style.lineHeight = '20px';
      const setCaret = stubCaret(null); // キャレットを測れない欄（広幅は欄の下端、狭幅も欄の下端に落ちる）
      ime.attach(field);
      Object.defineProperty(popupOf(), 'offsetHeight', { configurable: true, value: 200 });
      await ime.open(field);
      const wideTop = popupOf().style.top;
      expect(popupOf().classList.contains('naga-is-docked')).toBe(false);

      useNarrow();
      setCaret({ x: 20, y: 60, lineHeight: 20 }); // 狭幅はキャレットの行のすぐ下（0434）
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().classList.contains('naga-is-docked')).toBe(true);
      expect(popupOf().style.top).toBe(`${60 + 20 + CARET_GAP}px`);
      expect(Math.abs(parseFloat(popupOf().style.top) - parseFloat(wideTop))).toBeGreaterThan(TOL);

      useWide();
      setCaret(null);
      window.dispatchEvent(new Event('resize'));
      expect(popupOf().classList.contains('naga-is-docked')).toBe(false);
      expect(popupOf().style.top).toBe(wideTop);
      expect(popupOf().style.maxHeight).toBe('');
    },
    8000,
  );
});
