/**
 * legacy IME（IMEManager / IMEOptions / onChange / updateOptions / <ime-ui>）の契約テスト。
 *
 * oct26-m7-t1（設計 v4 §5.3.2 AC1・AC3-d・AC4 ①）。1.1.0 で非推奨化するが、動作契約は
 * 1.0.0 のまま維持する。src/demo.ts と同じ呼出し順（resetInstance → getInstance →
 * focus で attach(element, { options }) → updateOptions）で検証する。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { IMEManager, NagaIME } from '@/ime';
import type { IMEOptions, IMEAttachOptions, IIMEManager, NagaIMEOptions } from '@/ime';

const DEPRECATION_PREFIX = '[nagarjuna] DEPRECATED:';

/** console.warn の呼出しのうち、非推奨警告だけを数える（既存 ui.ts の 'Search failed:' を除外）。 */
function countDeprecationWarnings(spy: ReturnType<typeof vi.spyOn>): number {
  return spy.mock.calls.filter(
    (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).startsWith(DEPRECATION_PREFIX)
  ).length;
}

type LegacyUI = HTMLElement & { updatePosition?: unknown; updateOptions?: unknown };

function findImeUI(): LegacyUI | null {
  return document.body.querySelector('ime-ui') as LegacyUI | null;
}

/** 生成辞書の動的 import が終わるまで、候補が出るのを待つ。 */
async function typeReadingAndWait(ui: LegacyUI, reading: string): Promise<HTMLElement[]> {
  const input = ui.shadowRoot!.querySelector('.ime-input') as HTMLInputElement;
  let items: HTMLElement[] = [];
  await vi.waitFor(
    () => {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.value = reading;
      input.dispatchEvent(new Event('input'));
      items = Array.from(ui.shadowRoot!.querySelectorAll('.ime-candidate')) as HTMLElement[];
      if (items.length === 0) throw new Error('候補がまだ出ない');
    },
    { timeout: 4000, interval: 20 }
  );
  return items;
}

describe('legacy IMEManager の契約（1.0.0 と同じ動作）', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('旧 export と型、および NagaIME の追加 export が @/ime から得られる（AC1）', () => {
    const options: IMEOptions = { enabledTypes: { hentaigana: true } };
    const attachOptions: IMEAttachOptions = { options, position: 'bottom' };
    const naga: NagaIMEOptions = {};
    const asInterface: (m: IMEManager) => IIMEManager = (m) => m;
    expect(typeof IMEManager.getInstance).toBe('function');
    expect(typeof IMEManager.resetInstance).toBe('function');
    expect(typeof NagaIME).toBe('function');
    expect(attachOptions.options).toBe(options);
    expect(naga).toEqual({});
    expect(typeof asInterface).toBe('function');
  });

  it(
    'demo と同じ順序で attach / updateOptions / onChange / detach が動き、<ime-ui> が昇格し、非推奨警告は 1 回だけ（AC3-d・AC4 ①）',
    async () => {
      const warn = vi.spyOn(console, 'warn');
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const input = document.createElement('input');
      input.className = 'ime-enabled';
      document.body.appendChild(input);

      const changes: string[] = [];
      IMEManager.resetInstance();
      const manager = IMEManager.getInstance();
      expect(IMEManager.getInstance()).toBe(manager); // singleton

      const options: IMEOptions = {
        enabledTypes: { hentaigana: true, siddham: true, itaiji: true, buddha_name: false },
      };
      input.addEventListener('focus', () => {
        manager.attach(input, { options, onChange: (value) => changes.push(value) });
      });
      input.focus(); // jsdom は接続済み input の focus() で focus イベントを発火する

      // <ime-ui> が body に 1 つ追加され、custom element として昇格している
      expect(window.customElements.get('ime-ui')).toBeTypeOf('function');
      const ui = findImeUI();
      expect(ui).not.toBeNull();
      expect(document.body.querySelectorAll('ime-ui')).toHaveLength(1);
      expect(typeof ui!.updatePosition).toBe('function');
      expect(ui!.shadowRoot).not.toBeNull();
      expect(ui!.shadowRoot!.querySelector('.ime-container')).not.toBeNull();
      // legacy attach は対象の inline fontFamily を上書きする（1.0.0 の挙動）
      expect(input.style.fontFamily).toContain('NINJAL Hentaigana');

      // 候補を確定すると onChange が確定後の値で呼ばれる
      const items = await typeReadingAndWait(ui!, 'あ');
      items[0].click();
      expect(input.value.length).toBeGreaterThan(0);
      expect(changes).toEqual([input.value]);

      // updateOptions は完全置換（hentaigana を指定しなければ無効になる）
      manager.updateOptions({ enabledTypes: { itaiji: true } });
      const itaiji = await typeReadingAndWait(ui!, 'とき');
      expect(itaiji.map((el) => el.dataset.char)).toContain('旹');
      const shadowInput = ui!.shadowRoot!.querySelector('.ime-input') as HTMLInputElement;
      shadowInput.value = 'あ';
      shadowInput.dispatchEvent(new Event('input'));
      expect(ui!.shadowRoot!.querySelectorAll('.ime-candidate')).toHaveLength(0);

      // detach で <ime-ui> が body から消える
      manager.detach();
      expect(findImeUI()).toBeNull();

      // 再 attach でも警告は増えない
      manager.attach(input, { options });
      expect(findImeUI()).not.toBeNull();
      manager.detach();
      expect(findImeUI()).toBeNull();

      expect(countDeprecationWarnings(warn)).toBe(1);
      const message = warn.mock.calls.find(
        (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).startsWith(DEPRECATION_PREFIX)
      )![0];
      expect(message).toBe(
        '[nagarjuna] DEPRECATED: IMEManager and <ime-ui> are deprecated since 1.1.0 and will be removed in 3.0.0. Use NagaIME instead.'
      );
      input.remove();
    },
    8000
  );
});
