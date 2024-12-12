export type FontSystem = 'hentaigana' | 'siddham' | 'itaiji';

export interface FontConfig {
  url: string;
  family: string;
}

export type FontSettings = {
  [K in FontSystem]?: boolean;
};

export class FontLoadError extends Error {
  constructor(
    public readonly system: FontSystem,
    public readonly url: string,
    message?: string
  ) {
    super(message ?? `Failed to load font for ${system} from ${url}`);
    this.name = 'FontLoadError';
  }
}