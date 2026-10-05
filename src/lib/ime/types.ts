// 外部に公開する型定義
export interface IMEOptions {
  enabledTypes: {
    hentaigana?: boolean;
    siddham?: boolean;
    itaiji?: boolean;
    buddha_name?: boolean;
  };
}
  
export interface IMEAttachOptions {
  options?: IMEOptions;
  position?: 'bottom' | 'cursor';
  onChange?: (value: string) => void;
}
  
// IMEManagerのパブリックインターフェース
export interface IIMEManager {
  attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
  detach(): void;
  updateOptions(options: IMEOptions): void;
}