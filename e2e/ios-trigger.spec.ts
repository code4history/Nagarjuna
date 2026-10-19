import { expect, test, type Page } from '@playwright/test';
import { PART, fieldRect, gotoFixture, isShown, waitShown, type Rect } from './helpers';

// 【NOV26-IM-NAGA-IOS-TRIGGER-0426】iOS（Safari・Edge。どちらも WebKit）で起動ボタン「梵」が出ない不具合の回帰試験。
//
// 実機の iPhone は測れない。ここで測るのは **WebKit に iPhone を模した端末（devices['iPhone 15']）**。
// project webkit-iphone でだけ走る（playwright.config.ts）。
//
// 欄の focus の後に iOS は「ソフトキーボードを出す」「欄が見える位置へ動かす」を行い、そのときに
// (a) ページ（layout viewport）がスクロールする、(b) visual viewport がパンする（offsetTop > 0）—— の両方が起こる。
// 起動ボタンは position: fixed（layout viewport 基準）なので、置き直さないと欄から離れて画面の外へ行く。
// WebKit を Playwright で動かすかぎり本当のソフトキーボードは出ない ∴ (b) は visualViewport の読み取り値を
// 差し替えて模す（offsetTop/offsetLeft/height/width の getter を上書きする。実物の VisualViewport のままなので
// イベントは本物の購読経路で届く）。

/** 「画面上の」矩形 = layout viewport の矩形から visual viewport の offset を引いたもの。 */
interface ScreenBox extends Rect {
  /** 画面上の可視域（visual viewport）の上端・左端・下端・右端（同じ座標系） */
  viewTop: number;
  viewLeft: number;
  viewBottom: number;
  viewRight: number;
}

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

/** 影の中の部品の矩形と、そのときの可視域を「画面上の」座標で返す。 */
async function screenBox(page: Page, selector: string): Promise<ScreenBox> {
  return page.evaluate((sel) => {
    const walk = (root: Document | ShadowRoot): Element | null => {
      const hit = root.querySelector(sel);
      if (hit) return hit;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) {
          const inner = walk(el.shadowRoot);
          if (inner) return inner;
        }
      }
      return null;
    };
    const el = walk(document);
    if (!el) throw new Error(`見つからない: ${sel}`);
    const vv = window.visualViewport;
    const ox = vv ? vv.offsetLeft : 0;
    const oy = vv ? vv.offsetTop : 0;
    const r = el.getBoundingClientRect();
    return {
      left: r.left - ox,
      top: r.top - oy,
      right: r.right - ox,
      bottom: r.bottom - oy,
      width: r.width,
      height: r.height,
      viewTop: 0,
      viewLeft: 0,
      viewBottom: vv ? vv.height : window.innerHeight,
      viewRight: vv ? vv.width : window.innerWidth,
    };
  }, selector);
}

