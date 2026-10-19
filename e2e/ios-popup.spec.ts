import { expect, test, type Page } from '@playwright/test';
import { PART, fieldRect, gotoFixture, nagaIsOpen, partInfo, waitShown, type Rect } from './helpers';

// 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup の置き場所の回帰試験（iOS のキーボードとスクロール）。
//
// 実機の iPhone は測れない。ここで測るのは **WebKit に iPhone を模した端末（devices['iPhone 15']・393×852）**。
// project webkit-iphone でだけ走る（playwright.config.ts）。幅 393 < dockBreakpoint 560 ∴ dock 側を測る。
//
// 0431 まで狭幅の popup は position: fixed で画面の下に据え付け、visualViewport の offset から bottom を
// 計算し、ページのスクロールのたびに置き直していた。実機の iPhone ではキーボード表示中に fixed が
// visual viewport とずれ、popup が欄と無関係に動いて「ふわふわ」していた。0432 で梵ボタンと同じく
// 文書の座標（position: absolute）で欄のすぐ下に置き、ページのスクロールでは置き直さない。
// ∴ ここでは「popup の上端と欄の下端の差が、どのスクロール位置・どの visual viewport のパンでも
// 一定であること」を測る。
// WebKit を Playwright で動かすかぎり本当のソフトキーボードは出ない ∴ visualViewport のパンは
// 読み取り値を差し替えて模す（getter を上書きする。実物の VisualViewport のままなのでイベントは
// 本物の購読経路で届く）。

/** visual viewport の offset を上書きして「キーボードで可視域が縮んでパンした」状態を模す。 */
async function mockVisualViewport(page: Page, v: { offsetTop: number; offsetLeft: number; height: number }): Promise<void> {
  await page.evaluate((vv) => {
    const target = window.visualViewport;
    if (!target) throw new Error('visualViewport が無い');
    Object.defineProperty(target, 'offsetTop', { configurable: true, get: () => vv.offsetTop });
    Object.defineProperty(target, 'offsetLeft', { configurable: true, get: () => vv.offsetLeft });
    Object.defineProperty(target, 'height', { configurable: true, get: () => vv.height });
  }, v);
}

/** 1 フレーム（＋rAF で間引いた置き直し）を待つ。 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
}

/** 影の中の popup の矩形（layout viewport の座標。visual viewport の offset は引かない）。 */
async function popupRect(page: Page): Promise<Rect> {
  const info = await partInfo(page, PART.popup);
  if (!info) throw new Error('popup が無い');
  return info.rect;
}

/** 影の中の popup の inline style と計算済みの position。 */
async function popupStyle(page: Page): Promise<{ top: string; left: string; position: string }> {
  return page.evaluate(() => {
    const walk = (root: Document | ShadowRoot): Element | null => {
      const hit = root.querySelector('.naga-popup');
      if (hit) return hit;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) {
          const inner = walk(el.shadowRoot);
          if (inner) return inner;
        }
      }
      return null;
    };
    const el = walk(document) as HTMLElement | null;
    if (!el) throw new Error('popup が無い');
    return { top: el.style.top, left: el.style.left, position: getComputedStyle(el).position };
  });
}

/** #m1 を「スクロールさせない」で focus する（iOS の暗黙のスクロールを混ぜない）。 */
async function focusM1(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.getElementById('m1') as HTMLInputElement).focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);
  await settle(page);
}

