import { IMEType } from "./internal-types";

export interface DictionaryFileConfig {
  filename: string;
  type: IMEType;
  requirements?: IMEType[];  // 必要な追加オプション
}
  
export const DICTIONARY_FILES: DictionaryFileConfig[] = [
  {
    filename: 'hentai_kana_IME.txt',
    type: 'hentaigana'
  },
  {
    filename: 'kanji_itaiji_IME.txt',
    type: 'itaiji'
  },
  {
    filename: 'kumimoji_IME.txt',
    type: 'itaiji'
  },
  {
    filename: 'siddham_phonetic_IME.txt',
    type: 'siddham'
  },
  {
    filename: 'siddham_buddha_IME.txt',
    type: 'siddham',
    requirements: ['buddha_name']  // このファイルは buddha_name オプションが必要
  }
];