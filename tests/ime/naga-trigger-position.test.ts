/**
 * 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】起動ボタン「梵」の置き場所の単体テスト。
 *
 * 以前（0426）はボタンを `position: fixed` で置き、window と visualViewport の scroll・resize のたびに
 * 置き直していた。実機の iPhone ではキーボードを出したままスクロールすると、visualViewport の offset と
 * ページのスクロールが混ざってボタンが欄から離れ、欄が画面外に出ると可視域の端に貼り付いた。
 * いまは文書の座標（`position: absolute`）で置く ∴ ページのスクロールではブラウザが本文と一緒に動かし、
 * 置き直しの購読は resize（キーボードの出入り・回転）と focus の直後の 1 回だけになる。
 *
 * ここでは jsdom に layout が無いことを逆手に取り、`getBoundingClientRect` と `window.scrollX/scrollY` を
 * 決め打ちにして、style へ書かれる値と購読の寿命だけを測る（実の矩形は e2e/ios-trigger.spec.ts が
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

const SIZE = 26;
const GAP = 4;
const MARGIN = 4;

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

/** 対象の addEventListener / removeEventListener を数える（購読の寿命を測る）。 */
function countListeners(target: EventTarget): { counts: Map<string, number>; restore: () => void } {
  const counts = new Map<string, number>();
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  const addDesc = Object.getOwnPropertyDescriptor(target, 'addEventListener');
  const removeDesc = Object.getOwnPropertyDescriptor(target, 'removeEventListener');
  target.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
    counts.set(type, (counts.get(type) ?? 0) + 1);
    add(type, listener, options as AddEventListenerOptions);
  }) as typeof target.addEventListener;
  target.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
    counts.set(type, (counts.get(type) ?? 0) - 1);
    remove(type, listener, options as EventListenerOptions);
  }) as typeof target.removeEventListener;
  const restore = () => {
    // jsdom の window は addEventListener を own property に持つ ∴ 消さずに元の記述子へ戻す
    for (const [name, desc] of [
      ['addEventListener', addDesc],
      ['removeEventListener', removeDesc],
    ] as const) {
      if (desc) Object.defineProperty(target, name, desc);
      else delete (target as unknown as Record<string, unknown>)[name];
    }
  };
  return { counts, restore };
}

