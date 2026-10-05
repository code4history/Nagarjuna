/**
 * legacy IME（IMEManager / IMEOptions / onChange / updateOptions / <ime-ui>）の契約テスト。
 *
 * oct26-m7-t1（設計 v4 §5.3.2 AC1・AC3-d）。動作契約は 1.0.0 のまま維持する。
 * 1.1.0-rc.1 で入れた非推奨化（console.warn）は 1.1.0-rc.3 で取り消した ∴ 警告が出ないことも検査する。
 * src/demo.ts と同じ呼出し順（resetInstance → getInstance →
 * focus で attach(element, { options }) → updateOptions）で検証する。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as imeEntry from '@/ime';
import { IMEManager } from '@/ime';
import type { IMEOptions, IMEAttachOptions, IIMEManager } from '@/ime';

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

  it('旧 export と型が @/ime から得られる（AC1）', () => {
    const options: IMEOptions = { enabledTypes: { hentaigana: true } };
    const attachOptions: IMEAttachOptions = { options, position: 'bottom' };
    const asInterface: (m: IMEManager) => IIMEManager = (m) => m;
    expect(typeof IMEManager.getInstance).toBe('function');
    expect(typeof IMEManager.resetInstance).toBe('function');
    expect(attachOptions.options).toBe(options);
    expect(typeof asInterface).toBe('function');
  });

  it('NagaIME は公開 API（@/ime = nagarjuna/ime のエントリ）に無い（1.1.0 では新 UI のプレビューとしてデモでのみ使う）', () => {
    // 値の export は 1.0.0 と同じ IMEManager だけ（型は実行時に存在しない）
    expect(Object.keys(imeEntry).sort()).toEqual(['IMEManager']);
    expect('NagaIME' in imeEntry).toBe(false);
  });

  it(
    'demo と同じ順序で attach / updateOptions / onChange / detach が動き、<ime-ui> が昇格し、console.warn は 0 回（AC3-d）',
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

      // 再 attach
      manager.attach(input, { options });
      expect(findImeUI()).not.toBeNull();
      manager.detach();
      expect(findImeUI()).toBeNull();

      // 非推奨化は取り消した ∴ getInstance()・<ime-ui> の接続・再 attach のいずれでも警告しない
      expect(warn).not.toHaveBeenCalled();
      input.remove();
    },
    8000
  );
});
