import { IMEUIProps } from './ui-types';
import { IMEUIElement } from './ui-elements';
import { FontLoader } from '../fonts/loader';
import './ui';  // Web Componentの登録

export class IMEManager {
  private static instance: IMEManager;
  private activeElement: IMEUIElement | null = null;

  private constructor() {}

  static getInstance(): IMEManager {
    if (!IMEManager.instance) {
      IMEManager.instance = new IMEManager();
    }
    return IMEManager.instance;
  }

  attach(element: HTMLInputElement | HTMLTextAreaElement, options: Partial<IMEUIProps> = {}) {
    // フォントの設定
    const fontLoader = new FontLoader();
    const fontFamily = fontLoader.getFontFamilyString({
      hentaigana: true,
      siddham: true,
      itaiji: true
    });
    element.style.fontFamily = fontFamily;

    // IME UI要素の作成
    const imeUI = document.createElement('ime-ui') as IMEUIElement;
    
    // プロパティの設定
    Object.assign(imeUI, {
      props: {
        target: element,
        options: {
          enabledTypes: {
            hentaigana: true,
            siddham: true,
            itaiji: true,
            ...options.options?.enabledTypes
          }
        },
        position: options.position || 'bottom',
        onClose: () => this.detach(),
        onChange: options.onChange
      }
    });

    // 要素の配置
    document.body.appendChild(imeUI);
    this.activeElement = imeUI;

    // フォーカス監視の設定
    const handleBlur = (e: Event) => {
      const focusEvent = e as FocusEvent;
      const target = focusEvent.relatedTarget as HTMLElement | null;
      if (!target || !imeUI.contains(target)) {
        this.detach();
      }
    };

    element.addEventListener('blur', handleBlur);
  }

  detach() {
    if (this.activeElement) {
      this.activeElement.remove();
      this.activeElement = null;
    }
  }
}