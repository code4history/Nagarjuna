/**
 * NagaIME の公開の型（`@c4h/nagarjuna/ime` から export する。1.2.0 で公開）。
 *
 * 旧 IME（`IMEManager` 系）の公開型の置き場である types.ts とは分けて、NagaIME の型をここに置く。
 * 分けた位置は変えない（1.2.0 の公開は src/ime.ts からの再 export で行う）。
 */
/**
 * NagaIME の候補カテゴリ（タブ）。'recent'（最近使った文字）は先頭に付く（recentMax が 0 のときは付かない）。
 */
export type NagaCategoryId = 'hentaigana' | 'siddham' | 'buddha' | 'itaiji' | 'kumimoji';
/** NagaIME が挿入する候補 1 件。 */
export interface NagaCandidate {
    /** 挿入される文字列 */
    char: string;
    /** ひらがなの読み */
    reading: string;
    /** 説明文（説明文検索の対象） */
    description: string;
    /** 候補のカテゴリ */
    category: NagaCategoryId;
}
/** `new NagaIME(options)` のオプション。すべて省略可能。 */
export interface NagaIMEOptions {
    /** 表示するカテゴリタブと順序。既定は全カテゴリ（変体仮名・悉曇・仏名・異体字・組文字）。 */
    categories?: NagaCategoryId[];
    /** 起動ボタンに表示する文字。既定は '梵'。 */
    triggerLabel?: string;
    /** Ctrl+J / Cmd+J で開閉するか。既定は true。 */
    shortcut?: boolean;
    /**
     * 最近使った文字を保存する localStorage のキー。既定は 'nagarjuna-naga-recents'。
     * null で保存も読み出しもしない（「最近」タブは要素の中だけで働く）。
     */
    recentStorageKey?: string | null;
    /** 最近使った文字の最大件数（0 以上の整数）。既定は 14。0 で「最近」タブを持たず、localStorage を読みも書きもしない。 */
    recentMax?: number;
    /** 一度に表示する候補の最大件数。既定は 60。 */
    maxCandidates?: number;
    /** この幅（CSS px）未満の viewport ではポップアップを画面下部へドッキングする。既定は 560。 */
    dockBreakpoint?: number;
    /** FontLoader で特殊文字フォントを読み込むか。既定は true。 */
    loadFonts?: boolean;
}
/** `<naga-ime>` が出すイベント（すべて CustomEvent・bubbles: true・composed: false・cancelable: false）。 */
export interface NagaIMEEventMap {
    /** popup が開いた後 */
    nagaOpen: CustomEvent<{
        field: HTMLInputElement | HTMLTextAreaElement;
    }>;
    /** popup が閉じた後 */
    nagaClose: CustomEvent<{
        field: HTMLInputElement | HTMLTextAreaElement | null;
    }>;
    /** 候補を欄へ入れ、欄の input を出した後（candidate は複製） */
    nagaCommit: CustomEvent<{
        field: HTMLInputElement | HTMLTextAreaElement;
        candidate: NagaCandidate;
    }>;
}
