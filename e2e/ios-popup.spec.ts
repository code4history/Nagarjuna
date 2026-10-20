import { expect, test, type Page } from '@playwright/test';
import { fieldRect, gotoFixture, isShown, nagaIsOpen, partInfo, PART, waitShown, type Rect } from './helpers';

// 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup の置き場所の回帰試験（iOS のキーボードとスクロール）。
//
// 実機の iPhone は測れない。ここで測るのは **WebKit に iPhone を模した端末（devices['iPhone 15']・393×852）**。
// project webkit-iphone でだけ走る（playwright.config.ts）。幅 393 < dockBreakpoint 560 ∴ dock 側を測る。
//
// 0431 まで狭幅の popup は position: fixed で画面の下に据え付け、visualViewport の offset から bottom を
// 計算し、ページのスクロールのたびに置き直していた。実機の iPhone ではキーボード表示中に fixed が
// visual viewport とずれ、popup が欄と無関係に動いて「ふわふわ」していた。0432 で梵ボタンと同じく
// 文書の座標（position: absolute）で欄のすぐ下に置き、ページのスクロールでは置き直さない。
// 【NOV26-IM-NAGA-POPUP-CARET-0434】0432 の「欄のすぐ下」は複数行の欄（textarea）でキャレットの行から
// 遠すぎ、高さの上限も欄の高さに縮んで候補の行がキーボードの下に欠けた ∴ 狭幅もキャレットの行のすぐ下に
// 置き、上限は「popup の上端から可視域の下端（キーボードの上）まで」で決める。
// ∴ ここでは X-1〜X-3 で「popup の上端とキャレットの行・欄との差が、どのスクロール位置・どの visual
// viewport のパンでも一定であること」を測り、X-5 で複数行の欄のキャレットと、縮んだ可視域の中の候補 1 行目を測る。
// WebKit を Playwright で動かすかぎり本当のソフトキーボードは出ない ∴ visualViewport のパンは
// 読み取り値を差し替えて模す（getter を上書きする。実物の VisualViewport のままなのでイベントは
// 本物の購読経路で届く）。

/** f-mobile の #m1 の組版（CSS で宣言している値。実装とは別に出どころを書いておく）。 */
const M1 = { border: 1, paddingTop: 4, lineHeight: 22 } as const;
/** f-mobile の #m2 の組版（textarea・8 行）。 */
const M2 = { border: 1, paddingTop: 2, lineHeight: 20 } as const;
/** キャレットの行の下端と popup の上端の間隔（0434 の POPUP_CARET_GAP_PX）。 */
const CARET_GAP = 2;

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

/** #m1 のキャレットの行（1 行）の下端（layout viewport）。f-mobile の CSS から数える。 */
function m1CaretBottom(field: Rect): number {
  return field.top + M1.border + M1.paddingTop + M1.lineHeight;
}

/** popup の上端 − 欄の上端（この差が一定であることが「欄に付いている」の意味。0434 も同じ）。 */
async function offsetFromFieldTop(page: Page, id = 'm1'): Promise<number> {
  const field = await fieldRect(page, id);
  const pop = await popupRect(page);
  return pop.top - field.top;
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-mobile');
  await focusM1(page);
  await openByTrigger(page);
  expect(await nagaIsOpen(page), '前提: popup が開いた').toBe(true);
});

test('X-1: popup は position: absolute でキャレットの行のすぐ下に付き、ページをスクロールしても差が変わらない', async ({
  page,
}) => {
  const style = await popupStyle(page);
  expect(style.position, '[measure:X-1] position は absolute（fixed ではない）').toBe('absolute');

  const field = await fieldRect(page, 'm1');
  const pop = await popupRect(page);
  const caretBottom = m1CaretBottom(field);
  expect(Math.abs(pop.top - (caretBottom + CARET_GAP)), '[measure:X-1] popup はキャレットの行のすぐ下（±2px）').toBeLessThanOrEqual(2);
  expect(pop.top, '[measure:X-1] popup は欄の下端より上（キャレットの行の下）').toBeLessThan(field.bottom);

  const offsets: number[] = [];
  for (const y of [0, 40, 80, 120, 160]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY), `前提: ${y} までスクロールした`).toBe(y);
    offsets.push(await offsetFromFieldTop(page));
  }
  expect(Math.max(...offsets) - Math.min(...offsets), '[measure:X-1] 欄との差が一定（±1px）').toBeLessThanOrEqual(1);
  // popup の上端はキャレットの行の下端 ＋ 2（#m1 は 1 行）
  const expectedOffset = caretBottom - field.top + CARET_GAP;
  expect(offsets[0], `[measure:X-1] popup の上端は欄の上端から ${expectedOffset}px`).toBeGreaterThanOrEqual(expectedOffset - 1);
  expect(offsets[0], `[measure:X-1] popup の上端は欄の上端から ${expectedOffset}px`).toBeLessThanOrEqual(expectedOffset + 1);

  // スクロールしても popup の inline style（文書の座標）は書き換えない
  const after = await popupStyle(page);
  expect(after.top, '[measure:X-1] ページのスクロールでは置き直さない').toBe(style.top);
  expect(after.left, '[measure:X-1] ページのスクロールでは置き直さない').toBe(style.left);
});

