import { IMEEntry } from './internal-types';

interface RawDictionaryEntry {
  reading: string;    // 読み
  character: string;  // 変換後の文字
  type: string;      // 品詞（実際は "名詞" 固定）
  description: string; // 説明
}

export class DictionaryLoader {
  /**
   * 生のデータファイルからIMEエントリーを生成
   */
  static parseEntries(
    hentaigana: RawDictionaryEntry[],
    siddham: RawDictionaryEntry[],
    itaiji: RawDictionaryEntry[],
    kumimoji: RawDictionaryEntry[]
  ): IMEEntry[] {
    return [
      ...this.convertHentaigana(hentaigana),
      ...this.convertSiddham(siddham),
      ...this.convertItaiji(itaiji),
      ...this.convertKumimoji(kumimoji)
    ];
  }

  private static convertHentaigana(entries: RawDictionaryEntry[]): IMEEntry[] {
    return entries.map(entry => ({
      reading: entry.reading,
      char: entry.character,
      type: 'hentaigana' as const,
      isBuddhaName: false
    }));
  }

  private static convertSiddham(entries: RawDictionaryEntry[]): IMEEntry[] {
    return entries.map(entry => ({
      reading: entry.reading,
      char: entry.character,
      type: 'siddham' as const,
      isBuddhaName: false
    }));
  }

  private static convertItaiji(entries: RawDictionaryEntry[]): IMEEntry[] {
    return entries.map(entry => ({
      reading: entry.reading,
      char: entry.character,
      type: 'itaiji' as const,
      isBuddhaName: false
    }));
  }

  private static convertKumimoji(entries: RawDictionaryEntry[]): IMEEntry[] {
    return entries.map(entry => ({
      reading: entry.reading,
      char: entry.character,
      type: 'itaiji' as const,
      isBuddhaName: false
    }));
  }
}