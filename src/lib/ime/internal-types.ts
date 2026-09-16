import type { NagaCategoryId } from './types';

export type IMEType = 
  | 'hentaigana' 
  | 'siddham' 
  | 'itaiji' 
  | 'buddha_name';

export interface IMEEntry {
  reading: string;
  char: string;
  type: IMEType;
  isBuddhaName: boolean;
}

/**
 * 生成辞書（src/data/dictionary.ts）の 1 件。legacy の IMEEntry の field をそのまま持ち、
 * NagaIME 用の説明文とカテゴリを追加で持つ（legacy の IMECore はこれらを読まない）。
 */
export interface NagaDictionaryEntry extends IMEEntry {
  description: string;
  category: NagaCategoryId;
}

export interface IMESearchResult {
  char: string;
  reading: string;
  type: IMEType;
}

export class IMEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IMEError';
  }
}