/** 梵ボタン（影の中）をタップして popup を開く。 */
async function openByTrigger(page: Page): Promise<void> {
  const r = await page.evaluate(() => {
    const el = document.querySelector('naga-ime')!.shadowRoot!.querySelector('.naga-trigger') as HTMLElement;
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await page.touchscreen.tap(r.x, r.y);
  await waitShown(page, PART.item);
  await settle(page);
}

/** popup の上端 − 欄の下端（この差が一定であることが「欄に付いている」の意味）。 */
async function gapOf(page: Page): Promise<number> {
  const field = await fieldRect(page, 'm1');
  const pop = await popupRect(page);
  return pop.top - field.bottom;
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-mobile');
  await focusM1(page);
  await openByTrigger(page);
  expect(await nagaIsOpen(page), '前提: popup が開いた').toBe(true);
});

test('X-1: popup は position: absolute で欄のすぐ下に付き、ページをスクロールしても欄との差が変わらない', async ({
  page,
}) => {
  const style = await popupStyle(page);
  expect(style.position, '[measure:X-1] position は absolute（fixed ではない）').toBe('absolute');

  const gaps: number[] = [];
  for (const y of [0, 40, 80, 120, 160]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY), `前提: ${y} までスクロールした`).toBe(y);
    gaps.push(await gapOf(page));
  }
  expect(Math.max(...gaps) - Math.min(...gaps), '[measure:X-1] 欄との差が一定（±1px）').toBeLessThanOrEqual(1);
  expect(gaps[0], '[measure:X-1] popup は欄のすぐ下（間隔 4px）').toBeGreaterThanOrEqual(3);
  expect(gaps[0], '[measure:X-1] popup は欄のすぐ下（間隔 4px）').toBeLessThanOrEqual(5);

  // スクロールしても popup の inline style（文書の座標）は書き換えない
  const after = await popupStyle(page);
  expect(after.top, '[measure:X-1] ページのスクロールでは置き直さない').toBe(style.top);
  expect(after.left, '[measure:X-1] ページのスクロールでは置き直さない').toBe(style.left);
});

test('X-2: visualViewport がパンしても（キーボード）、popup の欄との差は一定のまま', async ({ page }) => {
  const styleBefore = await popupStyle(page);
  const gapBefore = await gapOf(page);

  // キーボードで可視域が縮み（高さ 852 → 480）、パンする（offsetTop = 0 → 150）。欄の layout 座標は変わらない
  await mockVisualViewport(page, { offsetTop: 150, offsetLeft: 0, height: 480 });
  await page.evaluate(() => {
    // 実機では visualViewport の resize と scroll が続けて届く
    window.visualViewport?.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('scroll'));
  });
  await settle(page);

  const styleAfter = await popupStyle(page);
  expect(styleAfter.top, '[measure:X-2] visualViewport の offset を位置に使わない').toBe(styleBefore.top);
  expect(styleAfter.left, '[measure:X-2] visualViewport の offset を位置に使わない').toBe(styleBefore.left);
  expect(Math.abs((await gapOf(page)) - gapBefore), '[measure:X-2] パンのあとも欄との差は一定').toBeLessThanOrEqual(1);

  // パンのあとにページをスクロールしても、欄との差は一定のまま
  await page.evaluate(() => window.scrollTo(0, 60));
  await settle(page);
  expect(Math.abs((await gapOf(page)) - gapBefore), '[measure:X-2] パン＋スクロールでも差は一定').toBeLessThanOrEqual(1);
});

test('X-3: スクロールコンテナ（overflow: auto）をスクロールすると、popup が欄に付いてくる', async ({ page }) => {
  // #m1 は #scroller の中にある。要素のスクロールで欄が箱の中を動く ∴ popup は置き直す
  const gaps: number[] = [];
  for (const y of [0, 15, 30]) {
    await page.evaluate((top) => {
      document.getElementById('scroller')!.scrollTop = top;
    }, y);
    await settle(page);
    gaps.push(await gapOf(page));
  }
  expect(Math.max(...gaps) - Math.min(...gaps), '[measure:X-3] 欄との差が一定（±1px）').toBeLessThanOrEqual(1);
  expect(gaps[0], '[measure:X-3] popup は欄のすぐ下（間隔 4px）').toBeGreaterThanOrEqual(3);
  expect(gaps[0], '[measure:X-3] popup は欄のすぐ下（間隔 4px）').toBeLessThanOrEqual(5);
});

test('X-4: popup の横は文書の可視幅いっぱい（left 0・width は可視幅）', async ({ page }) => {
  const pop = await popupRect(page);
  const vw = await page.evaluate(() => ({
    docWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
  }));
  expect(pop.left, '[measure:X-4] 左端は可視域の左端').toBeGreaterThanOrEqual(-1);
  expect(pop.left, '[measure:X-4] 左端は可視域の左端').toBeLessThanOrEqual(1);
  expect(Math.abs(pop.width - vw.docWidth), '[measure:X-4] 幅は文書の可視幅').toBeLessThanOrEqual(1);
  expect(pop.right, '[measure:X-4] 右端は可視域の右端を超えない').toBeLessThanOrEqual(vw.innerWidth + 1);
});
