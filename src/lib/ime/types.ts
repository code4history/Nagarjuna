export interface IMEEntry {
  reading: string;    // 読み（ひらがな）
  char: string;       // 変換後の文字
  type: 'hentaigana' | 'siddham' | 'itaiji';  // 文字の種類
}
  
export interface IMEOptions {
  enabledTypes: {
    hentaigana?: boolean;
    siddham?: boolean;
    itaiji?: boolean;
  };
}
  
export interface IMESearchResult {
  char: string;
  reading: string;
  type: IMEEntry['type'];
}
  
export class IMEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IMEError';
  }
}