test('X-2: visualViewport がパンしても（キーボード）、popup の欄との差は一定のまま', async ({ page }) => {
  const styleBefore = await popupStyle(page);
  const offsetBefore = await offsetFromFieldTop(page);

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
  expect(Math.abs((await offsetFromFieldTop(page)) - offsetBefore), '[measure:X-2] パンのあとも欄との差は一定').toBeLessThanOrEqual(1);

  // パンのあとにページをスクロールしても、欄との差は一定のまま
  await page.evaluate(() => window.scrollTo(0, 60));
  await settle(page);
  expect(Math.abs((await offsetFromFieldTop(page)) - offsetBefore), '[measure:X-2] パン＋スクロールでも差は一定').toBeLessThanOrEqual(1);
});

test('X-3: スクロールコンテナ（overflow: auto）をスクロールすると、popup が欄に付いてくる', async ({ page }) => {
  // #m1 は #scroller の中にある。要素のスクロールで欄が箱の中を動く ∴ popup は置き直す
  const offsets: number[] = [];
  for (const y of [0, 15, 30]) {
    await page.evaluate((top) => {
      document.getElementById('scroller')!.scrollTop = top;
    }, y);
    await settle(page);
    offsets.push(await offsetFromFieldTop(page));
  }
  expect(Math.max(...offsets) - Math.min(...offsets), '[measure:X-3] 欄との差が一定（±1px）').toBeLessThanOrEqual(1);
  const field = await fieldRect(page, 'm1');
  expect(offsets[0], '[measure:X-3] popup の上端はキャレットの行のすぐ下').toBeGreaterThanOrEqual(
    m1CaretBottom(field) - field.top - 1,
  );
  expect(offsets[0], '[measure:X-3] popup の上端はキャレットの行のすぐ下').toBeLessThanOrEqual(
    m1CaretBottom(field) - field.top + CARET_GAP + 1,
  );
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

/**
 * 【NOV26-IM-NAGA-POPUP-CARET-0434】複数行の欄（#m2 textarea）の 3 行目にキャレットを置いて開く。
 * - popup の上端がキャレットの行の下端の近く（±4px）で、欄の下端より上
 * - 候補の 1 行目が可視域（模擬した visualViewport の下端）の中
 */
test('X-5: textarea の 3 行目では、キャレットの行のすぐ下に開き、縮んだ可視域にも候補 1 行目が見える', async ({ page }) => {
  /** #m2 の 3 行目の末尾にキャレットを置く（行内のスクロール位置は 11px に固定して 3 行目を可視に保つ）。 */
  const placeCaretOnLine3 = async (): Promise<void> => {
    await page.evaluate(() => {
      const m2 = document.getElementById('m2') as HTMLTextAreaElement;
      m2.scrollTop = 11;
      m2.focus({ preventScroll: true });
      const at = m2.value.split('\n').slice(0, 3).join('\n').length; // 3 行目の末尾
      m2.setSelectionRange(at, at);
    });
    await waitShown(page, PART.trigger);
    await settle(page);
  };

  /** 開いたあとの「キャレットの行の下端・欄の下端・popup・候補 1 行目・可視域の下端」を測る。 */
  const measure = async () => {
    const m2 = await page.evaluate(() => {
      const el = document.getElementById('m2') as HTMLTextAreaElement;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, scrollTop: el.scrollTop };
    });
    const caretBottom = m2.top + M2.border + M2.paddingTop + 3 * M2.lineHeight - m2.scrollTop;
    const pop = await popupRect(page);
    const first = await partInfo(page, '.naga-item');
    if (!first) throw new Error('候補（.naga-item）が無い');
    const visibleBottom = await page.evaluate(() => {
      const vv = window.visualViewport;
      return vv ? vv.offsetTop + vv.height : window.innerHeight;
    });
    return { m2, caretBottom, pop, first: first.rect, visibleBottom };
  };

  // 前提の #m1 の popup を閉じ、#m2 の 3 行目へキャレットを移す
  await page.evaluate(() => (window as unknown as { __naga: { close: () => void } }).__naga.close());
  await settle(page);
  await placeCaretOnLine3();

  // (1) キーボードが出ていない状態（可視域 852）: キャレットの行のすぐ下・候補は当然見える
  await openByTrigger(page);
  const open1 = await measure();
  expect(Math.abs(open1.pop.top - open1.caretBottom), '[measure:X-5] popup の上端はキャレットの行の下端の近く（±4px）').toBeLessThanOrEqual(4);
  expect(open1.pop.top, '[measure:X-5] popup は欄の下端より上').toBeLessThan(open1.m2.bottom);
  expect(open1.first.top, '[measure:X-5] 候補 1 行目の上端が可視域の中').toBeGreaterThanOrEqual(0);
  expect(open1.first.bottom, '[measure:X-5] 候補 1 行目の下端が可視域の中').toBeLessThanOrEqual(open1.visibleBottom + 1);

  // (2) キーボードで可視域が縮んだ状態（下端 320）で開き直す: 上限が縮んでも候補 1 行目は見える
  await page.evaluate(() => (window as unknown as { __naga: { close: () => void } }).__naga.close());
  await settle(page);
  await mockVisualViewport(page, { offsetTop: 0, offsetLeft: 0, height: 320 });
  await placeCaretOnLine3();
  await openByTrigger(page);
  const open2 = await measure();
  expect(Math.abs(open2.pop.top - open2.caretBottom), '[measure:X-5] 縮んだ可視域でも popup はキャレットの行の下端の近く').toBeLessThanOrEqual(4);
  expect(open2.pop.top, '[measure:X-5] 縮んだ可視域でも popup は欄の下端より上').toBeLessThan(open2.m2.bottom);
  expect(open2.first.top, '[measure:X-5] 縮んだ可視域でも候補 1 行目の上端が見える').toBeGreaterThanOrEqual(0);
  expect(open2.first.bottom, '[measure:X-5] 縮んだ可視域でも候補 1 行目の下端が見える').toBeLessThanOrEqual(open2.visibleBottom + 1);

  // 可視域に入れるためにページを寄せたなら 1 回だけ（スクロールで置き直さない方針は変えない）
  const scrolled = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('resize')));
  await settle(page);
  expect(await page.evaluate(() => window.scrollY), '[measure:X-5] 2 回目以降は寄せない').toBe(scrolled);
});

