import { IMEEntry, IMESearchResult, IMEError } from './internal-types';
import { IMEOptions } from './types';

interface NormalizedResult extends IMESearchResult {
  fullReading?: string;
}

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

    console.log('Current options:', this.options);

    const results = this.dictionary
      .filter(entry => {
        console.log('Checking entry:', entry);
        
        // 基本的な文字体系のフィルター
        if (!this.options.enabledTypes[entry.type as keyof IMEOptions['enabledTypes']]) {
          console.log('Filtered out by type:', entry.type);
          return false;
        }

        // 仏名のフィルター
        if (entry.isBuddhaName && !this.options.enabledTypes.buddha_name) {
          console.log('Filtered out buddha name:', entry.reading);
          return false;
        }

        return entry.reading.startsWith(reading);
      })
      .map(entry => ({
        char: entry.char,
        reading: entry.reading,
        type: entry.type
      }));

    console.log('Pre-normalized results:', results);

    // 重複を排除（短い読みを優先）
    const normalized = new Map<string, NormalizedResult>();
    
    results.forEach(result => {
      const key = result.char;
      const existing = normalized.get(key);
      
      if (!existing || existing.reading.length > result.reading.length) {
        normalized.set(key, {
          ...result,
          fullReading: existing?.fullReading || result.reading
        });
      }
    });

    const finalResults = Array.from(normalized.values());
    console.log('Final normalized results:', finalResults);
    return finalResults;
  }

  searchExact(reading: string): IMESearchResult[] {
    if (!reading) return [];

    if (!/^[ぁ-んー]*$/.test(reading)) {
      throw new IMEError('Reading must be hiragana');
    }

    const results = this.dictionary
      .filter(entry => {
        // 基本的な文字体系のフィルター
        if (!this.options.enabledTypes[entry.type as keyof IMEOptions['enabledTypes']]) {
          return false;
        }

        // 仏名のフィルター
        if (entry.isBuddhaName && !this.options.enabledTypes.buddha_name) {
          return false;
        }

        return entry.reading === reading;
      })
      .map(entry => ({
        char: entry.char,
        reading: entry.reading,
        type: entry.type
      }));

    // 重複を排除（短い読みを優先）
    const normalized = new Map<string, NormalizedResult>();
    
    results.forEach(result => {
      const key = result.char;
      const existing = normalized.get(key);
      
      if (!existing || existing.reading.length > result.reading.length) {
        normalized.set(key, {
          ...result,
          fullReading: existing?.fullReading || result.reading
        });
      }
    });

    return Array.from(normalized.values());
  }
}