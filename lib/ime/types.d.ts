/**
 * NagaIME の候補カテゴリ（タブ）。'recent'（最近使った文字）は常に先頭に付く。
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
    /** 最近使った文字を保存する localStorage のキー。null で保存しない。既定は 'nagarjuna-naga-recents'。 */
    recentStorageKey?: string | null;
    /** 最近使った文字の最大件数。既定は 14。 */
    recentMax?: number;
    /** 一度に表示する候補の最大件数。既定は 60。 */
    maxCandidates?: number;
    /** この幅（CSS px）未満の viewport ではポップアップを画面下部へドッキングする。既定は 560。 */
    dockBreakpoint?: number;
    /** FontLoader で特殊文字フォントを読み込むか。既定は true。 */
    loadFonts?: boolean;
}
/**
 * @deprecated 1.1.0 で非推奨・2.0.0 で維持・3.0.0 で削除予定。`NagaIMEOptions`（NagaIME 専用）を使用してください。
 */
export interface IMEOptions {
    enabledTypes: {
        hentaigana?: boolean;
        siddham?: boolean;
        itaiji?: boolean;
        buddha_name?: boolean;
    };
}
/**
 * @deprecated 1.1.0 で非推奨・2.0.0 で維持・3.0.0 で削除予定。`NagaIMEOptions`（NagaIME 専用）を使用してください。
 */
export interface IMEAttachOptions {
    options?: IMEOptions;
    position?: 'bottom' | 'cursor';
    /** @deprecated 1.1.0 で非推奨・3.0.0 で削除予定。対象 input / textarea の bubbles `input` event を購読してください。 */
    onChange?: (value: string) => void;
}
/**
 * @deprecated 1.1.0 で非推奨・2.0.0 で維持・3.0.0 で削除予定。`NagaIME` を使用してください。
 */
export interface IIMEManager {
    attach(element: HTMLInputElement | HTMLTextAreaElement, options?: IMEAttachOptions): void;
    detach(): void;
    /** @deprecated 1.1.0 で非推奨・3.0.0 で削除予定。 */
    updateOptions(options: IMEOptions): void;
}