/**
 * 【NOV26-IM-NAGA-CARET-MARK-0437】挿入位置の縦棒（.naga-caret-mark）の回帰試験。
 *
 * 写し（.naga-copy。欄の直前 12 文字を ↵ で詰めた行）は意図が分かりにくく場所を取る ∴ 0437 で撤去した
 * （人間の提案「IME の表示中はキャレットを目立つように変える」）。popup を開くと focus が読み欄へ移り、
 * 元の欄のキャレットが見えなくなる ∴ 元の欄の挿入位置に縦棒を出す。
 * - textarea（#m2）の 2 行目にキャレットを置いて開くと、縦棒がその行に重なる
 * - 確定で縦棒が右へ進む
 * - Escape で消える
 * - ページをスクロールしても欄との相対位置が一定（文書の座標）
 */
test('X-6: textarea の 2 行目に縦棒が出て、確定で右へ進み、Escape で消える', async ({ page }) => {
  /** #m2 の 2 行目の末尾にキャレットを置く（scrollTop は 0 ∴ 2 行目は可視）。 */
  const placeCaretOnLine2 = async (): Promise<void> => {
    await page.evaluate(() => {
      const m2 = document.getElementById('m2') as HTMLTextAreaElement;
      m2.value = 'いち\nに\nさん\nよん';
      m2.scrollTop = 0;
      m2.focus({ preventScroll: true });
      const at = m2.value.split('\n').slice(0, 2).join('\n').length; // 2 行目の末尾
      m2.setSelectionRange(at, at);
    });
    await waitShown(page, PART.trigger);
    await settle(page);
  };

  /** #m2 の 2 行目の上端・下端（layout viewport。M2 の組版から数える）。 */
  const line2 = async (): Promise<{ top: number; bottom: number; field: Rect }> => {
    const field = await fieldRect(page, 'm2');
    const scrollTop = await page.evaluate(() => (document.getElementById('m2') as HTMLTextAreaElement).scrollTop);
    const top = field.top + M2.border + M2.paddingTop + M2.lineHeight - scrollTop;
    return { top, bottom: top + M2.lineHeight, field };
  };

  /** 縦棒の矩形（見えていなければ null）。 */
  const caretMark = async (): Promise<Rect | null> => {
    const info = await partInfo(page, '.naga-caret-mark');
    return info && info.shown ? info.rect : null;
  };

  // 前提の #m1 の popup を閉じ、#m2 の 2 行目へキャレットを移してから開き直す
  await page.evaluate(() => (window as unknown as { __naga: { close: () => void } }).__naga.close());
  await settle(page);
  await placeCaretOnLine2();
  await openByTrigger(page);

  // 縦棒は 2 行目に重なる（measureCaret の y は行の箱の内側なので ±4px を許す）
  const first = await line2();
  const mark1 = await caretMark();
  expect(mark1, '[measure:X-6] 縦棒が見えている').not.toBeNull();
  expect(mark1!.top, '[measure:X-6] 縦棒の上端は 2 行目の上端').toBeGreaterThanOrEqual(first.top - 4);
  expect(mark1!.bottom, '[measure:X-6] 縦棒の下端は 2 行目の下端').toBeLessThanOrEqual(first.bottom + 4);
  expect(Math.abs(mark1!.height - M2.lineHeight), '[measure:X-6] 高さは行の高さ').toBeLessThanOrEqual(1);
  expect(Math.abs(mark1!.width - 2), '[measure:X-6] 幅は 2px').toBeLessThanOrEqual(0.5);
  expect(mark1!.left, '[measure:X-6] 横は欄の中').toBeGreaterThan(first.field.left);
  expect(mark1!.left, '[measure:X-6] 横は欄の中').toBeLessThan(first.field.right);

  // ページをスクロールしても、欄との相対位置は一定（文書の座標で置く）
  const offsets: Array<{ top: number; left: number }> = [];
  for (const y of [0, 40, 80]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY), `前提: ${y} までスクロールした`).toBe(y);
    const mark = await caretMark();
    const field = await fieldRect(page, 'm2');
    if (!mark) throw new Error('スクロール後に縦棒が消えた');
    offsets.push({ top: mark.top - field.top, left: mark.left - field.left });
  }
  expect(Math.max(...offsets.map((o) => o.top)) - Math.min(...offsets.map((o) => o.top)), '[measure:X-6] 縦の差が一定').toBeLessThanOrEqual(1);
  expect(Math.max(...offsets.map((o) => o.left)) - Math.min(...offsets.map((o) => o.left)), '[measure:X-6] 横の差が一定').toBeLessThanOrEqual(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);

  // 確定するとキャレットが 1 文字ぶん進み、縦棒も右へ進む
  const beforeCommit = (await caretMark())!;
  await page.keyboard.press('1');
  await settle(page);
  const afterCommit = await caretMark();
  expect(afterCommit, '[measure:X-6] 確定後も縦棒は出たまま（連続入力）').not.toBeNull();
  expect(afterCommit!.left, '[measure:X-6] 縦棒は右へ進む').toBeGreaterThan(beforeCommit.left + 1);
  expect(Math.abs(afterCommit!.height - M2.lineHeight), '[measure:X-6] 高さは変わらない').toBeLessThanOrEqual(1);

  // Escape で閉じると消える
  await page.keyboard.press('Escape');
  await expect.poll(() => nagaIsOpen(page), { message: '[measure:X-6] Escape で閉じる' }).toBe(false);
  expect(await isShown(page, '.naga-caret-mark'), '[measure:X-6] Escape で縦棒も消える').toBe(false);
});

