import { expect, test, type Page } from '@playwright/test';
import { PART, STYLE_PROPS, fieldRect, fillAndFocus, gotoFixture, partInfo, waitShown, type PartName } from './helpers';

// nov26-m3-t1 §3.4 R: ページ側 CSS の影響（F-CLEAN と F-RESET の比較）。
// 各 expect には測りの印 [measure:<ID>] を付ける。t1 では origin/master で落ちることを、最初のエラーに
// 自分の印（test の題の先頭の ID と同じ）が入っていることで機械的に確かめた（t1/AC6 (b)）。
// nov26-m3-t2 で部品を <naga-ime> の影の中へ入れ、失敗を期待する印を外した（緑であることが基準）。

interface Measured {
  w: number;
  h: number;
  dx: number;
  dy: number;
  styles: Record<string, string>;
}

async function measure(page: Page, fixture: string, part: PartName): Promise<Measured> {
  await gotoFixture(page, fixture);
  await fillAndFocus(page, 'f1', 'あいう');
  await page.keyboard.press('Control+j');
  await waitShown(page, PART.item);
  const f1 = await fieldRect(page, 'f1');
  const info = await partInfo(page, PART[part]);
  if (!info) throw new Error(`部品 ${PART[part]} が見つからない（${fixture}）`);
  return {
    w: info.rect.width,
    h: info.rect.height,
    dx: info.rect.left - f1.left,
    dy: info.rect.top - f1.top,
    styles: info.styles,
  };
}

function compare(clean: Measured, reset: Measured): Array<{ key: string; clean: string | number; reset: string | number }> {
  const diffs: Array<{ key: string; clean: string | number; reset: string | number }> = [];
  for (const k of ['w', 'h', 'dx', 'dy'] as const) {
    if (Math.abs(clean[k] - reset[k]) > 0.5) diffs.push({ key: k, clean: clean[k], reset: reset[k] });
  }
  for (const p of STYLE_PROPS) {
    if (clean.styles[p] !== reset.styles[p]) diffs.push({ key: p, clean: clean.styles[p], reset: reset.styles[p] });
  }
  return diffs;
}

const CASES: Array<{ id: string; part: PartName; label: string }> = [
  { id: 'R-trigger', part: 'trigger', label: '起動ボタン' },
  { id: 'R-popup', part: 'popup', label: 'popup' },
  { id: 'R-tab', part: 'tab', label: '選択中のタブ' },
  { id: 'R-search', part: 'search', label: '読み入力欄' },
  { id: 'R-item', part: 'item', label: '先頭の候補' },
];

for (const c of CASES) {
  test(`${c.id}: ${c.label}（${PART[c.part]}）が F-CLEAN と F-RESET で同じ寸法・位置・書式`, async ({ page }, testInfo) => {
    const clean = await measure(page, 'f-clean', c.part);
    const reset = await measure(page, 'f-reset', c.part);
    const diffs = compare(clean, reset);
    await testInfo.attach('diffs', { body: JSON.stringify(diffs, null, 2), contentType: 'application/json' });
    expect(diffs, `[measure:${c.id}]`).toEqual([]);
  });
}
