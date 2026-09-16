import { NagaIMEOptions } from './types';
type NagaTarget = HTMLInputElement | HTMLTextAreaElement;
export declare class NagaIME {
    private readonly options;
    private readonly uid;
    private readonly fontLoader;
    private readonly fields;
    private dictionary;
    private recents;
    private target;
    private activeTab;
    private candidates;
    private selectedIndex;
    private composing;
    private openState;
    private openSeq;
    /** 下部ドッキング中か（`.naga-is-docked` と対。dock 限定の振る舞いの唯一の判定源・設計 §6.2-3）。 */
    private docked;
    private trigger;
    private popup;
    private tabsEl;
    private searchEl;
    private listEl;
    private globalCleanup;
    constructor(options?: NagaIMEOptions);
    /** ポップアップが開いているか。 */
    get isOpen(): boolean;
    /** セレクタ、要素、または要素の列に取り付ける。input / textarea 以外は無視する。 */
    attach(target: string | Element | ArrayLike<Element> | Iterable<Element>): void;
    /** 指定要素（省略時はすべて）から取り外す。取り付け先が無くなれば DOM と listener も片付ける。 */
    detach(target?: string | Element | ArrayLike<Element> | Iterable<Element>): void;
    /** すべての取り付けを外し、DOM と listener を片付ける。 */
    destroy(): void;
    toggle(field: NagaTarget): Promise<void>;
    open(field: NagaTarget): Promise<void>;
    close({ refocus }?: {
        refocus?: boolean;
    }): void;
    private ensureDom;
    private teardownDom;
    private bindField;
    private showTrigger;
    private positionTrigger;
    private currentEntries;
    private refresh;
    private renderTabs;
    /**
     * タブの表示名を `docked` と `activeTab` から冪等に決める（設計 §6.1 ②）。
     * dock 時は非選択タブを一文字にして、タブ帯を 1 行に収める（案 A）。
     * PC（non-docked）は常に正式名称で、既存の見た目を変えない。
     * 呼び出し元は renderTabs()（選択が変わるとき）と setDocked()（dock 遷移のとき）の 2 つだけ。
     */
    private applyTabLabels;
    /** dock 状態の遷移を 1 か所で扱う（変化したときだけ表示名を作り直す）。 */
    private setDocked;
    private renderList;
    private onSearchKeydown;
    private commit;
    private positionPopup;
    /** キャレット座標の計測（ミラー要素方式）。 */
    private measureCaret;
    private loadRecents;
    private pushRecent;
}
export {};
