/**
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 */
export interface IMEOptions {
    enabledTypes: {
        hentaigana?: boolean;
        siddham?: boolean;
        itaiji?: boolean;
        buddha_name?: boolean;
    };
}
/**
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 */
export interface IMEAttachOptions {
    options?: IMEOptions;
    position?: 'bottom' | 'cursor';
    onChange?: (value: string) => void;
}
/**
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 */
export interface IIMEManager {
    attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
    detach(): void;
    updateOptions(options: IMEOptions): void;
}
