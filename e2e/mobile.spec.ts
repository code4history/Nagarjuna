import { expect, test, type Page } from '@playwright/test';
import { PART, gotoFixture, nagaIsOpen, waitShown } from './helpers';

// nov26-m3-t3 §3.7: スマートフォンの見え方（マイルストーン設計 §6.2 の M-1〜M-5）。
// project chromium-mobile（Pixel 5・isMobile・hasTouch）で走る。chromium はソフトキーボードを再現しない ∴
// 「使える高さ」は viewport の高さで与える（設計 R-1）。各 expect に測りの印 [measure:M-n] を付ける。
//
// 操作はすべて page.touchscreen.tap(x, y) で行う（ElementHandle.tap は押す前に要素を画面へスクロールしうる。
// それでは M-1 の「NagaIME がスクロールしない」を測れない）。

const HEIGHTS = [188, 216, 320] as const;
/** 帯（popup の上に残す高さ。M-3）と、可視の領域の下端との間（設計 §3.1）。 */
const BAND = 40;
const GAP = 8;
/** 畳んだ高さ（タイトル行＋写しの行＋枠。設計 §3.1）。 */
const FOLDED = 58;
const TOL = 0.5;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** 影の中（<naga-ime> の shadowRoot）の要素の矩形。見つからなければ null。 */
async function partRect(page: Page, selector: string): Promise<Box | null> {
  return page.evaluate((sel) => {
    const host = document.querySelector('naga-ime');
    const el = host?.shadowRoot?.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }, selector);
}

/** 矩形の中心をタップする（スクロールを伴わない）。 */
async function tapPart(page: Page, selector: string): Promise<void> {
  const r = await partRect(page, selector);
  if (!r) throw new Error(`見つからない: ${selector}`);
  await page.touchscreen.tap(r.left + r.width / 2, r.top + r.height / 2);
}

/** 一覧の中にまるごと入っている最初の候補をタップする。 */
async function tapVisibleItem(page: Page): Promise<string> {
  const hit = await page.evaluate(() => {
    const root = document.querySelector('naga-ime')!.shadowRoot!;
    const list = root.querySelector('.naga-list')!.getBoundingClientRect();
    for (const item of Array.from(root.querySelectorAll<HTMLElement>('.naga-item'))) {
      const r = item.getBoundingClientRect();
      if (r.top >= list.top - 0.5 && r.bottom <= list.bottom + 0.5) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, char: item.dataset.char ?? '' };
      }
    }
    return null;
  });
  if (!hit) throw new Error('一覧の中に見えている候補が無い');
  await page.touchscreen.tap(hit.x, hit.y);
  return hit.char;
}

interface ScrollState {
  winX: number;
  winY: number;
  scrollerTop: number;
  scrollerLeft: number;
  m1Top: number;
  m1Left: number;
  m2Top: number;
  m2Left: number;
}

async function scrollState(page: Page): Promise<ScrollState> {
  return page.evaluate(() => {
    const s = document.getElementById('scroller')!;
    const m1 = document.getElementById('m1')!;
    const m2 = document.getElementById('m2')!;
    return {
      winX: window.scrollX,
      winY: window.scrollY,
      scrollerTop: s.scrollTop,
      scrollerLeft: s.scrollLeft,
      m1Top: m1.scrollTop,
      m1Left: m1.scrollLeft,
      m2Top: m2.scrollTop,
      m2Left: m2.scrollLeft,
    };
  });
}

/** 1 フレーム待つ（スクロールや配置の反映を拾うため）。 */
async function frame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
}

/**
 * F-MOBILE を開き、ページ・#scroller・#m2 を 0 以外へ動かし、欄に focus する（スクロールさせない focus）。
 * #m2 のキャレットは見えている 2 行目の末尾に置く。
 */
