import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FontLoader } from '@/lib/fonts/loader';
import { FontLoadError } from '@/lib/fonts/types';

describe('FontLoader', () => {
  let fontLoader: FontLoader;

  beforeEach(() => {
    fontLoader = new FontLoader();
    document.head.innerHTML = '';
    
    // 非同期処理をモック化
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load fonts based on settings', () => {
    const settings = {
      hentaigana: true,
      siddham: true
    };

    fontLoader.loadFonts(settings);

    const links = document.head.getElementsByTagName('link');
    expect(links).toHaveLength(2);
    expect(links[0].href).toContain('notohentaigana.css');
    expect(links[1].href).toContain('Noto+Sans+Siddham');
  });

  it('should generate correct font-family string', () => {
    const settings = {
      hentaigana: true,
      siddham: true,
      itaiji: false
    };

    const fontFamily = fontLoader.getFontFamilyString(settings);
    expect(fontFamily).toBe('Noto Hentaigana, Noto Sans Siddham, serif');
  });

  it('should not load same font twice', async () => {
    const settings = {
      hentaigana: true
    };

    // モックでloadイベントを即時発火
    const mockLink = document.createElement('link');
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(mockLink, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'load' && typeof handler === 'function') {
        handler(new Event('load'));
      }
    });

    await fontLoader.loadFonts(settings);
    await fontLoader.loadFonts(settings);

    const links = document.head.getElementsByTagName('link');
    expect(links).toHaveLength(1);
  });

  it('should throw FontLoadError when loading fails', async () => {
    const settings = {
      hentaigana: true
    };

    // モックでerrorイベントを即時発火
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