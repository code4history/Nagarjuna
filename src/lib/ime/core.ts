import { IMEEntry, IMEOptions, IMESearchResult, IMEError } from './types';

export class IMECore {
  private dictionary: IMEEntry[] = [];
  private options: IMEOptions;

  constructor(options: IMEOptions = { enabledTypes: {} }) {
    this.options = options;
  }

  setDictionary(entries: IMEEntry[]): void {
    this.dictionary = entries;
  }

  updateOptions(options: IMEOptions): void {
    this.options = options;
  }

  search(reading: string): IMESearchResult[] {
    if (!reading) return [];

    if (!/^[ぁ-んー]*$/.test(reading)) {
      throw new IMEError('Reading must be hiragana');
    }

    return this.dictionary
      .filter(entry => {
        // ここでenabledTypesのチェックが問題かもしれない
        if (!this.options.enabledTypes[entry.type]) return false;
        return entry.reading.startsWith(reading);
      })
      .map(entry => ({
        char: entry.char,
        reading: entry.reading,
        type: entry.type
      }));
  }

  searchExact(reading: string): IMESearchResult[] {
    if (!reading) return [];

    if (!/^[ぁ-んー]*$/.test(reading)) {
      throw new IMEError('Reading must be hiragana');
    }

    return this.dictionary
      .filter(entry => {
        if (!this.options.enabledTypes[entry.type]) return false;
        return entry.reading === reading;
      })
      .map(entry => ({
        char: entry.char,
        reading: entry.reading,
        type: entry.type
      }));
  }
}