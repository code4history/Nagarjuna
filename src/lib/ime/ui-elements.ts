import { IMEUIProps } from './ui-types';

/**
 * `<ime-ui>` 要素の型。
 *
 * @deprecated 1.1.0 で非推奨・2.0.0 で維持・3.0.0 で削除予定。新規実装では `NagaIME` を使用してください。
 */
export interface IMEUIElement extends HTMLElement {
  props: IMEUIProps;
  updatePosition: () => void;
  updateOptions: (options: IMEUIProps['options']) => void;
}
  
declare global {
  interface HTMLElementTagNameMap {
    'ime-ui': IMEUIElement;
  }
}