describe('起動ボタンの置き場所（文書の座標・position: absolute）', () => {
  let field: HTMLInputElement;
  let ime: NagaIME;
  let vv: FakeVisualViewport;
  let runFrames: () => void;

  function triggerOf(): HTMLElement {
    for (const el of Array.from(document.querySelectorAll('naga-ime'))) {
      const hit = el.shadowRoot?.querySelector('.naga-trigger');
      if (hit) return hit as HTMLElement;
    }
    throw new Error('起動ボタンが無い');
  }

  /** 表示中のボタンの置き直しを数える（private の positionTrigger を包む）。 */
  function spyPosition(): ReturnType<typeof vi.spyOn> {
    return vi.spyOn(ime as unknown as { positionTrigger: () => void }, 'positionTrigger');
  }

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vv = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    runFrames = useManualFrames();
    stubScroll(0, 0);
    field = document.createElement('input');
    field.type = 'text';
    document.body.append(field);
    ime = new NagaIME({ loadFonts: false });
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'scrollX');
    Reflect.deleteProperty(window, 'scrollY');
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vi.restoreAllMocks();
  });

  it('文書の座標で欄の右上に置く（scrollX / scrollY を足す）', () => {
    stubScroll(120, 500);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    const trig = triggerOf();
    expect(trig.hidden).toBe(false);
    expect(trig.style.top, '文書の縦座標（欄の上端 − 高さ − 間隔）').toBe(`${400 + 500 - SIZE - GAP}px`);
    expect(trig.style.left, '文書の横座標（欄の右端 − 高さ）').toBe(`${376 + 120 - SIZE}px`);
  });

  it('欄の上が文書の先頭より上なら、ボタンを欄のすぐ下へ回す（可視域の端へは貼らない）', () => {
    stubScroll(0, 0);
    stubRect(field, { top: 10, right: 376, bottom: 42, left: 16 });
    ime.attach(field);
    field.focus();
    const trig = triggerOf();
    expect(trig.style.top, '欄の下端 ＋ 間隔').toBe(`${42 + GAP}px`);
    expect(trig.style.left).toBe(`${376 - SIZE}px`);
  });

  it('visualViewport の offset を変えても、ボタンの style は変わらない', () => {
    stubScroll(0, 200);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    runFrames();
    const before = triggerOf().style.top;
    expect(before).toBe(`${400 + 200 - SIZE - GAP}px`);

    // キーボードで可視域が縮み（高さ 852 → 480）、パンした（offsetTop 150）
    vv.offsetTop = 150;
    vv.offsetLeft = 20;
    vv.height = 480;
    vv.width = 300;
    vv.dispatchEvent(new Event('scroll'));
    vv.dispatchEvent(new Event('resize'));
    runFrames();
    expect(triggerOf().style.top, 'visualViewport の offset は使わない').toBe(before);
  });

  it('window / visualViewport の scroll では置き直さない（文書の座標なのでブラウザが動かす）', () => {
    stubScroll(0, 0);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    runFrames(); // focus の直後の 1 回を流す
    const before = triggerOf().style.top;

    const spy = spyPosition();
    // スクロールして欄は画面の上のほうへ動いた（矩形が変わる）
    stubScroll(0, 300);
    stubRect(field, { top: 100, right: 376, bottom: 132, left: 16 });
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    vv.dispatchEvent(new Event('scroll'));
    runFrames();
    expect(spy, 'scroll では置き直さない').not.toHaveBeenCalled();
    expect(triggerOf().style.top, '置き場所は文書の座標のまま').toBe(before);
    spy.mockRestore();
  });

  it('window / visualViewport の resize で置き直す（1 フレームに 1 回へ間引く）', () => {
    stubScroll(0, 0);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    runFrames();

    const spy = spyPosition();
    stubRect(field, { top: 200, right: 376, bottom: 232, left: 16 });
    window.dispatchEvent(new Event('resize'));
    vv.dispatchEvent(new Event('resize'));
    expect(spy).not.toHaveBeenCalled();
    runFrames();
    expect(spy, '何度届いても 1 回').toHaveBeenCalledTimes(1);
    expect(triggerOf().style.top).toBe(`${200 - SIZE - GAP}px`);
    spy.mockRestore();
  });

  it('focus の直後に 1 回だけ置き直す（欄の中身やフォントでレイアウトが変わった場合）', () => {
    stubScroll(0, 0);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    // focus の時点では古い矩形で置いてある。直後の 1 回が新しい矩形を拾う
    stubRect(field, { top: 404, right: 376, bottom: 440, left: 16 });
    runFrames();
    expect(triggerOf().style.top).toBe(`${404 - SIZE - GAP}px`);
  });

  it('欄の右端が画面より左（横に溢れる）なら、左端を可視域の左端＋余白に留める', () => {
    stubScroll(0, 0);
    stubRect(field, { top: 400, right: 10, bottom: 432, left: -20 });
    ime.attach(field);
    field.focus();
    expect(triggerOf().style.left).toBe(`${0 + MARGIN}px`);
  });

  it('position 付きの要素の中に置かれたら、offsetParent の矩形とスクロールを引いて補正する', () => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    Object.defineProperty(wrapper, 'scrollTop', { configurable: true, value: 30 });
    Object.defineProperty(wrapper, 'scrollLeft', { configurable: true, value: 10 });
    document.body.append(wrapper);
    stubRect(wrapper, { top: 100, left: 40, bottom: 900, right: 400 });

    stubScroll(0, 200);
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    // 包含ブロックをこの要素にする（jsdom は offsetParent を持たないので決め打ち）
    Object.defineProperty(triggerOf(), 'offsetParent', { configurable: true, value: wrapper });

    window.dispatchEvent(new Event('resize'));
    runFrames();
    const trig = triggerOf();
    // 文書座標 570 / 350 から、要素の padding box の文書座標（100+200−30, 40+0−10）を引く
    expect(trig.style.top).toBe(`${400 + 200 - SIZE - GAP - (100 + 200 - 30)}px`);
    expect(trig.style.left).toBe(`${376 - SIZE - (40 - 10)}px`);
    wrapper.remove();
  });

  it('blur で購読を外し、スクロールしても置き直さない', () => {
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    runFrames();
    const before = triggerOf().style.top;
    field.blur();
    expect(triggerOf().hidden).toBe(true);
    stubScroll(0, 300);
    stubRect(field, { top: 100, right: 376, bottom: 132, left: 16 });
    window.dispatchEvent(new Event('scroll'));
    vv.dispatchEvent(new Event('scroll'));
    vv.dispatchEvent(new Event('resize'));
    runFrames();
    expect(triggerOf().style.top).toBe(before);
  });

  it('visualViewport の scroll は購読しない（購読は resize だけ）', () => {
    const viewport = countListeners(vv);
    try {
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      ime.attach(field);
      field.focus();
      expect(viewport.counts.get('resize') ?? 0, 'visualViewport の resize は購読する').toBeGreaterThan(0);
      expect(viewport.counts.get('scroll') ?? 0, 'visualViewport の scroll は購読しない').toBe(0);
    } finally {
      viewport.restore();
    }
  });

  it('detach で購読をすべて外す（window と visualViewport に listener を残さない）', () => {
    // 数え始めは attach の前（ensureDom の全体の購読も含めて数える）
    const win = countListeners(window);
    const viewport = countListeners(vv);
    try {
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      ime.attach(field);
      field.focus();
      expect(win.counts.get('resize') ?? 0).toBeGreaterThan(0);
      expect(viewport.counts.get('resize') ?? 0).toBeGreaterThan(0);

      ime.detach();
      for (const type of ['scroll', 'resize']) {
        expect(win.counts.get(type) ?? 0, `window の ${type} が残っていない`).toBe(0);
        expect(viewport.counts.get(type) ?? 0, `visualViewport の ${type} が残っていない`).toBe(0);
      }
    } finally {
      win.restore();
      viewport.restore();
    }
  });

  it('閉じても欄が focus のままなら、ボタンは欄の右上に居続ける（置き直しを止めない）', () => {
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    ime.close();
    expect(triggerOf().hidden).toBe(false);
    stubRect(field, { top: 250, right: 376, bottom: 282, left: 16 });
    window.dispatchEvent(new Event('resize'));
    runFrames();
    expect(triggerOf().style.top).toBe(`${250 - SIZE - GAP}px`);
  });
});
