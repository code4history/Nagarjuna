import { IMEOptions, IMEAttachOptions, IIMEManager } from './types';
/**
 * 1 要素に `<ime-ui>` パネルを取り付ける singleton の IME マネージャー。
 *
 * @deprecated 1.1.0 で非推奨。2.0.0 でも維持し、3.0.0 で削除予定です。新規実装では `NagaIME` を使用してください。
 * `getInstance()` の初回利用時に `console.warn` で非推奨警告を 1 回だけ出します（抑止オプションはありません）。
 */
export declare class IMEManager implements IIMEManager {
    private static instance;
    private activeElement;
    private eventCleanup?;
    private constructor();
    /** @deprecated 1.1.0 で非推奨・3.0.0 で削除予定。`new NagaIME()` を使用してください。 */
    static getInstance(): IMEManager;
    static resetInstance(): void;
    attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
    detach(): void;
    /** @deprecated 1.1.0 で非推奨・3.0.0 で削除予定。NagaIME の category 操作を使用してください（旧 filter と同一ではありません）。 */
    updateOptions(options: IMEOptions): void;
}