async function setup(page: Page, fieldId: 'm1' | 'm2'): Promise<ScrollState> {
  await gotoFixture(page, 'f-mobile');
  await page.evaluate((fid) => {
    window.scrollTo(0, 37);
    document.getElementById('scroller')!.scrollTop = 23;
    const m2 = document.getElementById('m2') as HTMLTextAreaElement;
    m2.scrollTop = 11;
    const f = document.getElementById(fid) as HTMLInputElement | HTMLTextAreaElement;
    const pos = fid === 'm2' ? f.value.indexOf('\n', f.value.indexOf('\n') + 1) : f.value.length;
    f.focus({ preventScroll: true });
    f.setSelectionRange(pos, pos);
  }, fieldId);
  await waitShown(page, PART.trigger);
  await frame(page);
  const before = await scrollState(page);
  // 前提: 比較が 0 どうしにならない
  expect(before.winY, '[measure:M-1] 前提 scrollY').toBe(37);
  expect(before.scrollerTop, '[measure:M-1] 前提 #scroller.scrollTop').toBe(23);
  expect(before.m2Top, '[measure:M-1] 前提 #m2.scrollTop').toBe(11);
  return before;
}

async function openByTap(page: Page): Promise<void> {
  await tapPart(page, PART.trigger);
  await waitShown(page, PART.item);
  await frame(page);
}