test('X-7: 元の欄をタップすると popup が閉じ、梵ボタンで開き直せる。確定 2 回では閉じない', async ({ page }) => {
  // 確定を 2 回続けても開いたまま（連続入力。NagaIME 自身の focus 戻しでは閉じない）
  await page.keyboard.press('1');
  await page.keyboard.press('2');
  expect(await nagaIsOpen(page), '[measure:X-7] 確定 2 回では閉じない（連続入力）').toBe(true);
  expect(await isShown(page, PART.popup), '[measure:X-7] popup は見えたまま').toBe(true);

  // 元の欄（#m1）をタップする（キャレットの行より上・popup に覆われない点）
  const field = await fieldRect(page, 'm1');
  await page.touchscreen.tap(field.left + 20, field.top + 8);
  await expect.poll(() => nagaIsOpen(page), { message: '[measure:X-7] 元の欄のタップで閉じる' }).toBe(false);
  expect(await isShown(page, PART.popup), '[measure:X-7] popup は閉じた').toBe(false);

  // 梵ボタンは欄の右上に残る
  expect(await isShown(page, PART.trigger), '[measure:X-7] 梵ボタンは残る').toBe(true);
  const trig = (await partInfo(page, PART.trigger))!;
  expect(Math.abs(trig.rect.right - field.right), '[measure:X-7] 梵ボタンは欄の右上').toBeLessThanOrEqual(1);

  // 梵ボタンで開き直せる
  await openByTrigger(page);
  expect(await nagaIsOpen(page), '[measure:X-7] 梵ボタンで開き直せる').toBe(true);
  expect(await isShown(page, PART.popup), '[measure:X-7] 開き直した popup が見える').toBe(true);
  // 直前の 2 文字が欄に入っている（陽性対照: 閉じたのは開き直しの後ではなく前のタップ）
  const value = await page.evaluate(() => (document.getElementById('m1') as HTMLInputElement).value);
  expect(Array.from(value).length, '[measure:X-7] 確定した 2 文字が欄に入っている').toBeGreaterThanOrEqual(2);
});
