import { FontSystem, FontConfig, FontSettings, FontLoadError } from './types';

const FONT_CONFIGS: Record<FontSystem, FontConfig> = {
  hentaigana: {
    url: 'https://fonts.googleapis.com/earlyaccess/notohentaigana.css',
    family: 'Noto Hentaigana'
  },
  siddham: {
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Siddham&display=swap',
    family: 'Noto Sans Siddham'
  },
  itaiji: {
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap',
    family: 'Noto Sans JP'
  }
};

export class FontLoader {
  private loadedFonts: Set<FontSystem> = new Set();
  private loadingPromises: Map<FontSystem, Promise<void>> = new Map();

  async loadFonts(settings: FontSettings): Promise<void> {
    const systemsToLoad = Object.entries(settings)
      .filter(([_, enabled]) => enabled)
      .map(([system]) => system as FontSystem);

    try {
      await Promise.all(
        systemsToLoad.map(system => this.loadFont(system))
      );
    } catch (error) {
      if (error instanceof FontLoadError) throw error;
      const wrappedError = new Error('Failed to load fonts');
      if (error instanceof Error) {
        wrappedError.cause = error;
      }
      throw wrappedError;
    }
  }

  private async loadFont(system: FontSystem): Promise<void> {
    if (this.loadedFonts.has(system)) return;

    const existingPromise = this.loadingPromises.get(system);
    if (existingPromise) return existingPromise;

    const config = FONT_CONFIGS[system];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.url;

    const loadPromise = new Promise<void>((resolve, reject) => {
      link.addEventListener('load', () => {
        this.loadedFonts.add(system);
        this.loadingPromises.delete(system);
        resolve();
      });
      
      link.addEventListener('error', () => {
        this.loadingPromises.delete(system);
        reject(new FontLoadError(system, config.url));
      });
    });

    this.loadingPromises.set(system, loadPromise);
    document.head.appendChild(link);

    return loadPromise;
  }

  getFontFamilyString(settings: FontSettings): string {
    const enabledFonts = Object.entries(settings)
      .filter(([_, enabled]) => enabled)
      .map(([system]) => FONT_CONFIGS[system as FontSystem].family);

    return enabledFonts.length > 0 
      ? enabledFonts.concat(['serif']).join(', ')
      : 'serif';
  }

  isFontLoaded(system: FontSystem): boolean {
    return this.loadedFonts.has(system);
  }
}