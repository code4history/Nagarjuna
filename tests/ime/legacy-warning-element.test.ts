/**
 * <ime-ui> を直接生成・接続すると、`DEPRECATED:` の警告を 1 回だけ出す。
 *
 * 1.2.0 では IMEManager / <ime-ui> を非推奨とし（2.0.0 で維持・3.0.0 で削除予定）、
 * 接続時に 1 回だけ警告する。2 個目を接続しても増えないこと（同一モジュールにつき 1 回）を
 * 検査する。
 *
 * customElements の registry は vi.resetModules() で消えず、ui.ts の登録 guard
 * （既登録なら define しない）があるため、同じファイルで IMEManager を先に使うと
 * 新しいモジュールの connectedCallback を通らない。vitest はテストファイルごとに環境を
 * 分けるので、ここでは registry が空の状態から始まる。
 */
import { describe, it, expect, vi } from 'vitest';

describe('<ime-ui> の直接接続では警告を 1 回だけ出す', () => {
  // vi.resetModules() 後の動的 import はモジュールを評価し直すため、負荷の高い環境では既定の 1000ms を超える（2026-10-01 に時間切れで揺れた）
  it('vi.resetModules() 後に <ime-ui> を body へ 2 個接続すると DEPRECATED: の警告はちょうど 1 回', { timeout: 10_000 }, async () => {
    vi.resetModules();
    expect(window.customElements.get('ime-ui')).toBeUndefined();
    const warn = vi.spyOn(console, 'warn');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    /** 数えるのは `DEPRECATED:` を含む呼び出し（NagaIME 側の別の警告と混ぜない） */
    const deprecations = () => warn.mock.calls.filter((args) => String(args[0]).includes('DEPRECATED:'));

    await import('@/lib/ime/ui');
    expect(window.customElements.get('ime-ui')).toBeTypeOf('function');
    // モジュールの評価（import）だけでは警告しない
    expect(deprecations()).toHaveLength(0);

    const first = document.createElement('ime-ui');
    // 生成だけでは描画しない（connectedCallback で描画する）
    expect(first.shadowRoot!.querySelector('.ime-container')).toBeNull();
    document.body.appendChild(first);
    // 接続で connectedCallback が走った（描画された）ことを確かめてから数える
    expect(first.shadowRoot!.querySelector('.ime-container')).not.toBeNull();
    // 1 個目の接続の時点で 1 回
    expect(deprecations()).toHaveLength(1);

    const second = document.createElement('ime-ui');
    document.body.appendChild(second);
    expect(second.shadowRoot!.querySelector('.ime-container')).not.toBeNull();

    // 2 個目を接続しても 1 回のまま（同一モジュールにつき 1 回）
    expect(deprecations()).toHaveLength(1);

    first.remove();
    second.remove();
    vi.restoreAllMocks();
  });
});
