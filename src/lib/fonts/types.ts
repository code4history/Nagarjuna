export type FontSystem = 'hentaigana' | 'siddham' | 'itaiji';

// Google Fonts用の設定
interface RemoteFontConfig {
  type: 'remote';
  url: string;
  family: string;
}

// ローカルフォント用の設定
interface LocalFontConfig {
  type: 'local';
  style: string;
  family: string;
}

export type FontConfig = RemoteFontConfig | LocalFontConfig;

export type FontSettings = {
  [K in FontSystem]?: boolean;
};

export class FontLoadError extends Error {
  constructor(
    public readonly system: FontSystem,
    public readonly url?: string,
    message?: string
  ) {
    super(message ?? `Failed to load font for ${system}${url ? ` from ${url}` : ''}`);
    this.name = 'FontLoadError';
  }
}