async function visualViewport(page: Page): Promise<{ offsetTop: number; height: number; innerWidth: number; innerHeight: number }> {
  return page.evaluate(() => ({
    offsetTop: window.visualViewport?.offsetTop ?? 0,
    height: window.visualViewport?.height ?? window.innerHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));
}

for (const h of HEIGHTS) {
  test.describe(`375×${h}`, () => {
    test.use({ viewport: { width: 375, height: h } });

    test(`M-1 [${h}]: 開く・確定・タブ切替・畳む・開く・閉じるのどれでもページも欄もスクロールしない`, async ({ page }) => {
      for (const fieldId of ['m1', 'm2'] as const) {
        const before = await setup(page, fieldId);
        const valueBefore = await page.evaluate((fid) => (document.getElementById(fid) as HTMLInputElement).value, fieldId);
        const check = async (step: string) => {
          await frame(page);
          expect(await scrollState(page), `[measure:M-1] ${fieldId} ${step}`).toEqual(before);
        };

        await openByTap(page);
        expect(await nagaIsOpen(page), `[measure:M-1] ${fieldId} 開いた`).toBe(true);
        await check('開く');

        await tapVisibleItem(page);
        await check('確定 1');
        await tapVisibleItem(page);
        await check('確定 2');
        const valueAfter = await page.evaluate((fid) => (document.getElementById(fid) as HTMLInputElement).value, fieldId);
        expect(Array.from(valueAfter).length, `[measure:M-1] ${fieldId} 2 文字入った（陽性対照）`).toBe(Array.from(valueBefore).length + 2);

        await tapPart(page, '.naga-tab[data-category="siddham"]');
        await expect.poll(() => partRect(page, '.naga-tab.naga-is-active[data-category="siddham"]')).not.toBeNull();
        await check('タブ切替');

        await tapPart(page, '.naga-fold');
        await check('畳む');
        await tapPart(page, '.naga-fold');
        await check('開く（畳みを戻す）');

        await tapPart(page, '.naga-close');
        await expect.poll(() => nagaIsOpen(page)).toBe(false);
        await check('閉じる');
      }
    });

    test(`M-2 [${h}]: タブ・読み欄・写しの行・候補 1 行以上がまるごと見える`, async ({ page }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      for (const sel of ['.naga-tab.naga-is-active', '.naga-search', '.naga-copy']) {
        const r = await partRect(page, sel);
        expect(r, `[measure:M-2] ${sel} がある`).not.toBeNull();
        expect(r!.height, `[measure:M-2] ${sel} の高さ`).toBeGreaterThan(0);
        expect(r!.left, `[measure:M-2] ${sel} left`).toBeGreaterThanOrEqual(-TOL);
        expect(r!.top, `[measure:M-2] ${sel} top`).toBeGreaterThanOrEqual(-TOL);
        expect(r!.right, `[measure:M-2] ${sel} right`).toBeLessThanOrEqual(vp.innerWidth + TOL);
        expect(r!.bottom, `[measure:M-2] ${sel} bottom`).toBeLessThanOrEqual(vp.innerHeight + TOL);
      }
      const whole = await page.evaluate(() => {
        const root = document.querySelector('naga-ime')!.shadowRoot!;
        const list = root.querySelector('.naga-list')!.getBoundingClientRect();
        return Array.from(root.querySelectorAll('.naga-item')).filter((item) => {
          const r = item.getBoundingClientRect();
          return r.height > 0 && r.top >= list.top - 0.5 && r.bottom <= list.bottom + 0.5;
        }).length;
      });
      expect(whole, '[measure:M-2] 一覧の中にまるごと入る候補の数').toBeGreaterThanOrEqual(1);
    });

    test(`M-3 [${h}]: popup の上の帯が 40px 以上・下端は可視の領域の下端から 8px 以上`, async ({ page }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const pop = (await partRect(page, PART.popup))!;
      expect(pop.top - vp.offsetTop, '[measure:M-3] 帯').toBeGreaterThanOrEqual(BAND - TOL);
      expect(vp.offsetTop + vp.height - pop.bottom, '[measure:M-3] 下端との間').toBeGreaterThanOrEqual(GAP - TOL);
    });

    test(`M-4 [${h}]: 畳むと高さがタイトル行と写しの行だけになり帯が広がる。開くと戻る`, async ({ page }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const open1 = (await partRect(page, PART.popup))!;
      await tapPart(page, '.naga-fold');
      await frame(page);
      const folded = (await partRect(page, PART.popup))!;
      expect(folded.height, '[measure:M-4] 畳んだ高さ').toBeLessThanOrEqual(FOLDED + TOL);
      expect(folded.top - vp.offsetTop, '[measure:M-4] 畳むと帯が広がる').toBeGreaterThan(open1.top - vp.offsetTop);
      await tapPart(page, '.naga-fold');
      await frame(page);
      const open2 = (await partRect(page, PART.popup))!;
      expect(Math.abs(open2.height - open1.height), '[measure:M-4] 開くと高さが戻る').toBeLessThanOrEqual(TOL);
      expect(Math.abs(open2.top - open1.top), '[measure:M-4] 開くと帯が戻る').toBeLessThanOrEqual(TOL);
    });
  });
}

test.describe('375×320 デバッグ表示', () => {
  test.use({ viewport: { width: 375, height: 320 } });

  test('M-5: デバッグ表示は流れの中にあり、popup・起動ボタン・欄の中心を覆わない', async ({ page }) => {
    await page.goto('/naga.html?debugViewport=1');
    await page.waitForSelector('#naga-debug-viewport', { state: 'attached' });
    const style = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('naga-debug-viewport')!);
      return { position: cs.position, zIndex: cs.zIndex };
    });
    expect(style.position, '[measure:M-5] position').toBe('static');
    expect(style.zIndex, '[measure:M-5] z-index').toBe('auto');

    // 欄を画面の中ほどへ出して（この試験はスクロールを測らない）開く
    await page.evaluate(() => {
      const f = document.getElementById('naga-field-1') as HTMLInputElement;
      f.scrollIntoView({ block: 'center' });
      f.focus({ preventScroll: true });
    });
    await waitShown(page, PART.trigger);
    await openByTap(page);

    const covered = await page.evaluate(() => {
      const panel = document.getElementById('naga-debug-viewport')!;
      const host = document.querySelector('naga-ime')!;
      const root = host.shadowRoot!;
      const deepAt = (x: number, y: number): Element | null => {
        let el = document.elementFromPoint(x, y);
        while (el && el.shadowRoot) {
          const inner = el.shadowRoot.elementFromPoint(x, y);
          if (!inner || inner === el) break;
          el = inner;
        }
        return el;
      };
      const center = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      const targets: Record<string, Element> = {
        popup: root.querySelector('.naga-popup')!,
        trigger: root.querySelector('.naga-trigger')!,
        field: document.getElementById('naga-field-1')!,
      };
      const out: Record<string, boolean> = {};
      for (const [name, el] of Object.entries(targets)) {
        const c = center(el);
        const hit = deepAt(c.x, c.y);
        out[name] = Boolean(hit && (hit === panel || panel.contains(hit)));
      }
      return out;
    });
    expect(covered, '[measure:M-5] 中心点がデバッグ表示に当たらない').toEqual({ popup: false, trigger: false, field: false });
  });
});
