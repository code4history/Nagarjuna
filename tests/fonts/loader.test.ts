import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FontLoader } from '@/lib/fonts/loader';
import { FontLoadError } from '@/lib/fonts/types';

describe('FontLoader', () => {
  let fontLoader: FontLoader;

  beforeEach(() => {
    fontLoader = new FontLoader();
    document.head.innerHTML = '';
  });

  it('should generate correct font-family string', () => {
    const settings = {
      hentaigana: true,
      siddham: true,
      itaiji: false
    };

    const fontFamily = fontLoader.getFontFamilyString(settings);
    expect(fontFamily).toBe('NINJAL Hentaigana, Noto Sans Siddham, serif');
  });

  it('should add font styles to document', async () => {  // asyncを追加
    const settings = {
      hentaigana: true,
      siddham: false
    };

    await fontLoader.loadFonts(settings);  // awaitを追加

    // style要素の確認を修正
    const styleElement = fontLoader['styleElement']; // privateプロパティにアクセス
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toContain('@font-face');
    expect(styleElement?.textContent).toContain('NINJAL Hentaigana');
  });

  it('should not add same font style twice', async () => {
    const settings = {
      hentaigana: true
    };

    // 1回目のロード
    await fontLoader.loadFonts(settings);
    const isLoadedFirst = fontLoader.isFontLoaded('hentaigana');
    
    // 2回目のロード
    await fontLoader.loadFonts(settings);
    const isLoadedSecond = fontLoader.isFontLoaded('hentaigana');

    // フォントが読み込まれている状態が維持されていることを確認
    expect(isLoadedFirst).toBe(true);
    expect(isLoadedSecond).toBe(true);
    
    // loadedFontsのサイズが1のままであることを確認
    expect(fontLoader['loadedFonts'].size).toBe(1);
  });

  it('should handle font load errors', async () => {
    const settings = {
      siddham: true
    };

    const mockLink = document.createElement('link');
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(mockLink, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'error' && typeof handler === 'function') {
        handler(new Event('error'));
      }
    });

    await expect(fontLoader.loadFonts(settings)).rejects.toThrow(FontLoadError);
  });
});