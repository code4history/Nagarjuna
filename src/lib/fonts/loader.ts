import { FontSystem, FontConfig, FontSettings, FontLoadError } from './types';
import { fontStyles, fontFamilies } from './styles';

const FONT_CONFIGS: Record<FontSystem, FontConfig> = {
  hentaigana: {
    type: 'local',
    style: fontStyles.hentaigana,
    family: fontFamilies.hentaigana
  },
  siddham: {
    type: 'remote',
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Siddham&display=swap',
    family: fontFamilies.siddham
  },
  itaiji: {
    type: 'remote',
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap',
    family: fontFamilies.itaiji
  }
};

export class FontLoader {
  private loadedFonts: Set<FontSystem> = new Set();
  private loadingPromises: Map<FontSystem, Promise<void>> = new Map();
  private styleElement: HTMLStyleElement | null = null;
  
  constructor() {
    this.styleElement = document.createElement('style');
    document.head.appendChild(this.styleElement);
  }
  
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
    let loadPromise: Promise<void>;
    
    if (config.type === 'local') {
      // ローカルフォントの場合
      loadPromise = new Promise<void>((resolve) => {
        if (this.styleElement) {
          this.styleElement.textContent = (this.styleElement.textContent ?? '') + config.style;
        }
        resolve();
      });
    } else {
      // Google Fontsの場合
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.url;
    
      loadPromise = new Promise<void>((resolve, reject) => {
        link.addEventListener('load', () => {
          resolve();
        });
            
        link.addEventListener('error', () => {
          reject(new FontLoadError(system, config.url));
        });

        document.head.appendChild(link);
      });
    }
  
    this.loadingPromises.set(system, loadPromise);
      
    try {
      await loadPromise;
      this.loadedFonts.add(system);
      this.loadingPromises.delete(system);
    } catch (error) {
      this.loadingPromises.delete(system);
      throw error;
    }
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