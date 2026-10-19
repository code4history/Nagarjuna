/**
 * 【NOV26-IM-NAGA-IOS-TRIGGER-0426】起動ボタン「梵」の置き直しの単体テスト。
 *
 * iOS（Safari・Edge とも WebKit）は欄の focus の後にキーボードを出し、欄が見える位置へページを動かし、
 * visual viewport をパンする。fixed のボタンは layout viewport 基準なので、置き直さないと画面の外へ行く。
 * ここでは jsdom に visualViewport が無いことを逆手に取り、可視域（offsetTop・高さ）を与えた偽物を
 * window.visualViewport として挿して、座標の計算と購読の寿命を決め打ちの数値で測る
 * （画面を伴う確認は e2e/ios-trigger.spec.ts が WebKit の iPhone 模擬で行う）。
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
function stubRect(el: HTMLElement, rect: StubRect): void {
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

describe('起動ボタンの置き直し（iOS のキーボードとスクロール）', () => {
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

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vv = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    runFrames = useManualFrames();
    field = document.createElement('input');
    field.type = 'text';
    document.body.append(field);
    ime = new NagaIME({ loadFonts: false });
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: undefined });
    vi.restoreAllMocks();
  });

  it('可視域をパンしていなければ従来どおり欄の右上に置く（offset を二重に効かせない）', () => {
    // パンの無い状態（PC・iOS でもキーボードが出る前と同じ）
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    vv.offsetTop = 150; // パンしているが、欄の上に十分な余白がある
    vv.height = 480;
    ime.attach(field);
    field.focus();
    const trigger = triggerOf();
    expect(trigger.hidden).toBe(false);
    expect(trigger.style.top).toBe(`${400 - SIZE - GAP}px`);
    expect(trigger.style.left).toBe(`${376 - SIZE}px`);
  });

  it('欄のすぐ上が可視域の外なら、ボタンを欄のすぐ下へ回す（画面の外に残さない）', () => {
    // iOS が欄を画面上端へ寄せた状態: 可視域は 150〜630（高さ 480）、欄は layout 座標で 121〜153
    vv.offsetTop = 150;
    vv.height = 480;
    stubRect(field, { top: 121, right: 376, bottom: 153, left: 16 });
    ime.attach(field);
    field.focus();
    const trigger = triggerOf();
    const top = Number.parseFloat(trigger.style.top);
    // 画面上の座標（layout 座標 − offsetTop）で可視域の中に居る
    expect(top - vv.offsetTop).toBeGreaterThanOrEqual(MARGIN);
    expect(top - vv.offsetTop + SIZE).toBeLessThanOrEqual(vv.offsetTop - vv.offsetTop + vv.height);
    // 欄のすぐ下（欄の上の余白には置かない）
    expect(top).toBe(153 + GAP);
    expect(trigger.style.left).toBe(`${376 - SIZE}px`);
  });

  it('visualViewport の scroll で置き直す（可視域のパンでは window の scroll が来ない）', () => {
    vv.offsetTop = 0;
    vv.height = 852;
    stubRect(field, { top: 160, right: 376, bottom: 192, left: 16 });
    ime.attach(field);
    field.focus();
    expect(triggerOf().style.top).toBe(`${160 - SIZE - GAP}px`);

    // キーボードで可視域が縮み（0〜852 → 150〜630）、パンした（欄の layout 座標は変わらない）
    vv.offsetTop = 150;
    vv.height = 480;
    vv.dispatchEvent(new Event('scroll'));
    runFrames();
    const top = Number.parseFloat(triggerOf().style.top);
    // 画面上の欄の上端（160 − 150 = 10）の上にはボタンの居場所が無い ∴ 欄のすぐ下へ回る
    expect(top - vv.offsetTop).toBeGreaterThanOrEqual(MARGIN);
    expect(top).toBe(192 + GAP);
  });

  it('window の scroll でも置き直し、1 フレームに何度届いても置き直しは 1 回に間引く', () => {
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    const spy = vi.spyOn(ime as unknown as { positionTrigger: () => void }, 'positionTrigger');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(spy).not.toHaveBeenCalled();
    runFrames();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    // 置き直しの結果が欄に追随している
    stubRect(field, { top: 200, right: 376, bottom: 232, left: 16 });
    window.dispatchEvent(new Event('scroll'));
    runFrames();
    expect(triggerOf().style.top).toBe(`${200 - SIZE - GAP}px`);
  });

  it('blur で購読を外し、スクロールしても置き直さない', () => {
    stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
    ime.attach(field);
    field.focus();
    const before = triggerOf().style.top;
    field.blur();
    expect(triggerOf().hidden).toBe(true);
    stubRect(field, { top: 200, right: 376, bottom: 232, left: 16 });
    window.dispatchEvent(new Event('scroll'));
    vv.dispatchEvent(new Event('scroll'));
    runFrames();
    expect(triggerOf().style.top).toBe(before);
  });

  it('detach で購読をすべて外す（window と visualViewport に listener を残さない）', () => {
    // 数え始めは attach の前（ensureDom の全体の購読も含めて数える）
    const win = countListeners(window);
    const viewport = countListeners(vv);
    try {
      stubRect(field, { top: 400, right: 376, bottom: 432, left: 16 });
      ime.attach(field);
      field.focus();
      expect(win.counts.get('scroll') ?? 0).toBeGreaterThan(0);
      expect(win.counts.get('resize') ?? 0).toBeGreaterThan(0);
      expect(viewport.counts.get('scroll') ?? 0).toBeGreaterThan(0);
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
    window.dispatchEvent(new Event('scroll'));
    runFrames();
    expect(triggerOf().style.top).toBe(`${250 - SIZE - GAP}px`);
  });
});
