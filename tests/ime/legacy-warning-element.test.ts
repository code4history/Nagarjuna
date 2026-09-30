/**
 * <ime-ui> を直接生成・接続しても console.warn を出さない。
 *
 * 1.1.0-rc.1 では IMEManager / <ime-ui> を非推奨とし、接続時に 1 回だけ警告していた。
 * 1.1.0-rc.3 で非推奨化を取り消した（正式な IME は従来どおり IMEManager / <ime-ui>）ため、
 * 警告が出ないことを検査する。
 *
 * customElements の registry は vi.resetModules() で消えず、ui.ts の登録 guard
 * （既登録なら define しない）があるため、同じファイルで IMEManager を先に使うと
 * 新しいモジュールの connectedCallback を通らない。vitest はテストファイルごとに環境を
 * 分けるので、ここでは registry が空の状態から始まる。
 */
import { describe, it, expect, vi } from 'vitest';

describe('<ime-ui> の直接接続では警告を出さない', () => {
  // vi.resetModules() 後の動的 import はモジュールを評価し直すため、負荷の高い環境では既定の 1000ms を超える（2026-10-01 に時間切れで揺れた）
  it('vi.resetModules() 後に <ime-ui> を body へ 2 個接続しても console.warn は 0 回', { timeout: 10_000 }, async () => {
    vi.resetModules();
    expect(window.customElements.get('ime-ui')).toBeUndefined();
    const warn = vi.spyOn(console, 'warn');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await import('@/lib/ime/ui');
    expect(window.customElements.get('ime-ui')).toBeTypeOf('function');

    const first = document.createElement('ime-ui');
    // 生成だけでは描画しない（connectedCallback で描画する）
    expect(first.shadowRoot!.querySelector('.ime-container')).toBeNull();
    document.body.appendChild(first);
    // 接続で connectedCallback が走った（描画された）ことを確かめてから数える
    expect(first.shadowRoot!.querySelector('.ime-container')).not.toBeNull();

    const second = document.createElement('ime-ui');
    document.body.appendChild(second);
    expect(second.shadowRoot!.querySelector('.ime-container')).not.toBeNull();

    expect(warn).not.toHaveBeenCalled();

    first.remove();
    second.remove();
    vi.restoreAllMocks();
  });
});
