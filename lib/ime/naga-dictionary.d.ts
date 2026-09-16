import { NagaCandidate, NagaCategoryId } from './types';
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
export declare const NAGA_CATEGORIES: readonly NagaCategoryDef[];
export type NagaDictionary = ReadonlyMap<NagaCategoryId, readonly NagaCandidate[]>;
/** 生成辞書を category ごとに分けて返す。読み込みは 1 回だけ行い、以後は同じ結果を共有する。 */
export declare function loadNagaDictionary(): Promise<NagaDictionary>;
/**
 * PoC と同じ検索規則:
 * - 空の検索語は先頭から maxResults 件
 * - ひらがなは読みの完全一致を前方一致より先に
 * - それ以外は説明文の部分一致または文字の完全一致
 * - 最近使った文字を先に、次に読みの短い順（安定ソート）
 */
export declare function searchNagaCandidates(entries: readonly NagaCandidate[], query: string, recentChars: ReadonlySet<string>, maxResults: number): NagaCandidate[];