/** 1 フレーム（＋rAF で間引いた置き直し）を待つ。 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-mobile');
});

test('I-1: focus のあとページがスクロールしても、梵ボタンは欄の右上に付いてくる', async ({ page }) => {
  // 欄（#m1）は文書座標で 120px あたり。focus は「スクロールさせない」で置く（iOS の暗黙のスクロールを混ぜない）
  await page.evaluate(() => {
    const f = document.getElementById('m1') as HTMLInputElement;
    f.focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);
  const before = await fieldRect(page, 'm1');
  expect(before.top, '前提: #m1 は画面上端より下にある').toBeGreaterThan(60);

  // iOS がキーボードのために欄を上へ動かすのと同じく、ページをスクロールする
  await page.evaluate(() => window.scrollTo(0, 60));
  await settle(page);
  expect(await page.evaluate(() => window.scrollY), '前提: ページがスクロールした').toBe(60);

  const field = await fieldRect(page, 'm1');
  const trig = await screenBox(page, PART.trigger);
  // 欄の右上（右端を揃え、欄のすぐ上）
  expect(Math.abs(trig.right - field.right), '[measure:I-1] 右端が欄の右端に揃う').toBeLessThanOrEqual(1);
  expect(trig.bottom, '[measure:I-1] ボタンは欄の上にある').toBeLessThanOrEqual(field.top);
  expect(trig.bottom, '[measure:I-1] ボタンは欄のすぐ上にある').toBeGreaterThanOrEqual(field.top - 8);
  // 可視域の中
  expect(trig.top, '[measure:I-1] 可視域の上端より下').toBeGreaterThanOrEqual(0);
  expect(trig.bottom, '[measure:I-1] 可視域の下端より上').toBeLessThanOrEqual(trig.viewBottom);
});

test('I-2: 欄が画面上端に寄っても、梵ボタンは可視域の中に残る', async ({ page }) => {
  await page.evaluate(() => {
    const f = document.getElementById('m1') as HTMLInputElement;
    f.focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);

  // iOS は欄を可視域の上のほうへ寄せる（欄のすぐ上が画面の外に出る位置）。欄の上にボタンの居場所は無い
  await page.evaluate(() => window.scrollTo(0, 140));
  await settle(page);
  const field = await fieldRect(page, 'm1');
  expect(field.top, '前提: #m1 の上の余白が可視域の外').toBeLessThan(30);

  const trig = await screenBox(page, PART.trigger);
  // 出ていない・画面外に居ない、を測る
  expect(await isShown(page, PART.trigger), '[measure:I-2] ボタンが表示されている').toBe(true);
  expect(trig.top, '[measure:I-2] 可視域の上端より下').toBeGreaterThanOrEqual(0);
  expect(trig.bottom, '[measure:I-2] 可視域の下端より上').toBeLessThanOrEqual(trig.viewBottom);
  expect(trig.left, '[measure:I-2] 可視域の左端より右').toBeGreaterThanOrEqual(0);
  expect(trig.right, '[measure:I-2] 可視域の右端より左').toBeLessThanOrEqual(trig.viewRight);
  // 欄の右上の列（横は欄の右端に揃えたまま）
  expect(Math.abs(trig.right - field.right), '[measure:I-2] 右端が欄の右端に揃う').toBeLessThanOrEqual(1);
});

test('I-3: visualViewport がパンしても（キーボード）、梵ボタンは欄の右上の可視域に残る', async ({ page }) => {
  await page.evaluate(() => {
    const f = document.getElementById('m1') as HTMLInputElement;
    f.focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);

  // キーボードで可視域が縮み（高さ 852 → 480）、パンする（offsetTop = 0 → 150）。欄の layout 座標は変わらない
  await mockVisualViewport(page, { offsetTop: 150, offsetLeft: 0, height: 480 });
  await page.evaluate(() => {
    // 実機では visualViewport の resize と scroll が続けて届く
    window.visualViewport?.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('scroll'));
  });
  await settle(page);

  const field = await screenBox(page, '#m1');
  const trig = await screenBox(page, PART.trigger);
  expect(field.top, '前提: 欄の上端は可視域の上端より上（パンで隠れた）').toBeLessThan(0);
  // 画面上でボタンが見えている
  expect(trig.top, '[measure:I-3] 可視域の上端より下').toBeGreaterThanOrEqual(0);
  expect(trig.bottom, '[measure:I-3] 可視域の下端より上').toBeLessThanOrEqual(trig.viewBottom);
  // 画面の上のほう（可視域の上端）に貼り付く。下端へ落ちていない
  expect(trig.top, '[measure:I-3] 可視域の上端の近くに置き直す').toBeLessThanOrEqual(16);
  expect(Math.abs(trig.right - field.right), '[measure:I-3] 右端が欄の右端に揃う').toBeLessThanOrEqual(1);
});

test('I-4: 欄から離れる（blur）と梵ボタンは消え、置き直しの購読も残らない', async ({ page }) => {
  await page.evaluate(() => {
    (document.getElementById('m1') as HTMLInputElement).focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);

  await page.evaluate(() => {
    (document.getElementById('m1') as HTMLInputElement).blur();
  });
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:I-4] blur で消える' }).toBe(false);
  const blurredTop = await page.evaluate(() => {
    const host = document.querySelector('naga-ime')!;
    return (host.shadowRoot!.querySelector('.naga-trigger') as HTMLElement).style.top;
  });

  // 購読が外れていれば、scroll しても置き直さない（隠れたボタンの top が動かない）
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('scroll')));
  await settle(page);
  const afterTop = await page.evaluate(() => {
    const host = document.querySelector('naga-ime')!;
    return (host.shadowRoot!.querySelector('.naga-trigger') as HTMLElement).style.top;
  });
  expect(afterTop, '[measure:I-4] blur の後は scroll しても置き直さない').toBe(blurredTop);
});
