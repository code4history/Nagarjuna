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
// 下端から 8px」という前提は意味を失った。置き場所の回帰は e2e/ios-popup.spec.ts の X-1〜X-5 が見る。
// 【NOV26-IM-NAGA-POPUP-CARET-0434】0432 の「欄のすぐ下」は複数行の欄でキャレットの行から遠すぎ、
// 高さの上限も欄の高さに縮んだ ∴ 狭幅もキャレットの行のすぐ下に置き、上限は「popup の上端から可視域の
// 下端まで」で決める。可視域に DOCK_MIN（116px）が残らないときだけ、開いた直後に 1 回だけページを寄せる。
// 【NOV26-IM-NAGA-POPUP-REFOCUS-0436】文脈の表示（写しの行 22px）は狭幅では出さない ∴ 固定部分は 72px
// （候補 3 行上限 204・候補 1 行下限 116・畳み 36）。
// 【NOV26-IM-NAGA-CARET-MARK-0437】写しは広幅・狭幅とも撤去した。M-2 は「写しの要素が無く、
// 代わりに挿入位置の縦棒（.naga-caret-mark）が出ること」を測る。
// ここ（M-*）は、キャレットの行のすぐ下に付いた popup の寸法・畳み・操作でスクロールしないことを測る。

const HEIGHTS = [188, 216, 320] as const;
/** 候補 1 行がまるごと見える下限（設計 §3.1 の DOCK_MIN_PX。0436 で写しの行を外して 116）。 */
const DOCK_MIN = 116;
/** popup の高さの上限（DOCK_POPUP_MAX_PX。0436 で 204）。 */
const DOCK_MAX = 204;
/** f-mobile の #m1 の組版（CSS で宣言している値。実装とは別に出どころを書いておく）。 */
const M1 = { border: 1, paddingTop: 4, lineHeight: 22 } as const;
/** キャレットの行の下端と popup の上端の間隔（0434 の POPUP_CARET_GAP_PX）。 */
const CARET_GAP = 2;
/** 畳んだ高さ（タイトル行＋枠。0436 で写しの行を外して 36）。 */
const FOLDED = 36;
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

    test(`M-1 [${h}]: 開いた直後の 1 回（0434 の例外）を除き、確定・タブ切替・畳む・開く・閉じるでスクロールしない`, async ({
      page,
    }) => {
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

        await openByTap(page);
        expect(await nagaIsOpen(page), `[measure:M-1] ${fieldId} 開いた`).toBe(true);
        // 0434 の例外: 可視域に候補 1 行が残らない高さでは、開いた直後にページを下へ寄せる（1 回だけ）。
        // 欄（要素）のスクロールは動かさない
        const afterOpen = await scrollState(page);
        expect(afterOpen.winX, `[measure:M-1] ${fieldId} 開くときに横は動かさない`).toBe(before.winX);
        expect(afterOpen.winY, `[measure:M-1] ${fieldId} 開くときに上へは戻さない（下へだけ寄せる）`).toBeGreaterThanOrEqual(before.winY);
        expect(afterOpen.scrollerTop).toBe(before.scrollerTop);
        expect(afterOpen.m1Top).toBe(before.m1Top);
        expect(afterOpen.m2Top).toBe(before.m2Top);
        const baseline = afterOpen;
        const check = async (step: string) => {
          await frame(page);
          expect(await scrollState(page), `[measure:M-1] ${fieldId} ${step}`).toEqual(baseline);
        };

        await check('開いた直後の 1 回を除く');

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

    test(`M-2 [${h}]: popup はキャレットの行のすぐ下に付き、タブ・読み欄・候補 1 行以上がその中に見え、文脈の表示は出ない`, async ({
      page,
    }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const field = await page.evaluate(() => {
        const r = document.getElementById('m1')!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });
      const pop = (await partRect(page, PART.popup))!;
      // 0434: 狭幅もキャレットの行（#m1 は 1 行）のすぐ下に付く
      const caretBottom = field.top + M1.border + M1.paddingTop + M1.lineHeight;
      // キャレットの行の下端は組版の半分の行間ぶん（±2px）ずれる ∴ 間隔 2px の前後 2px を許す
      expect(Math.abs(pop.top - caretBottom - CARET_GAP), '[measure:M-2] popup はキャレットの行のすぐ下').toBeLessThanOrEqual(2);
      expect(pop.top, '[measure:M-2] popup は欄の下端より上').toBeLessThan(field.bottom);
      expect(pop.left, '[measure:M-2] popup の左端は可視域の左端').toBeGreaterThanOrEqual(-TOL);
      expect(pop.right, '[measure:M-2] popup の右端は可視域の右端').toBeLessThanOrEqual(vp.innerWidth + TOL);
      // 【0437】写し（.naga-copy）は撤去した ∴ 要素は無い。代わりに挿入位置の縦棒が出る
      const copy = await partRect(page, '.naga-copy');
      expect(copy, '[measure:M-2] 写しの要素は無い').toBeNull();
      const mark = await partRect(page, '.naga-caret-mark');
      expect(mark, '[measure:M-2] 挿入位置の縦棒がある').not.toBeNull();
      expect(mark!.height, '[measure:M-2] 縦棒の高さは行の高さ').toBeGreaterThan(0);
      for (const sel of ['.naga-tab.naga-is-active', '.naga-search']) {
        const r = await partRect(page, sel);
        expect(r, `[measure:M-2] ${sel} がある`).not.toBeNull();
        expect(r!.height, `[measure:M-2] ${sel} の高さ`).toBeGreaterThan(0);
        // popup の内側に収まっている（欄のすぐ下に付いた板の中身）
        expect(r!.left, `[measure:M-2] ${sel} left は popup の内側`).toBeGreaterThanOrEqual(pop.left - TOL);
        expect(r!.right, `[measure:M-2] ${sel} right は popup の内側`).toBeLessThanOrEqual(pop.right + TOL);
        expect(r!.top, `[measure:M-2] ${sel} top は popup の内側`).toBeGreaterThanOrEqual(pop.top - TOL);
        // 横は可視域の中（縦はキャレットの位置しだい。0434）
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

    test(`M-3 [${h}]: popup は position: absolute でキャレットの行のすぐ下に付き、可視域の下端（キーボードの上）を超えない`, async ({
      page,
    }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const vp = await visualViewport(page);
      const field = await page.evaluate(() => {
        const r = document.getElementById('m1')!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });
      const position = await page.evaluate(() => {
        const el = document.querySelector('naga-ime')!.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
        return el.style.position;
      });
      expect(position, '[measure:M-3] fixed ではなく absolute（文書の座標）').toBe('absolute');
      const pop = (await partRect(page, PART.popup))!;
      // キャレットの行のすぐ下に付く（画面の下に据え付けない）
      const caretBottom = field.top + M1.border + M1.paddingTop + M1.lineHeight;
      // キャレットの行の下端は組版の半分の行間ぶん（±2px）ずれる ∴ 間隔 2px の前後 2px を許す
      expect(pop.top - caretBottom, '[measure:M-3] キャレットの行のすぐ下（間隔 2px）').toBeGreaterThanOrEqual(CARET_GAP - 2);
      expect(pop.top - caretBottom, '[measure:M-3] キャレットの行のすぐ下（間隔 2px）').toBeLessThanOrEqual(CARET_GAP + 2);
      // 高さの上限 = 可視域の下端（キーボードの上）− popup の上端 − 余白（欄の高さは引かない。0434）
      expect(pop.height, '[measure:M-3] 高さは可視域の下端 − popup の上端 − 余白を超えない').toBeLessThanOrEqual(DOCK_MAX + TOL);
      // 開いた直後に寄せたあとの可視域の中に収まっている（DOCK_MIN を残せない高さでは寄せる）
      expect(pop.bottom, '[measure:M-3] popup の下端は可視域の下端を超えない').toBeLessThanOrEqual(vp.offsetTop + vp.height + TOL);
      expect(pop.height, '[measure:M-3] 候補 1 行以上（DOCK_MIN）').toBeGreaterThanOrEqual(DOCK_MIN - TOL);
    });

    test(`M-4 [${h}]: 畳むと高さがタイトル行だけになり、上端はキャレットの行のすぐ下のまま。開くと戻る`, async ({
      page,
    }) => {
      await setup(page, 'm1');
      await openByTap(page);
      const open1 = (await partRect(page, PART.popup))!;
      await tapPart(page, '.naga-fold');
      await frame(page);
      const folded = (await partRect(page, PART.popup))!;
      expect(folded.height, '[measure:M-4] 畳んだ高さ').toBeLessThanOrEqual(FOLDED + TOL);
      expect(folded.height, '[measure:M-4] 畳むと縮む（陽性対照）').toBeLessThan(open1.height);
      // 0434: popup はキャレットの行に付いている ∴ 畳んでも上端は動かない（帯を広げるのではなく高さが縮む）
      expect(Math.abs(folded.top - open1.top), '[measure:M-4] 畳んでも上端はキャレットの行のすぐ下のまま').toBeLessThanOrEqual(TOL);
      await tapPart(page, '.naga-fold');
      await frame(page);
      const open2 = (await partRect(page, PART.popup))!;
      expect(Math.abs(open2.height - open1.height), '[measure:M-4] 開くと高さが戻る').toBeLessThanOrEqual(TOL);
      expect(Math.abs(open2.top - open1.top), '[measure:M-4] 開いても上端はキャレットの行のすぐ下のまま').toBeLessThanOrEqual(TOL);
    });
  });
}

test.describe('375×320 デバッグ表示', () => {
  test.use({ viewport: { width: 375, height: 320 } });

  test('M-5: デバッグ表示は流れの中にあり、popup・起動ボタン・欄の中心を覆わない', async ({ page }) => {
    // nov26-m3-t4: NagaIME のデモはトップ（/）へ移った。転送（naga.html）に頼らず直接開く
    await page.goto('/?debugViewport=1');
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
