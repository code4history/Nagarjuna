import { expect, test, type Page } from '@playwright/test';
import { PART, deepHandle, gotoFixture, isShown } from './helpers';

// nov26-m3-t1 §3.4 D: 宣言的な利用（F-DECL）。各 expect に測りの印 [measure:<ID>] を付ける。
// t2 の実装が辞書の読込を待つ時間を見込み、判定は expect.poll で待つ。

async function visibleTabs(page: Page): Promise<string[]> {
  const tabs = await deepHandle(page, '.naga-tabs');
  if (!tabs) return [];
  return tabs.evaluate((el) =>
    Array.from(el.querySelectorAll<HTMLElement>('.naga-tab'))
      .filter((b) => !b.hidden && getComputedStyle(b).display !== 'none')
      .map((b) => b.dataset.category ?? ''),
  );
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-decl', false);
});

test('D-a: naga-ime が登録され、文書の <naga-ime> がそのインスタンス', async ({ page }) => {
  const r = await page.evaluate(() => {
    const ctor = customElements.get('naga-ime');
    const el = document.querySelector('naga-ime');
    return { ctor: typeof ctor, instance: Boolean(ctor && el instanceof ctor) };
  });
  expect(r.ctor, '[measure:D-a]').toBe('function');
  expect(r.instance, '[measure:D-a]').toBe(true);
});

test('D-b: for の欄 #d1 では trigger が見え、for に無い #d2 では見えない', async ({ page }) => {
  await page.focus('#d1');
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:D-b]', timeout: 10_000 }).toBe(true);
  await page.focus('#d2');
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:D-b]', timeout: 10_000 }).toBe(false);
});

test('D-c: #d1 で開くとタブが categories の itaiji・kumimoji（と recent）だけ', async ({ page }) => {
  await page.focus('#d1');
  await page.keyboard.press('Control+j');
  await expect
    .poll(async () => (await visibleTabs(page)).filter((c) => c !== 'recent'), { message: '[measure:D-c]', timeout: 10_000 })
    .toEqual(['itaiji', 'kumimoji']);
});

test('D-d: el.categories の代入は属性を変えず、タブは代入した値（と recent）だけ', async ({ page }) => {
  await page.evaluate(() => {
    (document.querySelector('naga-ime') as unknown as { categories: string[] }).categories = ['hentaigana'];
  });
  expect(await page.evaluate(() => document.querySelector('naga-ime')!.getAttribute('categories')), '[measure:D-d]').toBe(
    'itaiji kumimoji',
  );
  await page.focus('#d1');
  await page.keyboard.press('Control+j');
  await expect
    .poll(async () => (await visibleTabs(page)).filter((c) => c !== 'recent'), { message: '[measure:D-d]', timeout: 10_000 })
    .toEqual(['hentaigana']);
});

test('D-e: document.head に style[data-naga-style] が無く、document.body の直下に NagaIME の部品が無い', async ({ page }) => {
  await page.focus('#d1');
  await page.keyboard.press('Control+j');
  await expect.poll(() => isShown(page, PART.popup), { message: '[measure:D-e]', timeout: 10_000 }).toBe(true);
  const r = await page.evaluate(() => ({
    headStyles: document.head.querySelectorAll('style[data-naga-style]').length,
    bodyParts: document.querySelectorAll('body > .naga-trigger, body > .naga-popup').length,
    shadowStyles: document.querySelector('naga-ime')!.shadowRoot!.querySelectorAll('style[data-naga-style]').length,
  }));
  expect(r.headStyles, '[measure:D-e]').toBe(0);
  expect(r.bodyParts, '[measure:D-e]').toBe(0);
  expect(r.shadowStyles, '[measure:D-e]').toBe(1);
});
