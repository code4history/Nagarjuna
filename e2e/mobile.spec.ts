import { expect, test, type Page } from '@playwright/test';
import { PART, gotoFixture, nagaIsOpen, waitShown } from './helpers';

// nov26-m3-t3 §3.7: スマートフォンの見え方（マイルストーン設計 §6.2 の M-1〜M-5）。
// project chromium-mobile（Pixel 5・isMobile・hasTouch）で走る。chromium はソフトキーボードを再現しない ∴
// 「使える高さ」は viewport の高さで与える（設計 R-1）。各 expect に測りの印 [measure:M-n] を付ける。
//
// 操作はすべて page.touchscreen.tap(x, y) で行う（ElementHandle.tap は押す前に要素を画面へスクロールしうる。
// それでは M-1 の「NagaIME がスクロールしない」を測れない）。
//
// 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup は画面の下に据え付ける fixed をやめ、欄のすぐ下に付ける
// 文書の座標（position: absolute）になった ∴ M-2〜M-4 の「帯（popup の上に残る高さ）」「下端は可視域の
// 下端から 8px」という前提は意味を失った。置き場所の回帰は e2e/ios-popup.spec.ts の X-1〜X-4 が見る。
// ここ（M-*）は、欄のすぐ下に付いた popup の寸法・畳み・操作でスクロールしないことを測る。

