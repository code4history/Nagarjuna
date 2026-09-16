import { IMEUIProps } from './ui-types';
/**
 * legacy の `<ime-ui>` custom element。
 *
 * @deprecated 1.1.0 で非推奨。2.0.0 でも維持し、3.0.0 で削除予定です。新規実装では `NagaIME` を使用してください。
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
