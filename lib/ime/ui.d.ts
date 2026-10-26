import { IMEUIProps } from './ui-types';
/**
 * IME の候補パネルを表示する `<ime-ui>` custom element。
 *
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 * 文書へ接続されたとき（connectedCallback）に `console.warn` で非推奨警告を 1 回だけ出します。
 */
export declare class IMEUIElement extends HTMLElement {
    private props;
    private state;
    private ime;
    private fontLoader;
    private container;
    private input;
    private candidateList;
    constructor();
    connectedCallback(): void;
    private render;
    private setupStyles;
    private setupElements;
    private setupEventListeners;
    private handleInput;
    private updateCandidates;
    private renderCandidates;
    private handleCandidateSelect;
    private handleClose;
    updatePosition(): void;
    updateOptions(options: IMEUIProps['options']): void;
}
