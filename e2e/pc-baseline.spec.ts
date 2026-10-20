import { expect, test, type Page } from '@playwright/test';
import { PART, deepActiveId, deepHandle, fieldRect, fillAndFocus, gotoFixture, isShown, nagaIsOpen, partInfo, waitShown } from './helpers';

// nov26-m3-t1 §3.5: PC の振る舞いの基準（F-CLEAN・1280×800）。origin/master の実装で緑。
// 失敗を期待する印（test の fail 指定）を付けない。t2・t3・t4 はこの spec を緑のまま保つ（マイルストーン設計 M-6）。

async function openWithShortcut(page: Page): Promise<void> {
  await page.keyboard.press('Control+j');
  await waitShown(page, PART.item);
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page, 'f-clean');
});

test('P-1: #f1 の focus で trigger が #f1 の右上に出る', async ({ page }) => {
  await page.focus('#f1');
  await waitShown(page, PART.trigger);
  const f1 = await fieldRect(page, 'f1');
  const trig = (await partInfo(page, PART.trigger))!;
  expect(trig.rect.bottom).toBeLessThanOrEqual(f1.top);
  expect(Math.abs(trig.rect.right - f1.right)).toBeLessThanOrEqual(1);
});

test('P-2: trigger の click で popup が #f1 の下に dock せずに出て、キャレットへ横に追従する', async ({ page }) => {
  await page.focus('#f1');
  await waitShown(page, PART.trigger);
  const trig = (await deepHandle(page, PART.trigger))!;
  await trig.click();
  await waitShown(page, PART.item);
  const f1 = await fieldRect(page, 'f1');
  const pop = (await partInfo(page, PART.popup))!;
  expect(pop.shown).toBe(true);
  const docked = await (await deepHandle(page, PART.popup))!.evaluate((el) => el.classList.contains('naga-is-docked'));
  expect(docked).toBe(false);
  expect(pop.rect.top).toBeGreaterThanOrEqual(f1.top + 16);
  expect(pop.rect.left).toBeGreaterThanOrEqual(f1.left - 1);
  expect(pop.rect.left).toBeLessThanOrEqual(f1.right);

  // T1-MIN-2: キャレットへの横の追従。あいう＋末尾キャレットで開くと、左端が padding＋全角 2 文字分より右
  await page.keyboard.press('Escape');
  await expect.poll(() => nagaIsOpen(page)).toBe(false);
  await fillAndFocus(page, 'f1', 'あいう');
  await openWithShortcut(page);
  const pop2 = (await partInfo(page, PART.popup))!;
  expect(pop2.rect.left).toBeGreaterThanOrEqual(f1.left + 8 + 32);
});

// 【NOV26-IM-NAGA-POPUP-REFOCUS-0436】0436 以前は「欄へ focus を戻して Control+j で閉じる」だった。
// いまは利用者が欄へ focus を戻した時点で popup が閉じる（実機の「戻しても連携しない」への対応）∴
// 欄へ戻すと閉じ、閉じたあとの Control+j は開く、という順序で測る（toggle 自体は trigger と単体テストが見る）。
test('P-3: Control+j で開き、欄へ focus を戻すと閉じ、もう一度 Control+j で開く（0436）', async ({ page }) => {
  await page.focus('#f1');
  await openWithShortcut(page);
  expect(await nagaIsOpen(page)).toBe(true);
  // 開くと focus は読み入力欄へ移る。欄へ戻す（キーボードの Tab に相当する focus）と閉じる
  await page.focus('#f1');
  await expect.poll(() => nagaIsOpen(page)).toBe(false);
  // 閉じたあとは欄の Control+j が開く
  await page.keyboard.press('Control+j');
  await expect.poll(() => nagaIsOpen(page)).toBe(true);
});

test('P-4: 読み → Enter を 2 回で #f1 に 2 文字入り、popup は開いたまま', async ({ page }) => {
  await page.focus('#f1');
  await openWithShortcut(page);
  // より・こと は組文字のタブにある
  const tab = (await deepHandle(page, '.naga-tab[data-category="kumimoji"]'))!;
  await tab.click();
  await page.keyboard.type('より');
  await page.keyboard.press('Enter');
  await page.keyboard.type('こと');
  await page.keyboard.press('Enter');
  const value = await page.evaluate(() => (document.getElementById('f1') as HTMLInputElement).value);
  // M3T1-MIN-1（nov26-m3-t2 で拾った）: 文字数だけでなく中身を見る（組文字の「より」「こと」）
  expect(value).toBe('ゟヿ');
  expect(await nagaIsOpen(page)).toBe(true);
  expect(await isShown(page, PART.popup)).toBe(true);
});

