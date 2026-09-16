/**
 * AC4 ②: <ime-ui> を直接生成・接続するだけでも、非推奨警告が同一 process で 1 回だけ出る。
 *
 * oct26-m7-t1 設計 v4 §5.6.2 Minor-G により legacy-manager.test.ts から分離した。
 * customElements の registry は vi.resetModules() で消えず、ui.ts の登録 guard
 * （既登録なら define しない）があるため、同じファイルで IMEManager を先に使うと
 * 接続される要素は古いモジュールの guard を通り、警告が 0 回になる（実装時に試作で再現）。
 * vitest はテストファイルごとに環境を分けるので、ここでは registry が空の状態から始まる。
 */
import { describe, it, expect, vi } from 'vitest';

const DEPRECATION_PREFIX = '[nagarjuna] DEPRECATED:';

describe('<ime-ui> の直接接続による非推奨警告（AC4 ②）', () => {
  it('vi.resetModules() 後に <ime-ui> を body へ接続するだけで 1 回、2 個目の接続では増えない', async () => {
    vi.resetModules();
    expect(window.customElements.get('ime-ui')).toBeUndefined();
    const warn = vi.spyOn(console, 'warn');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await import('@/lib/ime/ui');
    expect(window.customElements.get('ime-ui')).toBeTypeOf('function');
    // import（登録）だけでは警告しない
    const count = () =>
      warn.mock.calls.filter(
        (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).startsWith(DEPRECATION_PREFIX)
      ).length;
    expect(count()).toBe(0);

    const first = document.createElement('ime-ui');
    expect(count()).toBe(0); // 生成だけでは出さない（接続で出す）
    document.body.appendChild(first);
    expect(count()).toBe(1);

    const second = document.createElement('ime-ui');
    document.body.appendChild(second);
    expect(count()).toBe(1);

    first.remove();
    second.remove();
    vi.restoreAllMocks();
  });
});
