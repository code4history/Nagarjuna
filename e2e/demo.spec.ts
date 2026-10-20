import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import { PART, isShown } from './helpers';

/**
 * nov26-m3-t4 §3.8: デモの入れ替え（トップ＝NagaIME・legacy.html＝旧 IME・naga.html＝転送）と、
 * 非推奨の警告が新しいデモでは出ないこと。各 expect に測りの印 [measure:T-n] を付ける。
 * 対象は Pages と同じ 3 ページ（開発サーバが index.html / legacy.html / public/naga.html を返す）。
 */

const DICTIONARY_WAIT_MS = 15_000;

/** ページが出した console の warning を集める（DEPRECATED: を含むものだけ数える）。 */
function collectDeprecations(page: Page): string[] {
  const messages: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'warning' && msg.text().includes('DEPRECATED:')) messages.push(msg.text());
  });
  return messages;
}

test('T-1: トップ（/）で <naga-ime> が昇格し、#naga-field-1 の focus で起動ボタンが出る', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => typeof customElements.get('naga-ime')), {
    message: '[measure:T-1] naga-ime の定義',
    timeout: DICTIONARY_WAIT_MS,
  }).toBe('function');
  expect(
    await page.evaluate(() => document.querySelector('naga-ime') instanceof (customElements.get('naga-ime') as CustomElementConstructor)),
    '[measure:T-1] 文書の <naga-ime> が登録されたクラスのインスタンス'
  ).toBe(true);

  await page.focus('#naga-field-1');
  await expect
    .poll(() => isShown(page, PART.trigger), { message: '[measure:T-1] 起動ボタン', timeout: DICTIONARY_WAIT_MS })
    .toBe(true);
});

test('T-2: /naga.html?debugViewport=1#x を開くと /?debugViewport=1#x へ転送される（クエリとハッシュを保つ）', async ({ page }) => {
  await page.goto('/naga.html?debugViewport=1#x');
  await expect.poll(() => new URL(page.url()).pathname, { message: '[measure:T-2] 転送後のパス' }).toBe('/');
  const url = new URL(page.url());
  expect(url.search, '[measure:T-2] クエリ').toBe('?debugViewport=1');
  expect(url.hash, '[measure:T-2] ハッシュ').toBe('#x');
});

test('T-3: /legacy.html に非推奨の案内があり、#input1 の focus で ime-ui が入り、DEPRECATED: の警告が 1 件', async ({ page }) => {
  const deprecations = collectDeprecations(page);
  await page.goto('/legacy.html');

  const notice = page.locator('.deprecated-notice');
  await expect(notice, '[measure:T-3] 非推奨の案内').toBeVisible();
  await expect(notice, '[measure:T-3] 案内の文').toContainText('1.2.0');
  await expect(notice, '[measure:T-3] 案内の文').toContainText('3.0.0');

  await page.focus('#input1');
  await expect
    .poll(() => page.evaluate(() => document.querySelectorAll('ime-ui').length), {
      message: '[measure:T-3] <ime-ui> が文書に入る',
      timeout: DICTIONARY_WAIT_MS,
    })
    .toBe(1);
  await expect
    .poll(() => deprecations.length, { message: '[measure:T-3] DEPRECATED: の警告', timeout: DICTIONARY_WAIT_MS })
    .toBe(1);
  expect(deprecations[0], '[measure:T-3] 警告の文').toContain('Use NagaIME (<naga-ime>) instead.');
});

test('T-4: トップ（/）では DEPRECATED: の警告が出ない', async ({ page }) => {
  const deprecations = collectDeprecations(page);
  await page.goto('/');
  await page.focus('#naga-field-1');
  await expect
    .poll(() => isShown(page, PART.trigger), { message: '[measure:T-4] 起動ボタン', timeout: DICTIONARY_WAIT_MS })
    .toBe(true);
  // 起動ボタンが出た後も警告が増えないことを確かめる
  await page.waitForTimeout(500);
  expect(deprecations, '[measure:T-4] DEPRECATED: の警告').toHaveLength(0);
});