test('P-5: Escape で閉じ、focus が #f1 に戻る', async ({ page }) => {
  await page.focus('#f1');
  await openWithShortcut(page);
  await page.keyboard.press('Escape');
  await expect.poll(() => nagaIsOpen(page)).toBe(false);
  expect(await deepActiveId(page)).toBe('f1');
});

test('P-6: 開いた状態でスクロールしても popup の #f1 からの相対位置が変わらない', async ({ page }) => {
  await page.focus('#f1');
  await openWithShortcut(page);
  const before = (await partInfo(page, PART.popup))!.rect;
  const f1Before = await fieldRect(page, 'f1');
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
  const after = (await partInfo(page, PART.popup))!.rect;
  const f1After = await fieldRect(page, 'f1');
  expect(f1After.top).toBeLessThan(f1Before.top); // スクロールが実際に起きた（陽性対照）
  expect(Math.abs(after.top - f1After.top - (before.top - f1Before.top))).toBeLessThanOrEqual(1);
  expect(Math.abs(after.left - f1After.left - (before.left - f1Before.left))).toBeLessThanOrEqual(1);
});

test('P-7: #f1 の下に 100px しか残らない viewport で開くと popup は #f1 の上に出る', async ({ page }) => {
  // 設計 §3.5 は window.scrollTo で #f1 を viewport の下端近くへ動かすとしたが、#f1 は文書の上端近く
  // （top 120px）に固定してあり、スクロールでは下端へ動かせない（scrollY は 0 未満にならない）。
  // ∴ viewport の高さを「#f1 の下端 ＋ 100px」に縮めて同じ状況を作る（幅 1280 のまま ∴ dock しない）。
  const f1 = await fieldRect(page, 'f1');
  await page.setViewportSize({ width: 1280, height: Math.round(f1.bottom + 100) });
  const f1Now = await fieldRect(page, 'f1');
  const vh = await page.evaluate(() => window.innerHeight);
  expect(Math.abs(vh - f1Now.bottom - 100)).toBeLessThanOrEqual(1); // 下に 100px しか残らない（前提）
  await page.focus('#f1');
  await openWithShortcut(page);
  const pop = (await partInfo(page, PART.popup))!;
  const docked = await (await deepHandle(page, PART.popup))!.evaluate((el) => el.classList.contains('naga-is-docked'));
  expect(docked).toBe(false);
  // 上に出る: origin/master は「キャレットの行の上端 − 2px」に下端を置く（positionPopup の anchor 経路）。
  // キャレットの行の上端は #f1 の上端 ＋ border 1px ＋ padding 4px ∴ 下端 ≤ #f1 の上端 ＋ 5、上端 < #f1 の上端
  expect(pop.rect.bottom).toBeLessThanOrEqual(f1Now.top + 5);
  expect(pop.rect.top).toBeLessThan(f1Now.top);
});

