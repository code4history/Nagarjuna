import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FontLoader } from '@/lib/fonts/loader';
import { FontLoadError } from '@/lib/fonts/types';

describe('FontLoader', () => {
  let fontLoader: FontLoader;

  beforeEach(() => {
    fontLoader = new FontLoader();
    // DOMの初期化
    document.head.innerHTML = '';
  });

  it('should load fonts based on settings', async () => {
    const settings = {
      hentaigana: true,
      siddham: true
    };

    await fontLoader.loadFonts(settings);

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

    await fontLoader.loadFonts(settings);
    await fontLoader.loadFonts(settings);

    const links = document.head.getElementsByTagName('link');
    expect(links).toHaveLength(1);
  });

  it('should handle font load errors', async () => {
    const settings = {
      hentaigana: true
    };

    // リンク要素の生成と追加をモック
    const mockLink = document.createElement('link');
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

    // Promise.rejectで非同期的にエラーを発生させる
    setTimeout(() => {
      mockLink.dispatchEvent(new ErrorEvent('error'));
    }, 0);

    await expect(fontLoader.loadFonts(settings)).rejects.toThrow(FontLoadError);
  });
});