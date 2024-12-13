import { IMEOptions, IMEAttachOptions, IIMEManager } from './types';
import { IMEUIElement } from './ui-elements';
import { FontLoader } from '../fonts/loader';
import './ui';  // Web Componentの登録

export class IMEManager implements IIMEManager {
  private static instance: IMEManager;
  private activeElement: IMEUIElement | null = null;
  private eventCleanup?: () => void;
  
  private constructor() {}  // private constructor for singleton

  public static getInstance(): IMEManager {
    if (!IMEManager.instance) {
      IMEManager.instance = new IMEManager();
    }
    return IMEManager.instance;
  }

  public static resetInstance(): void {  // インスタンスをリセットするメソッドを追加
    if (IMEManager.instance) {
      IMEManager.instance.detach();
    }
    IMEManager.instance = new IMEManager();
  }

  attach(element: HTMLInputElement | HTMLTextAreaElement, options: IMEAttachOptions = {}) {
    // 既存のIME UIがあれば削除
    this.detach();

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
          enabledTypes: options.options?.enabledTypes || {
            hentaigana: true,
            siddham: true,
            itaiji: true,
            buddha_name: false
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
    imeUI.updatePosition();
  
    // イベントリスナーの設定
    const handleBlur = (e: Event) => {
      const focusEvent = e as FocusEvent;
      const target = focusEvent.relatedTarget as HTMLElement | null;
      if (!target || !imeUI.contains(target)) {
        this.detach();
      }
    };
  
    element.addEventListener('blur', handleBlur);
    element.addEventListener('click', () => imeUI.updatePosition());
    element.addEventListener('select', () => imeUI.updatePosition());
    element.addEventListener('keyup', () => imeUI.updatePosition());
    window.addEventListener('resize', () => imeUI.updatePosition());
  
    this.eventCleanup = () => {
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('click', () => imeUI.updatePosition());
      element.removeEventListener('select', () => imeUI.updatePosition());
      element.removeEventListener('keyup', () => imeUI.updatePosition());
      window.removeEventListener('resize', () => imeUI.updatePosition());
    };
  }
  
  detach() {
    if (this.eventCleanup) {
      this.eventCleanup();
      this.eventCleanup = undefined;
    }
    if (this.activeElement) {
      this.activeElement.remove();
      this.activeElement = null;
    }
  }
  
  updateOptions(options: IMEOptions) {
    if (this.activeElement) {
      // オプションを完全に置き換える（マージではなく）
      this.activeElement.updateOptions({
        enabledTypes: {
          hentaigana: false,
          siddham: false,
          itaiji: false,
          buddha_name: false,
          ...options.enabledTypes
        }
      });
    }
  }
}