/**
 * 同一ページでの legacy <ime-ui> と NagaIME の共存（oct26-m7-t1 設計 v4 §3.1・AC6）。
 *
 * テストの順序に意味がある: 最初のテストは <ime-ui> がまだ登録されていない registry で
 * NagaIME だけを import し、NagaIME が custom element を登録しないことを spy で確かめる
 * （registry は列挙できず、ui.ts は既登録なら define を飛ばすため、登録後では判定にならない）。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// 辞書（生成済み dictionary.ts）の動的 import を伴うテストは、vitest.config.ts の testTimeout: 1000 では
// 高負荷時に偽の赤になる（実装レビュー Round 1 Minor-1）。legacy-manager.test.ts と同じく個別に 8000ms を与える。
const DICTIONARY_TEST_TIMEOUT_MS = 8000;

type ImeModule = typeof import('@/ime');

async function loadIme(): Promise<ImeModule> {
  return import('@/ime');
}

/** CSS テキストから規則のセレクタを取り出す（@media 等の at-rule の prelude は除く）。 */
function selectorsOf(cssText: string): string[] {
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors: string[] = [];
  const re = /([^{}]+)\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noComments)) !== null) {
    const prelude = m[1].trim();
    if (prelude.startsWith('@')) continue;
    prelude.split(',').forEach((s) => selectors.push(s.trim()));
  }
  return selectors;
}

function nagaCreatedElements(): Element[] {
  const roots = Array.from(document.body.querySelectorAll('.naga-popup, .naga-trigger'));
  return roots.flatMap((root) => [root, ...Array.from(root.querySelectorAll('*'))]);
}

