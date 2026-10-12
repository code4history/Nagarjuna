/**
 * <naga-ime> の登録の 3 つの場合（nov26-m3-t2 タスク設計 §3.6・マイルストーン設計 §5.2 の表・
 * orchestrator 決定 OD-M3-R2-MIN-1）。
 *
 * **テストの順に意味がある。** vitest はファイルごとに環境（registry を含む）を分けるので、
 * このファイルでは 1 の `await import` が naga-ime モジュールの最初の評価になる。
 *   1. 未登録 → 自分のクラスを登録する（昇格前の代入を取り込む）
 *   2. 自分のクラスで new → attach → open → 確定 → detach しても console.warn 0 回
 *      （oct26 の naga-ime.test.ts 398〜416 行から移した。意図と期待値 0 は変えない）
 *   3. もう一度 import（再評価しない）→ 同じクラス・define は増えない・new できる
 *   4. vi.resetModules() 後の再 import（別のクラス）→ 上書きしない・警告 0 回・new は TypeError
 */
import { describe, it, expect, vi, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DICTIONARY_TEST_TIMEOUT_MS = 8000;
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')) as { name: string };

type NagaModule = typeof import('@/lib/ime/naga-ime');

const warn = vi.spyOn(console, 'warn');
const define = vi.spyOn(window.customElements, 'define');

let First: NagaModule['NagaIME'];
let early: HTMLElement & { categories?: unknown };

afterAll(() => {
  warn.mockRestore();
  define.mockRestore();
  document.body.innerHTML = '';
});

describe('<naga-ime> の登録（順に意味がある）', () => {
  it('1. 未登録なら naga-ime だけを 1 回登録し、昇格前の代入を取り込む。ime-ui は登録しない', async () => {
    expect(customElements.get('naga-ime')).toBeUndefined();
    early = document.createElement('naga-ime') as HTMLElement & { categories?: unknown };
    early.categories = ['itaiji'];
    document.body.appendChild(early);

    ({ NagaIME: First } = await import('@/lib/ime/naga-ime'));

    expect(define).toHaveBeenCalledTimes(1);
    expect(define.mock.calls[0][0]).toBe('naga-ime');
    expect(customElements.get('naga-ime')).toBe(First);
    expect(early).toBeInstanceOf(First);
    // 昇格前の own property は取り除かれ、prototype の getter が実効値を返す
    expect(Object.prototype.hasOwnProperty.call(early, 'categories')).toBe(false);
    expect((early as unknown as InstanceType<NagaModule['NagaIME']>).categories).toEqual(['itaiji']);
    expect(customElements.get('ime-ui')).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('2. NagaIME だけの利用（new → attach → open → 確定 → detach）では console.warn 0 回', async () => {
    const target = document.createElement('input');
    document.body.appendChild(target);
    const local = new First();
    local.attach(target);
    target.focus();
    await local.open(target);
    (local.shadowRoot!.querySelector('.naga-tab[data-category="kumimoji"]') as HTMLButtonElement).click();
    const search = local.shadowRoot!.querySelector('.naga-search') as HTMLInputElement;
    search.value = 'より';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(target.value).toBe('ゟ');
    local.detach(target);
    local.destroy();
    target.remove();
    expect(warn).not.toHaveBeenCalled();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('3. もう一度 import しても再評価しない（同じクラス・define は増えない・new できる）', async () => {
    const { NagaIME: Again } = await import('@/lib/ime/naga-ime');
    expect(Again).toBe(First);
    expect(define).toHaveBeenCalledTimes(1);
    const el = new Again();
    expect(el).toBeInstanceOf(First);
    expect(el.tagName.toLowerCase()).toBe('naga-ime');
    expect(warn).not.toHaveBeenCalled();
  });

  it('4. 再評価した別のクラスは登録を上書きせず、警告を出さず、new で TypeError を投げる', async () => {
    vi.resetModules();
    const { NagaIME: Fresh } = await import('@/lib/ime/naga-ime');
    expect(Fresh).not.toBe(First);
    expect(define).toHaveBeenCalledTimes(1);
    expect(customElements.get('naga-ime')).toBe(First);
    expect(warn).not.toHaveBeenCalled();

    let caught: unknown = null;
    try {
      new Fresh();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TypeError);
    const message = (caught as TypeError).message;
    expect(message).toContain('cannot construct NagaIME');
    expect(message).toContain(`[${pkg.name}]`);
    expect(message).toContain(`Load a single copy of ${pkg.name}`);

    // 文書の既存の <naga-ime> は先のクラスのまま。createElement も先のクラスの要素を返す
    expect(early).toBeInstanceOf(First);
    expect(document.createElement('naga-ime')).toBeInstanceOf(First);
    expect(warn).not.toHaveBeenCalled();
  });
});
