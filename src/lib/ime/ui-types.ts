export interface IMEUIProps {
  // ターゲット要素に関する情報
  target: HTMLInputElement | HTMLTextAreaElement;
  // IMEのオプション設定
  options: {
    enabledTypes: {
      hentaigana?: boolean;
      siddham?: boolean;
      itaiji?: boolean;
      buddha_name?: boolean;
    };
  };
  // IME UIの表示位置の基準
  position?: 'bottom' | 'cursor';
  // コールバック
  onClose?: () => void;
  onChange?: (value: string) => void;
}
  
export interface IMEUIState {
  input: string;
  candidates: Array<{
    char: string;
    reading: string;
    type: string;
  }>;
  cursorPosition: {
    x: number;
    y: number;
  } | null;
}