/**
 * `@c4h/nagarjuna/ime`（= `src/ime.ts`）の評価と、そこから得られる 2 つの API の警告の数
 * （nov26-m3-t4 タスク設計 §3.8・§7 t4/AC3）。
 *
 * **このファイルは試験の順に意味がある。** 数える単位は「同一モジュールにつき 1 回」であり、
 * 一度でも警告を出すとそのモジュールインスタンスでは二度と出ない。vitest はテストファイルごとに
 * 環境を分けるので、ここでは registry もモジュールの状態も空の状態から始まる。
 *   1. `await import('@/ime')` だけ → `DEPRECATED:` 0 回（import の副作用では警告しない）
 *   2. 得た `NagaIME` で new → attach → 開く → 確定 → destroy → 0 回（NagaIME は警告しない）
 *   3. `IMEManager.getInstance()` → 1 回
 *   4. もう一度 `getInstance()`・`resetInstance()`・`attach()`（`<ime-ui>` の接続）→ 1 回のまま
 *   5. ここまでの全経路で、`DEPRECATED:` を含まない `console.warn` は 0 回
 */
import { describe, it, expect, vi, afterAll } from 'vitest';

const DICTIONARY_TEST_TIMEOUT_MS = 8000;

const warn = vi.spyOn(console, 'warn');
vi.spyOn(console, 'log').mockImplementation(() => {});

/** 数えるのは `DEPRECATED:` を含む呼び出し（それ以外の警告と混ぜない） */
const deprecations = () => warn.mock.calls.filter((args) => String(args[0]).includes('DEPRECATED:'));
/** `DEPRECATED:` を含まない警告 */
const others = () => warn.mock.calls.filter((args) => !String(args[0]).includes('DEPRECATED:'));

afterAll(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('@c4h/nagarjuna/ime の評価と警告（順に意味がある）', () => {
  it('1. import だけでは DEPRECATED: の警告を出さない', async () => {
    const entry = await import('@/ime');
    expect(Object.keys(entry).sort()).toEqual(['IMEManager', 'NagaIME']);
    expect(deprecations()).toHaveLength(0);
    expect(others()).toHaveLength(0);
  });

  it(
    '2. 得た NagaIME で new → attach → 開く → 確定 → destroy しても警告 0 回',
    async () => {
      const { NagaIME } = await import('@/ime');
      const field = document.createElement('input');
      document.body.appendChild(field);
      const ime = new NagaIME();
      ime.attach(field);
      field.focus();
      await ime.open(field);
      expect(ime.isOpen).toBe(true);

      // 読みを打って Enter で確定する（候補が出るまで待つ）
      const search = ime.shadowRoot!.querySelector('.naga-search') as HTMLInputElement;
      await vi.waitFor(
        () => {
          search.value = 'あ';
          search.dispatchEvent(new Event('input', { bubbles: true }));
          if (!ime.shadowRoot!.querySelector('.naga-item')) throw new Error('候補がまだ出ない');
        },
        { timeout: 4000, interval: 20 }
      );
      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(field.value.length).toBeGreaterThan(0);

      ime.destroy();
      field.remove();
      expect(document.body.querySelector('naga-ime')).toBeNull();

      expect(deprecations()).toHaveLength(0);
      expect(others()).toHaveLength(0);
    },
    DICTIONARY_TEST_TIMEOUT_MS
  );

  it('3. IMEManager.getInstance() の初回で DEPRECATED: の警告が 1 回', async () => {
    const { IMEManager } = await import('@/ime');
    expect(deprecations()).toHaveLength(0);
    IMEManager.getInstance();
    expect(deprecations()).toHaveLength(1);
    expect(String(deprecations()[0][0])).toContain('3.0.0');
    expect(String(deprecations()[0][0])).toContain('NagaIME');
  });

  it(
    '4. もう一度 getInstance()・resetInstance()・attach()（<ime-ui> の接続）でも 1 回のまま',
    async () => {
      const { IMEManager } = await import('@/ime');
      IMEManager.getInstance();
      expect(deprecations()).toHaveLength(1);

      IMEManager.resetInstance();
      expect(deprecations()).toHaveLength(1);

      const input = document.createElement('input');
      document.body.appendChild(input);
      IMEManager.getInstance().attach(input, { options: { enabledTypes: { hentaigana: true } } });
      // <ime-ui> が文書に入り、connectedCallback を通った
      expect(document.body.querySelector('ime-ui')).not.toBeNull();
      expect(deprecations()).toHaveLength(1);

      IMEManager.getInstance().detach();
      input.remove();
      expect(deprecations()).toHaveLength(1);
    },
    DICTIONARY_TEST_TIMEOUT_MS
  );

  it('5. すべての経路を通して、DEPRECATED: を含まない警告は 0 回（NagaIME は console.warn を出さない）', () => {
    expect(others()).toEqual([]);
  });
});
