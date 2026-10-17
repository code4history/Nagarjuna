import { IMEOptions, IMEAttachOptions, IIMEManager } from './types';
/**
 * 1 要素に `<ime-ui>` パネルを取り付ける singleton の IME マネージャー。
 */
export declare class IMEManager implements IIMEManager {
    private static instance;
    private activeElement;
    private eventCleanup?;
    private constructor();
    static getInstance(): IMEManager;
    static resetInstance(): void;
    attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
    detach(): void;
    updateOptions(options: IMEOptions): void;
}
