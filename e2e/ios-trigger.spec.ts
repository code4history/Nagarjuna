import { expect, test, type Page } from '@playwright/test';
import { PART, fieldRect, gotoFixture, isShown, partInfo, waitShown, type Rect } from './helpers';

// 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】起動ボタン「梵」の置き場所の回帰試験（iOS のキーボードとスクロール）。
//
// 実機の iPhone は測れない。ここで測るのは **WebKit に iPhone を模した端末（devices['iPhone 15']）**。
// project webkit-iphone でだけ走る（playwright.config.ts）。
//
// 0426 の実装はボタンを position: fixed（layout viewport 基準）で置き、scroll のたびに置き直していた。
// 実機の iPhone では、キーボードを出したままスクロールすると visual viewport の offset とページの
// スクロールが混ざってボタンが「明後日の場所」に出て欄とは違う速さで通り過ぎ、欄が画面外に出ると
// 可視域の端に貼り付いた。0430 でボタンを文書の座標（position: absolute）に置き直し、スクロールでの
// 置き直しをやめた ∴ ここでは「rect が本文と一緒に動くこと（欄との差が一定）」を測る。
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

/** 影の中の起動ボタンの矩形（layout viewport の座標。visual viewport の offset は引かない）。 */
async function triggerRect(page: Page): Promise<Rect> {
  const info = await partInfo(page, PART.trigger);
  if (!info) throw new Error('起動ボタンが無い');
  return info.rect;
}

/** 影の中の起動ボタンの inline style と計算済みの position。 */
async function triggerStyle(page: Page): Promise<{ top: string; left: string; position: string }> {
  return page.evaluate(() => {
    const walk = (root: Document | ShadowRoot): Element | null => {
      const hit = root.querySelector('.naga-trigger');
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
    if (!el) throw new Error('起動ボタンが無い');
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

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-mobile');
});

test('I-1: 梵ボタンは文書の座標（absolute）で欄の右上に置かれ、ページをスクロールしても欄との差が変わらない', async ({
  page,
}) => {
  await focusM1(page);
  const style = await triggerStyle(page);
  expect(style.position, '[measure:I-1] position は absolute（fixed ではない）').toBe('absolute');

  // iOS がキーボードのために欄を動かすのと同じく、ページを少しずつスクロールする
  const gaps: number[] = [];
  for (const y of [0, 40, 80, 120, 160]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY), `前提: ${y} までスクロールした`).toBe(y);
    const field = await fieldRect(page, 'm1');
    const trig = await triggerRect(page);
    expect(Math.abs(trig.right - field.right), `[measure:I-1] scrollY=${y} 右端が欄の右端に揃う`).toBeLessThanOrEqual(1);
    gaps.push(field.top - trig.bottom);
  }
  // 欄の上端とボタンの下端の差が、どのスクロール位置でも同じ（＝ボタンが本文と一緒に動く）
  expect(Math.max(...gaps) - Math.min(...gaps), '[measure:I-1] 欄との差が一定（±1px）').toBeLessThanOrEqual(1);
  expect(gaps[0], '[measure:I-1] ボタンは欄のすぐ上（間隔 4px）').toBeGreaterThanOrEqual(3);
  expect(gaps[0], '[measure:I-1] ボタンは欄のすぐ上（間隔 4px）').toBeLessThanOrEqual(5);
});

test('I-2: 欄が文書の先頭なら、梵ボタンは欄のすぐ下に置く（上に出さない）', async ({ page }) => {
  // #m1 を文書の先頭（body の最初の子）へ移すと、欄の上にはボタンの居場所が無い
  await page.evaluate(() => {
    const f = document.getElementById('m1') as HTMLInputElement;
    f.style.margin = '0';
    f.style.width = '200px';
    document.body.insertBefore(f, document.body.firstChild);
    window.scrollTo(0, 0);
    f.focus({ preventScroll: true });
  });
  await waitShown(page, PART.trigger);
  await settle(page);

  const field = await fieldRect(page, 'm1');
  expect(field.top, '前提: 欄が文書の先頭にある').toBeLessThanOrEqual(1);
  const trig = await triggerRect(page);
  expect(await isShown(page, PART.trigger), '[measure:I-2] ボタンが表示されている').toBe(true);
  expect(trig.top, '[measure:I-2] 欄のすぐ下に置く').toBeGreaterThanOrEqual(field.bottom);
  expect(trig.top - field.bottom, '[measure:I-2] 欄の下端から間隔 4px').toBeLessThanOrEqual(5);
  expect(Math.abs(trig.right - field.right), '[measure:I-2] 右端が欄の右端に揃う').toBeLessThanOrEqual(1);
});

