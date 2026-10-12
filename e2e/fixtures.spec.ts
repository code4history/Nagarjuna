import { expect, test } from '@playwright/test';
import { fieldRect, gotoFixture } from './helpers';

// nov26-m3-t1 §3.6: 前提の spec。test.fail() を付けない（前提が崩れたらここが赤になる）。

test('F-1: F-CLEAN と F-RESET で #f1・#f2 の矩形が 0.5px 以内で同じ', async ({ page }) => {
  await gotoFixture(page, 'f-clean');
  const clean = { f1: await fieldRect(page, 'f1'), f2: await fieldRect(page, 'f2') };
  await gotoFixture(page, 'f-reset');
  const reset = { f1: await fieldRect(page, 'f1'), f2: await fieldRect(page, 'f2') };
  for (const id of ['f1', 'f2'] as const) {
    for (const k of ['left', 'top', 'width', 'height'] as const) {
      expect(Math.abs(clean[id][k] - reset[id][k]), `${id}.${k} clean=${clean[id][k]} reset=${reset[id][k]}`).toBeLessThanOrEqual(0.5);
    }
  }
});

test('F-2: 固定ページの準備が済んでいる', async ({ page }) => {
  for (const name of ['f-clean', 'f-reset', 'f-shadow']) {
    await gotoFixture(page, name);
    expect(await page.evaluate(() => typeof (window as unknown as { __naga?: unknown }).__naga), name).toBe('object');
  }
  await gotoFixture(page, 'f-decl', false);
  expect(await page.locator('naga-ime').count()).toBe(1);
});

test('F-3: F-RESET の敵対的な CSS が効いている（陽性対照）', async ({ page }) => {
  await gotoFixture(page, 'f-reset');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('10px');
});