test('P-8: PC の読み欄は popup の枠の内側から左右 8px・タイトル行の下端から 8px・一覧の上端まで 8px', async ({ page }) => {
  // nov26-m3-t3 §3.7: .naga-search-row の display: contents → flex で PC の見え方が変わらないことの陽性対照。
  // t2 の head（display: contents）で緑であることを先に確かめてから CSS を変えた。
  await page.focus('#f1');
  await openWithShortcut(page);
  const pop = (await deepHandle(page, PART.popup))!;
  const m = await pop.evaluate((el) => {
    const q = (sel: string) => {
      const r = el.querySelector(sel)!.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const cs = getComputedStyle(el);
    const p = el.getBoundingClientRect();
    return {
      innerLeft: p.left + parseFloat(cs.borderLeftWidth),
      innerRight: p.right - parseFloat(cs.borderRightWidth),
      search: q('.naga-search'),
      titlebar: q('.naga-titlebar'),
      list: q('.naga-list'),
    };
  });
  expect(Math.abs(m.search.left - m.innerLeft - 8)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(m.innerRight - m.search.right - 8)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(m.search.top - m.titlebar.bottom - 8)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(m.list.top - m.search.bottom - 8)).toBeLessThanOrEqual(0.5);
});

/**
 * 【NOV26-IM-NAGA-CARET-MARK-0437】PC でも挿入位置の縦棒（.naga-caret-mark）を出す。
 *
 * 写し（.naga-copy）は広幅・狭幅とも撤去した。popup を開くと focus が読み欄へ移り、元の欄の
 * キャレットが見えなくなる ∴ 元の欄の挿入位置に縦棒を出す（狭幅と同じ扱い）。
 * - textarea（#f2）の 2 行目にキャレットを置いて Control+j で開くと、縦棒がその行に重なる
 * - 確定で縦棒が右へ進む
 * - Escape で消える
 * - ページをスクロールしても欄との相対位置が一定
 */
test('P-9: textarea の 2 行目に縦棒が出て、確定で右へ進み、Escape で消える（0437）', async ({ page }) => {
  /** #f2 の組版（f-clean.html の CSS で宣言している値）。 */
  const F2 = { border: 1, paddingTop: 4, lineHeight: 22 } as const;

  const settle = async (): Promise<void> => {
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
  };
  const caretMark = async () => {
    const info = await partInfo(page, '.naga-caret-mark');
    return info && info.shown ? info.rect : null;
  };

  await page.evaluate(() => {
    const f2 = document.getElementById('f2') as HTMLTextAreaElement;
    f2.value = 'いち\nに';
    f2.scrollTop = 0;
    f2.focus();
    const at = f2.value.split('\n').slice(0, 2).join('\n').length; // 2 行目の末尾
    f2.setSelectionRange(at, at);
  });
  await waitShown(page, PART.trigger);
  await openWithShortcut(page);
  await settle();

  // 縦棒は 2 行目に重なる（measureCaret の y は行の箱の内側なので ±4px を許す）
  const f2 = await fieldRect(page, 'f2');
  const lineTop = f2.top + F2.border + F2.paddingTop + F2.lineHeight;
  const lineBottom = lineTop + F2.lineHeight;
  const mark1 = await caretMark();
  expect(mark1, '[measure:P-9] 縦棒が見えている').not.toBeNull();
  expect(mark1!.top, '[measure:P-9] 縦棒の上端は 2 行目の上端').toBeGreaterThanOrEqual(lineTop - 4);
  expect(mark1!.bottom, '[measure:P-9] 縦棒の下端は 2 行目の下端').toBeLessThanOrEqual(lineBottom + 4);
  expect(Math.abs(mark1!.height - F2.lineHeight), '[measure:P-9] 高さは行の高さ').toBeLessThanOrEqual(1);
  expect(Math.abs(mark1!.width - 2), '[measure:P-9] 幅は 2px').toBeLessThanOrEqual(0.5);
  expect(mark1!.left, '[measure:P-9] 横は欄の中').toBeGreaterThan(f2.left);
  expect(mark1!.left, '[measure:P-9] 横は欄の中').toBeLessThan(f2.right);

  // ページをスクロールしても欄との相対位置は一定
  const before = { top: mark1!.top - f2.top, left: mark1!.left - f2.left };
  await page.evaluate(() => window.scrollBy(0, 120));
  await settle();
  const f2After = await fieldRect(page, 'f2');
  const markAfterScroll = (await caretMark())!;
  expect(f2After.top, '前提: スクロールで欄が動いた').toBeLessThan(f2.top);
  expect(Math.abs(markAfterScroll.top - f2After.top - before.top), '[measure:P-9] 縦の差が一定').toBeLessThanOrEqual(1);
  expect(Math.abs(markAfterScroll.left - f2After.left - before.left), '[measure:P-9] 横の差が一定').toBeLessThanOrEqual(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle();

  // 確定すると縦棒も右へ進む
  const beforeCommit = (await caretMark())!;
  await page.keyboard.press('1');
  await settle();
  const afterCommit = await caretMark();
  expect(afterCommit, '[measure:P-9] 確定後も縦棒は出たまま').not.toBeNull();
  expect(afterCommit!.left, '[measure:P-9] 縦棒は右へ進む').toBeGreaterThan(beforeCommit.left + 1);

  // Escape で閉じると消える
  await page.keyboard.press('Escape');
  await expect.poll(() => nagaIsOpen(page), { message: '[measure:P-9] Escape で閉じる' }).toBe(false);
  expect(await isShown(page, '.naga-caret-mark'), '[measure:P-9] Escape で縦棒も消える').toBe(false);
});

