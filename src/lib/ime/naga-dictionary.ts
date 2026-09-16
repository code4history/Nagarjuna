/**
 * NagaIME 用の辞書アクセス（oct26-m7-t1 設計 §3.2-2）。
 *
 * package に bundle された生成辞書（scripts/build-dictionary.ts → src/data/dictionary.ts）から
 * カテゴリ別の候補を導出する。HTTP fetch・PoC の baseUrl は持たない（offline / CSP / file:// の
 * 既存 bundle 利用を壊さない）。legacy の `<ime-ui>` と同じく動的 import で読み、同じ chunk を共有する。
 */
import type { NagaCandidate, NagaCategoryId } from './types';

export interface NagaCategoryDef {
  id: NagaCategoryId;
  label: string;
  /**
   * 幅の無いモバイル dock で使う一文字表記（是正設計 v2 §4 案 A・§6.1 ②）。
   * `label` の先頭文字で導出せず明示する（'組文字'→'組' は成立するが 'recent'→'近' は
   * 先頭文字では作れず、導出と明示が混在すると出どころが二つになるため）。
   */
  short: string;
}

/** タブの既定順（PoC と同じ）。'recent' は NagaIME 側で先頭に足す。 */
export const NAGA_CATEGORIES: readonly NagaCategoryDef[] = [
  { id: 'hentaigana', label: '変体仮名', short: '変' },
  { id: 'siddham', label: '悉曇', short: '悉' },
  { id: 'buddha', label: '仏名', short: '仏' },
  { id: 'itaiji', label: '異体字', short: '異' },
  { id: 'kumimoji', label: '組文字', short: '組' },
];

export type NagaDictionary = ReadonlyMap<NagaCategoryId, readonly NagaCandidate[]>;

let cache: Promise<NagaDictionary> | null = null;

/** 生成辞書を category ごとに分けて返す。読み込みは 1 回だけ行い、以後は同じ結果を共有する。 */
export function loadNagaDictionary(): Promise<NagaDictionary> {
  if (!cache) {
    cache = import('../../data/dictionary').then(({ dictionary }) => {
      const map = new Map<NagaCategoryId, NagaCandidate[]>();
      for (const def of NAGA_CATEGORIES) map.set(def.id, []);
      for (const entry of dictionary) {
        const bucket = map.get(entry.category);
        if (!bucket) continue;
        bucket.push({
          char: entry.char,
          reading: entry.reading,
          description: entry.description,
          category: entry.category,
        });
      }
      return map;
    });
    cache.catch(() => {
      cache = null; // 失敗したら次の呼出しで再試行できるようにする
    });
  }
  return cache;
}

const HIRAGANA_RE = /^[ぁ-んー]+$/;

/**
 * PoC と同じ検索規則:
 * - 空の検索語は先頭から maxResults 件
 * - ひらがなは読みの完全一致を前方一致より先に
 * - それ以外は説明文の部分一致または文字の完全一致
 * - 最近使った文字を先に、次に読みの短い順（安定ソート）
 */
export function searchNagaCandidates(
  entries: readonly NagaCandidate[],
  query: string,
  recentChars: ReadonlySet<string>,
  maxResults: number
): NagaCandidate[] {
  if (!query) return entries.slice(0, maxResults);

  let results: NagaCandidate[];
  if (HIRAGANA_RE.test(query)) {
    const exact: NagaCandidate[] = [];
    const prefix: NagaCandidate[] = [];
    for (const e of entries) {
      if (e.reading === query) exact.push(e);
      else if (e.reading.startsWith(query)) prefix.push(e);
    }
    results = [...exact, ...prefix];
  } else {
    results = entries.filter((e) => e.description.includes(query) || e.char === query);
  }

  return results
    .map((e) => ({ e, recent: recentChars.has(e.char) ? 0 : 1 }))
    .sort((a, b) => a.recent - b.recent || a.e.reading.length - b.e.reading.length)
    .map((x) => x.e)
    .slice(0, maxResults);
}