const HEIGHTS = [188, 216, 320] as const;
/** キーボードの上に残る高さから引く余白（設計 §3.1 の DOCK_GAP_PX）。 */
const GAP = 8;
/** 候補 1 行がまるごと見える下限（設計 §3.1 の DOCK_MIN_PX）。 */
const DOCK_MIN = 138;
/** popup を欄のすぐ下に付ける間隔（0432）。 */
const POPUP_GAP = 4;
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
        await setup(page, fieldId);
        // 0432: popup は欄のすぐ下に付く ∴ 短い viewport でもタイトル行（タブ・畳む・閉じる）が
        // 可視域に入るよう、欄を可視域の上端から 40px へ寄せてから基準を取る（梵ボタンは欄の上に
        // 出るので 0 まで寄せない。寄せるのはこの試験だけで、以後の操作でスクロールしないことを測る基準）
        await page.evaluate((fid) => {
          const el = document.getElementById(fid)!;
          window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 40);
        }, fieldId);
        await frame(page);
        const before = await scrollState(page);
        const valueBefore = await page.evaluate((fid) => (document.getElementById(fid) as HTMLInputElement).value, fieldId);
        const check = async (step: string) => {
          await frame(page);
          expect(await scrollState(page), `[measure:M-1] ${fieldId} ${step}`).toEqual(before);
        };

        await openByTap(page);
        expect(await nagaIsOpen(page), `[measure:M-1] ${fieldId} 開いた`).toBe(true);
        await check('開く');

        // 0432: popup は欄のすぐ下に付く ∴ 短い viewport では候補の行が可視域の外に出る。
        // タップの代わりに、読み欄の数字キー（1-9 の直接選択）で確定する（同じ commit の経路）
        await page.keyboard.press('1');
        await check('確定 1');
        await page.keyboard.press('2');
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

    test(`M-2 [${h}]: popup は欄のすぐ下に付き、タブ・読み欄・写しの行・候補 1 行以上がその中に見える`, async ({
      page,
    }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const field = await page.evaluate(() => {
        const r = document.getElementById('m1')!.getBoundingClientRect();
        return { bottom: r.bottom, height: r.height };
      });
      const pop = (await partRect(page, PART.popup))!;
      expect(Math.abs(pop.top - field.bottom - POPUP_GAP), '[measure:M-2] popup は欄のすぐ下').toBeLessThanOrEqual(TOL);
      expect(pop.left, '[measure:M-2] popup の左端は可視域の左端').toBeGreaterThanOrEqual(-TOL);
      expect(pop.right, '[measure:M-2] popup の右端は可視域の右端').toBeLessThanOrEqual(vp.innerWidth + TOL);
      for (const sel of ['.naga-tab.naga-is-active', '.naga-search', '.naga-copy']) {
        const r = await partRect(page, sel);
        expect(r, `[measure:M-2] ${sel} がある`).not.toBeNull();
        expect(r!.height, `[measure:M-2] ${sel} の高さ`).toBeGreaterThan(0);
        // popup の内側に収まっている（欄のすぐ下に付いた板の中身）
        expect(r!.left, `[measure:M-2] ${sel} left は popup の内側`).toBeGreaterThanOrEqual(pop.left - TOL);
        expect(r!.right, `[measure:M-2] ${sel} right は popup の内側`).toBeLessThanOrEqual(pop.right + TOL);
        expect(r!.top, `[measure:M-2] ${sel} top は popup の内側`).toBeGreaterThanOrEqual(pop.top - TOL);
        // 横は可視域の中（縦は欄の位置しだい。0432）
        expect(r!.left, `[measure:M-2] ${sel} left`).toBeGreaterThanOrEqual(-TOL);
        expect(r!.right, `[measure:M-2] ${sel} right`).toBeLessThanOrEqual(vp.innerWidth + TOL);
        expect(r!.bottom, `[measure:M-2] ${sel} の下端は popup の下端の内側`).toBeLessThanOrEqual(pop.bottom + TOL);
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

    test(`M-3 [${h}]: popup は position: absolute で欄のすぐ下に付き、高さは残り可視高 − 欄 − 余白を超えない`, async ({
      page,
    }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const field = await page.evaluate(() => {
        const r = document.getElementById('m1')!.getBoundingClientRect();
        return { bottom: r.bottom, height: r.height };
      });
      const position = await page.evaluate(() => {
        const el = document.querySelector('naga-ime')!.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
        return el.style.position;
      });
      expect(position, '[measure:M-3] fixed ではなく absolute（文書の座標）').toBe('absolute');
      const pop = (await partRect(page, PART.popup))!;
      // 欄のすぐ下に付く（画面の下に据え付けない）
      expect(pop.top - field.bottom, '[measure:M-3] 欄のすぐ下（間隔 4px）').toBeGreaterThanOrEqual(POPUP_GAP - TOL);
      expect(pop.top - field.bottom, '[measure:M-3] 欄のすぐ下（間隔 4px）').toBeLessThanOrEqual(POPUP_GAP + TOL);
      // 高さの上限 = キーボードの上に残る高さ − 余白 − 欄の高さ（DOCK_MIN を下回らない）
      const avail = vp.height - GAP - field.height;
      const cap = Math.max(Math.min(DOCK_MIN, avail), Math.min(226, avail));
      expect(pop.height, '[measure:M-3] 高さは残り可視高 − 欄 − 余白を超えない').toBeLessThanOrEqual(cap + TOL);
    });

    test(`M-4 [${h}]: 畳むと高さがタイトル行と写しの行だけになり、上端は欄のすぐ下のまま。開くと戻る`, async ({ page }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const open1 = (await partRect(page, PART.popup))!;
      await tapPart(page, '.naga-fold');
      await frame(page);
      const folded = (await partRect(page, PART.popup))!;
      expect(folded.height, '[measure:M-4] 畳んだ高さ').toBeLessThanOrEqual(FOLDED + TOL);
      expect(folded.height, '[measure:M-4] 畳むと縮む（陽性対照）').toBeLessThan(open1.height);
      // 0432: popup は欄に付いている ∴ 畳んでも上端は動かない（帯を広げるのではなく高さが縮む）
      expect(Math.abs(folded.top - open1.top), '[measure:M-4] 畳んでも上端は欄のすぐ下のまま').toBeLessThanOrEqual(TOL);
      await tapPart(page, '.naga-fold');
      await frame(page);
      const open2 = (await partRect(page, PART.popup))!;
      expect(Math.abs(open2.height - open1.height), '[measure:M-4] 開くと高さが戻る').toBeLessThanOrEqual(TOL);
      expect(Math.abs(open2.top - open1.top), '[measure:M-4] 開いても上端は欄のすぐ下のまま').toBeLessThanOrEqual(TOL);
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
