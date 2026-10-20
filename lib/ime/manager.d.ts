import { IMEOptions, IMEAttachOptions, IIMEManager } from './types';
/**
 * 1 要素に `<ime-ui>` パネルを取り付ける singleton の IME マネージャー。
 *
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 */
export declare class IMEManager implements IIMEManager {
    private static instance;
    private activeElement;
    private eventCleanup?;
    private constructor();
    /**
     * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
     * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
     */
    static getInstance(): IMEManager;
    /**
     * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
     * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
     */
    static resetInstance(): void;
    /**
     * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
     * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
     */
    attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
    /**
     * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
     * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
     */
    detach(): void;
    /**
     * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
     * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
     */
    updateOptions(options: IMEOptions): void;
}
