import { IMEUIProps } from './ui-types';
/**
 * `<ime-ui>` 要素の型。
 *
 * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
 * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
 */
export interface IMEUIElement extends HTMLElement {
    props: IMEUIProps;
    updatePosition: () => void;
    updateOptions: (options: IMEUIProps['options']) => void;
}
declare global {
    interface HTMLElementTagNameMap {
        /**
         * @deprecated 1.2.0 で非推奨。2.0.0 では維持し、3.0.0 で削除予定。代わりに `NagaIME`（`<naga-ime>`）を使用してください。
         * Deprecated since 1.2.0. Kept in 2.0.0 and scheduled for removal in 3.0.0. Use `NagaIME` (`<naga-ime>`) instead.
         */
        'ime-ui': IMEUIElement;
    }
}
