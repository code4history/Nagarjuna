import { IMEUIProps } from './ui-types';

export interface IMEUIElement extends HTMLElement {
  props: IMEUIProps;
}
  
declare global {
  interface HTMLElementTagNameMap {
    'ime-ui': IMEUIElement;
  }
}