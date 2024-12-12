import { describe, it, expect } from 'vitest';
import { DictionaryLoader } from '@/lib/ime/dictionary-loader';

describe('DictionaryLoader', () => {
  it('should parse dictionary entries correctly', () => {
    const testData = {
      hentaigana: [
        {
          reading: 'あ',
          character: '𛀂',
          type: '名詞',
          description: 'あの変体仮名（字母：安）'
        }
      ],
      siddham: [
        {
          reading: 'あ',
          character: '𑖀',
          type: '名詞',
          description: '胎蔵界大日如来の種子（ア、悉曇文字）'
        }
      ],
      itaiji: [
        {
          reading: 'とき',
          character: '旹',
          type: '名詞',
          description: '時の異体字'
        }
      ],
      kumimoji: [
        {
          reading: 'より',
          character: 'ゟ',
          type: '名詞',
          description: 'よりの組み文字'
        }
      ]
    };

    const entries = DictionaryLoader.parseEntries(
      testData.hentaigana,
      testData.siddham,
      testData.itaiji,
      testData.kumimoji
    );

    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({
      reading: 'あ',
      char: '𛀂',
      type: 'hentaigana'
    });
    expect(entries[3]).toEqual({
      reading: 'より',
      char: 'ゟ',
      type: 'itaiji'
    });
  });
});