test('I-3: 欄を画面外までスクロールすると、梵ボタンも画面外へ行く（可視域の端に貼り付かない）', async ({ page }) => {
  await focusM1(page);
  const before = await triggerRect(page);

  // 欄が可視域の上へ抜ける位置までスクロールする
  await page.evaluate(() => window.scrollTo(0, 800));
  await settle(page);
  const field = await fieldRect(page, 'm1');
  expect(field.top, '前提: 欄が可視域の上へ抜けた').toBeLessThan(-600);

  const after = await triggerRect(page);
  expect(after.top, '[measure:I-3] ボタンも画面外（可視域の上端に貼り付いていない）').toBeLessThan(0);
  // 欄との相対位置は保たれている（clamp していない）
  expect(Math.abs(field.top - after.bottom - 4), '[measure:I-3] 欄との差は保たれる').toBeLessThanOrEqual(1);
  expect(after.top - before.top, '[measure:I-3] ページのスクロール分だけ動いた').toBeLessThan(-700);
});

test('I-4: visualViewport がパンしても（キーボード）、梵ボタンの置き場所と欄との相対位置は変わらない', async ({ page }) => {
  await focusM1(page);
  const styleBefore = await triggerStyle(page);
  const fieldBefore = await fieldRect(page, 'm1');
  const trigBefore = await triggerRect(page);

  // キーボードで可視域が縮み（高さ 852 → 480）、パンする（offsetTop = 0 → 150）。欄の layout 座標は変わらない
  await mockVisualViewport(page, { offsetTop: 150, offsetLeft: 0, height: 480 });
  await page.evaluate(() => {
    // 実機では visualViewport の resize と scroll が続けて届く
    window.visualViewport?.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('scroll'));
  });
  await settle(page);

  const styleAfter = await triggerStyle(page);
  expect(styleAfter.top, '[measure:I-4] visualViewport の offset を位置に使わない').toBe(styleBefore.top);
  expect(styleAfter.left, '[measure:I-4] visualViewport の offset を位置に使わない').toBe(styleBefore.left);
  const fieldAfter = await fieldRect(page, 'm1');
  expect(Math.abs(fieldAfter.top - fieldBefore.top), '前提: 欄の layout 座標は変わらない').toBeLessThanOrEqual(1);
  const trigAfter = await triggerRect(page);
  expect(Math.abs(trigAfter.top - trigBefore.top), '[measure:I-4] ボタンの矩形も変わらない').toBeLessThanOrEqual(1);

  // パンのあとにページをスクロールすると、ボタンは本文と一緒に動く（欄との差は一定のまま）
  await page.evaluate(() => window.scrollTo(0, 60));
  await settle(page);
  const fieldScrolled = await fieldRect(page, 'm1');
  const trigScrolled = await triggerRect(page);
  expect(Math.abs(fieldScrolled.top - trigScrolled.bottom - 4), '[measure:I-4] パンのあとも欄との差は一定').toBeLessThanOrEqual(1);
});

test('I-5: 欄から離れる（blur）と梵ボタンは消え、置き直しの購読も残らない', async ({ page }) => {
  await focusM1(page);
  await page.evaluate(() => {
    (document.getElementById('m1') as HTMLInputElement).blur();
  });
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:I-5] blur で消える' }).toBe(false);
  const blurred = await triggerStyle(page);

  // 購読が外れていれば、scroll しても resize しても隠れたボタンの top は動かない
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('scroll'));
  });
  await settle(page);
  const after = await triggerStyle(page);
  expect(after.top, '[measure:I-5] blur の後は置き直さない').toBe(blurred.top);
  expect(after.left, '[measure:I-5] blur の後は置き直さない').toBe(blurred.left);
});