describe('legacy <ime-ui> と NagaIME の同一ページ共存（AC6）', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('NagaIME は custom element を登録しない（naga-ime だけを import・attach・open して define 0 回）', async () => {
    expect(window.customElements.get('ime-ui')).toBeUndefined();
    vi.resetModules();
    const define = vi.spyOn(window.customElements, 'define');
    const { NagaIME } = await import('@/lib/ime/naga-ime');
    const input = document.createElement('input');
    document.body.appendChild(input);
    const naga = new NagaIME();
    naga.attach(input);
    await naga.open(input);
    naga.destroy();
    expect(define).not.toHaveBeenCalled();
    expect(window.customElements.get('ime-ui')).toBeUndefined();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('別要素へ同時に attach しても id 重複 0・Naga の class は naga- 接頭辞のみ・style の selector は .naga- 始まり', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { IMEManager, NagaIME } = await loadIme();
    const { NAGA_STYLE_TEXT } = await import('@/lib/ime/naga-styles');

    const legacyInput = document.createElement('input');
    legacyInput.id = 'legacy-input';
    const nagaInput = document.createElement('textarea');
    nagaInput.id = 'naga-input';
    document.body.append(legacyInput, nagaInput);

    IMEManager.resetInstance();
    const manager = IMEManager.getInstance();
    manager.attach(legacyInput);
    const naga = new NagaIME();
    naga.attach(nagaInput);
    const naga2 = new NagaIME();
    const nagaInput2 = document.createElement('input');
    document.body.appendChild(nagaInput2);
    naga2.attach(nagaInput2);
    await naga.open(nagaInput);

    expect(document.body.querySelectorAll('ime-ui')).toHaveLength(1);
    expect(document.body.querySelectorAll('.naga-popup')).toHaveLength(2);

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(2);
    expect(ids.length - new Set(ids).size).toBe(0);

    const nagaElements = nagaCreatedElements();
    expect(nagaElements.length).toBeGreaterThan(10);
    for (const el of nagaElements) {
      for (const cls of Array.from(el.classList)) {
        expect(cls.startsWith('naga-'), `${el.tagName}.${cls}`).toBe(true);
      }
    }
    // Naga は ime-* class を light DOM に作らない
    expect(document.body.querySelectorAll('[class^="ime-"], [class*=" ime-"]')).toHaveLength(0);

    const selectors = selectorsOf(NAGA_STYLE_TEXT);
    expect(selectors.length).toBeGreaterThan(10);
    for (const s of selectors) {
      expect(s.startsWith('.naga-'), s).toBe(true);
    }
    // 文書へ入った style も同じ内容で 1 つだけ
    const styles = Array.from(document.head.querySelectorAll('style[data-naga-style]'));
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe(NAGA_STYLE_TEXT);

    manager.detach();
    naga.destroy();
    naga2.destroy();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('legacy detach 後も Naga が開閉でき、Naga detach 後も <ime-ui> が attach / detach できる', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { IMEManager, NagaIME } = await loadIme();
    const legacyInput = document.createElement('input');
    const nagaInput = document.createElement('input');
    document.body.append(legacyInput, nagaInput);

    const manager = IMEManager.getInstance();
    const naga = new NagaIME();
    manager.attach(legacyInput);
    naga.attach(nagaInput);

    manager.detach();
    expect(document.body.querySelector('ime-ui')).toBeNull();
    await naga.open(nagaInput);
    expect(naga.isOpen).toBe(true);
    naga.close();
    expect(naga.isOpen).toBe(false);
    await naga.open(nagaInput);
    expect((document.body.querySelector('.naga-popup') as HTMLElement).hidden).toBe(false);

    naga.detach(nagaInput);
    expect(document.body.querySelector('.naga-popup')).toBeNull();
    manager.attach(legacyInput);
    const ui = document.body.querySelector('ime-ui') as HTMLElement & { updatePosition?: unknown };
    expect(ui).not.toBeNull();
    expect(typeof ui.updatePosition).toBe('function');
    manager.detach();
    expect(document.body.querySelector('ime-ui')).toBeNull();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  describe('対象要素の style.fontFamily（§3.1・同一要素への二重 attach はサポート外だが相互破壊しない）', () => {
    it('legacy → Naga: Naga は既存の inline 値を変えず、detach しても legacy の値を残す', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { IMEManager, NagaIME } = await loadIme();
      const input = document.createElement('input');
      document.body.appendChild(input);
      const manager = IMEManager.getInstance();
      manager.attach(input);
      const legacyValue = input.style.fontFamily;
      expect(legacyValue).toContain('NINJAL Hentaigana');

      const naga = new NagaIME();
      naga.attach(input);
      expect(input.style.fontFamily).toBe(legacyValue);
      naga.detach(input);
      expect(input.style.fontFamily).toBe(legacyValue);
      manager.detach();
    }, DICTIONARY_TEST_TIMEOUT_MS);

    it('Naga → legacy: legacy は無条件に上書きし（1.0.0 の挙動）、Naga の detach は legacy の値を消さない', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { IMEManager, NagaIME } = await loadIme();
      const input = document.createElement('input');
      document.body.appendChild(input);
      // jsdom は computed fontFamily を持たない。実ブラウザと同じく既定書体がある状態にする
      const realGetComputedStyle = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
        const cs = realGetComputedStyle(el, pseudo);
        return el === input ? ({ ...cs, fontFamily: 'system-ui' } as CSSStyleDeclaration) : cs;
      });
      const naga = new NagaIME();
      naga.attach(input);
      const nagaValue = input.style.fontFamily;
      expect(nagaValue.startsWith('system-ui')).toBe(true);
      expect(nagaValue).toContain('NINJAL Hentaigana');

      const manager = IMEManager.getInstance();
      manager.attach(input);
      const legacyValue = input.style.fontFamily;
      expect(legacyValue.replace(/"/g, '')).toBe('NINJAL Hentaigana, Noto Sans Siddham, Noto Sans JP, serif');
      expect(legacyValue).not.toBe(nagaValue);

      naga.detach(input);
      expect(input.style.fontFamily).toBe(legacyValue);
      manager.detach();
    }, DICTIONARY_TEST_TIMEOUT_MS);

    it('Naga 単独: attach で設定した値は detach で空へ戻り、利用者が途中で変えた値は残す', async () => {
      const { NagaIME } = await loadIme();
      const a = document.createElement('input');
      const b = document.createElement('input');
      b.style.fontFamily = 'Custom Serif';
      document.body.append(a, b);
      const naga = new NagaIME();
      naga.attach([a, b]);
      expect(a.style.fontFamily).not.toBe('');
      expect(b.style.fontFamily).toContain('Custom Serif');
      expect(b.style.fontFamily).not.toContain('NINJAL Hentaigana');
      naga.detach(a);
      expect(a.style.fontFamily).toBe('');

      const c = document.createElement('input');
      document.body.appendChild(c);
      naga.attach(c);
      c.style.fontFamily = 'User Changed';
      naga.detach(c);
      expect(c.style.fontFamily).toContain('User Changed');
      naga.destroy();
      expect(b.style.fontFamily).toContain('Custom Serif');
    }, DICTIONARY_TEST_TIMEOUT_MS);
  });
});
