import { expect, test, type Page } from '@playwright/test';
import { PART, deepHandle, gotoFixture, isShown, nagaIsOpen, partInfo, waitShown } from './helpers';

// nov26-m3-t1 §3.4 S: Shadow DOM の中の欄（F-SHADOW）。各 expect に測りの印 [measure:<ID>] を付ける。

const shadowField = (id: string) => `#host >> #${id}`;

async function shadowRect(page: Page, id: string) {
  return page.evaluate((fid) => {
    const r = document.getElementById('host')!.shadowRoot!.getElementById(fid)!.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }, id);
}

async function setShadowValue(page: Page, id: string, value: string, pos: number): Promise<void> {
  await page.evaluate(
    ([fid, v, p]) => {
      const f = document.getElementById('host')!.shadowRoot!.getElementById(fid as string) as HTMLInputElement;
      f.focus();
      f.value = v as string;
      f.setSelectionRange(p as number, p as number);
    },
    [id, value, pos] as const,
  );
}

async function shadowValue(page: Page, id: string) {
  return page.evaluate((fid) => {
    const f = document.getElementById('host')!.shadowRoot!.getElementById(fid) as HTMLInputElement;
    return { value: f.value, caret: f.selectionStart };
  }, id);
}

/** 欄に ab・キャレット 1 で開き、先頭の候補を click して確定する。確定した文字を返す。 */
async function commitFirst(page: Page, id: string): Promise<string> {
  await setShadowValue(page, id, 'ab', 1);
  await page.keyboard.press('Control+j');
  await waitShown(page, PART.item);
  const item = (await deepHandle(page, PART.item))!;
  const ch = await item.evaluate((el) => (el as HTMLElement).dataset.char ?? '');
  await item.click();
  return ch;
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-shadow');
});

test('S-a: 影の中の #s1 の focus で trigger が見える', async ({ page }) => {
  await page.locator(shadowField('s1')).focus();
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:S-a]' }).toBe(true);
});

test('S-b: #s1 で Control+j を押すと popup が見える', async ({ page }) => {
  await page.locator(shadowField('s1')).focus();
  await page.keyboard.press('Control+j');
  await expect.poll(() => isShown(page, PART.popup), { message: '[measure:S-b]' }).toBe(true);
});

test('S-c: 開いた状態で #s1 を click しても popup は開いたまま', async ({ page }) => {
  await page.locator(shadowField('s1')).focus();
  await page.keyboard.press('Control+j');
  await waitShown(page, PART.item);
  await page.locator(shadowField('s1')).click();
  expect(await nagaIsOpen(page), '[measure:S-c]').toBe(true);
  expect(await isShown(page, PART.popup), '[measure:S-c]').toBe(true);
});

test('S-d: #s1 で候補を click すると a<候補>b になり、キャレットが挿入の直後', async ({ page }) => {
  const ch = await commitFirst(page, 's1');
  const v = await shadowValue(page, 's1');
  expect(v.value, '[measure:S-d]').toBe(`a${ch}b`);
  expect(v.caret, '[measure:S-d]').toBe(1 + ch.length);
});

test('S-e: S-d の確定で文書の input listener に composed な input が 1 件届く', async ({ page }) => {
  await commitFirst(page, 's1');
  const got = await page.evaluate(() => (window as unknown as { __docInputs: Array<{ type: string; composed: boolean }> }).__docInputs);
  expect(got.length, '[measure:S-e]').toBe(1);
  expect(got[0]?.composed, '[measure:S-e]').toBe(true);
});

test('S-f: #s2（textarea）で候補を click すると a<候補>b になり、キャレットが挿入の直後', async ({ page }) => {
  const ch = await commitFirst(page, 's2');
  const v = await shadowValue(page, 's2');
  expect(v.value, '[measure:S-f]').toBe(`a${ch}b`);
  expect(v.caret, '[measure:S-f]').toBe(1 + ch.length);
});

test('S-g: #s1 の後に #s2 を focus すると trigger が #s2 の右上に出る', async ({ page }) => {
  await page.locator(shadowField('s1')).focus();
  await page.locator(shadowField('s2')).focus();
  await expect.poll(() => isShown(page, PART.trigger), { message: '[measure:S-g]' }).toBe(true);
  const trig = (await partInfo(page, PART.trigger))!;
  const s2 = await shadowRect(page, 's2');
  expect(Math.abs(trig.rect.right - s2.right), '[measure:S-g]').toBeLessThanOrEqual(1);
  expect(trig.rect.bottom, '[measure:S-g]').toBeLessThanOrEqual(s2.top);
});
