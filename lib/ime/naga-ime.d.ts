import { NagaCategoryId, NagaIMEEventMap, NagaIMEOptions } from './naga-types';
type NagaTarget = HTMLInputElement | HTMLTextAreaElement;
type AttachTarget = string | Element | ArrayLike<Element> | Iterable<Element>;
export declare class NagaIME extends HTMLElement {
    static get observedAttributes(): string[];
    private cfgFor;
    private cfgCategories;
    private cfgTriggerLabel;
    private cfgShortcut;
    private cfgRecentStorageKey;
    private cfgRecentMax;
    private cfgMaxCandidates;
    private cfgDockBreakpoint;
    private cfgLoadFonts;
    private readonly uid;
    private readonly root;
    private fontLoader;
    private readonly fields;
    private dictionary;
    private recents;
    /** recents を localStorage から読んだか（読むのは最初の open まで遅らせる。§5.3 規則 6） */
    private recentsLoaded;
    private target;
    private activeTab;
    private candidates;
    private selectedIndex;
    private composing;
    private openState;
    private openSeq;
    /** 下部ドッキング中か（`.naga-is-docked` と対。dock 限定の振る舞いの唯一の判定源・設計 §6.2-3）。 */
    private docked;
    /** 畳んでいるか（人間の操作でだけ変わる。閉じても・dock でなくなっても保つ。§3.3） */
    private folded;
    /**
     * 【NOV26-IM-NAGA-POPUP-REFOCUS-0436】いま NagaIME 自身が欄へ focus を戻している最中か。
     *
     * popup を開いたまま欄へ focus が戻ったら popup を閉じる（実機の「フォーカスを戻して入力すると
     * 連携しない」「改行するとカーソルが IME の下に回り込む」への対応）。ただし NagaIME 自身が
     * focus を戻す経路（close({ refocus: true }) の欄への戻し）でも focus が飛ぶ ∴ それで閉じると
     * 閉じた直後の連続入力が壊れる。ポインタの操作（pointerdown / touchstart / mousedown）は
     * 利用者のものだけなので区別が要らず、**focus だけで戻る経路（キーボードの Tab・IME の確定）**
     * だけをこの印で見分ける。focus() は同期的に focus イベントを出すので、呼び出しの前後で
     * 立てて降ろせば足りる（タイマーは使わない）。
     */
    private selfFocus;
    /** この open で「可視域に収めるための 1 回のスクロール」を済ませたか（0434。開くたびに戻す）。 */
    private dockScrollDone;
    /** 初回の connectedCallback を終えたか（昇格中の attributeChangedCallback で for を引かない） */
    private initialized;
    private pendingForLookup;
    private trigger;
    private popup;
    private tabsEl;
    private searchEl;
    private listEl;
    private searchRowEl;
    /** 挿入位置の縦棒（0437。popup を開いている間だけ見える）。 */
    private caretMarkEl;
    /** 確定した文字だけを読み上げる visually-hidden の live region（0437。写しの aria-live の代替）。 */
    private liveEl;
    private foldEl;
    private globalCleanup;
    /** 起動ボタンの置き直しの購読を外す関数（購読していないときは null）。 */
    private triggerCleanup;
    /** 置き直しを間引く rAF の id（0 は予約していない）。 */
    private triggerRaf;
    /** popup の置き直しの購読を外す関数（開いていないときは null）。0432 */
    private popupCleanup;
    /** popup の置き直しを間引く rAF の id（0 は予約していない）。0432 */
    private popupRaf;
    constructor(options?: NagaIMEOptions);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    /**
     * 取り付ける欄の id（空白区切り）。id は要素の root（`getRootNode()`。影の中に置けばその影の中）で引く。
     * 接続時と、文書の読込中なら DOMContentLoaded 時に引く。後から足された欄は `attach()` で付ける。
     * `<label>.htmlFor` と違い、代入は `for` 属性を変えない。
     */
    get htmlFor(): string;
    set htmlFor(value: string);
    /** 表示するカテゴリタブと順序。既定は全カテゴリ。読み出しは複製。 */
    get categories(): NagaCategoryId[];
    set categories(value: NagaCategoryId[]);
    /** 起動ボタンに表示する文字。既定は '梵'。 */
    get triggerLabel(): string;
    set triggerLabel(value: string);
    /** Ctrl+J / Cmd+J で開閉するか。既定は true。 */
    get shortcut(): boolean;
    set shortcut(value: boolean);
    /** 最近使った文字を保存する localStorage のキー。null で保存も読み出しもしない。 */
    get recentStorageKey(): string | null;
    set recentStorageKey(value: string | null);
    /** 最近使った文字の最大件数。0 で「最近」タブを持たず、localStorage を読みも書きもしない。 */
    get recentMax(): number;
    set recentMax(value: number);
    /** 一度に表示する候補の最大件数。既定は 60。 */
    get maxCandidates(): number;
    set maxCandidates(value: number);
    /** この幅（CSS px）未満の viewport ではポップアップを画面下部へドッキングする。既定は 560。 */
    get dockBreakpoint(): number;
    set dockBreakpoint(value: number);
    /** FontLoader で特殊文字フォントを読み込むか。既定は true。次の `attach()` から効く。 */
    get loadFonts(): boolean;
    set loadFonts(value: boolean);
    /** ポップアップが開いているか。 */
    get isOpen(): boolean;
    private setFor;
    private setCategories;
    private setTriggerLabel;
    private setRecentStorageKey;
    private setRecentMax;
    /**
     * セレクタ、要素、または要素の列に取り付ける。input / textarea 以外は無視する。
     * 文字列は `document.querySelectorAll` で引く。影の中の欄は Element を渡すか、
     * 同じ影の中に置いた `<naga-ime for>` を使う。要素が未接続なら `document.body` の末尾へ入れる。
     */
    attach(target: AttachTarget): void;
    /** 指定要素（省略時はすべて）から取り外す。取り付け先が無くなれば DOM と listener も片付ける。 */
    detach(target?: AttachTarget): void;
    /** すべての取り付けを外し、DOM と listener を片付け、要素を DOM から外す。 */
    destroy(): void;
    private bindAll;
    /** `for` の id を要素の root で引き直す。`for` で付けた欄だけを付け直す（§5.4）。 */
    private resolveFor;
    private unbindField;
    toggle(field: NagaTarget): Promise<void>;
    open(field: NagaTarget): Promise<void>;
    close({ refocus }?: {
        refocus?: boolean;
    }): void;
    /**
     * 【0436】NagaIME 自身の都合で欄へ focus を戻す（利用者の操作と区別する印を立てる）。
     * focus イベントはこの呼び出しの中で同期的に届くので、戻った時点で印を降ろす。
     */
    private focusFieldSelf;
    private emit;
    private ensureDom;
    /** タブを作り直す（categories・recentMax の変更と DOM の構築時）。選択と dock の表示名は保つ。 */
    private rebuildTabs;
    private teardownDom;
    private bindField;
    private showTrigger;
    /** 起動ボタンを隠す（置き直しの購読も外す）。 */
    private hideTrigger;
    /**
     * 文書の座標を、要素の包含ブロック（`offsetParent`）の padding box を原点とする座標へ直す量を返す。
     * 包含ブロックが文書（初期包含ブロック）なら補正しない（0 を返す）。
     *
     * `<naga-ime>` の host と `.naga-root` は `display: contents`（naga-styles.ts）で箱を作らず、その間に
     * position を持つ祖先も無ければ包含ブロックは文書になる ∴ ふつうは補正が要らない。
     * 利用者が `<naga-ime>` を position 付きの要素の中に置いた場合だけ、その要素の矩形とスクロール量を
     * 引く（absolute の基準は padding box なので border の幅も引く）。
     * `position: fixed` の祖先の中に置かれた場合は対象外（そのときは要素も画面に固定され、
     * ページのスクロールには追随しない）。
     *
     * 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】で起動ボタンのために書き、【0432】で popup と共通にした。
     */
    private containingBlockOffset;
    /** 文書の座標の top / left を要素の style に書く（包含ブロックが文書でなければ補正する）。 */
    private placeInDocument;
    /** 文書の可視幅（初期包含ブロックの幅。スクロールバーの分は含めない）。0432 */
    private documentWidth;
    /**
     * 起動ボタンを欄の右上に置く（`position: absolute`。top/left は文書の座標）。
     *
     * 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】0426 では fixed（layout viewport 基準）で置き、
     * scroll のたびに座標を計算し直していた。実機の iPhone では、キーボードを出したままスクロールすると
     * ボタンが欄から離れて「明後日の場所」に出て、欄とは違う速さで通り過ぎ、欄が画面外に出ると
     * 可視域の端に貼り付いた（fixed を JS で visual viewport に追随させるかぎり、iOS の可視域とはずれる）。
     * ∴ ボタンは文書の座標で置く。ページのスクロールはブラウザが本文と一緒に動かすので、
     * スクロールでの置き直しは要らず、`visualViewport` の offset は位置に使わない。
     *
     * 包含ブロックの補正は `containingBlockOffset()`（0432 で popup と共通にした）。
     *
     * 欄の上が文書の先頭より上（top < 0）になるなら欄のすぐ下へ回す。それ以外の clamp はしない
     * （可視域の端へ貼り付けない）。横に溢れる（欄の右端が画面より左）ときだけ、左端を可視域の
     * 左端＋余白に留める。
     */
    private positionTrigger;
    /**
     * 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】起動ボタンが見えている間だけ、置き直しの購読を張る（見えなければ外す）。
     *
     * ボタンは文書の座標で置くので、ページのスクロール（window・visualViewport とも）では置き直さない
     * —— ブラウザが本文と一緒に動かす。欄の位置が変わるのは resize（キーボードの出入り・回転・窓の大きさ）
     * ∴ そこだけ購読する。欄の中身やフォントの適用でレイアウトが変わる場合に備えて、focus の直後に
     * 1 回だけ置き直す（購読ではない）。同じフレームに何度届いても置き直しは 1 回に間引く。
     */
    private syncTriggerTracking;
    /** 次のフレームで 1 回だけ置き直す（同じフレームに何度呼ばれても 1 回）。 */
    private requestTriggerPosition;
    private stopTriggerTracking;
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
    /** 畳む／開く（人間の操作でだけ呼ぶ）。開くときは読み欄へ戻す（タップの中なのでソフトキーボードが出る）。 */
    private toggleFold;
    /** 畳んだ状態を見た目へ出す。dock でないとき（PC）は出さない（状態は保つ）。 */
    private applyFold;
    private renderList;
    /**
     * 選んだ候補が一覧の見える範囲に入るよう、一覧（this.listEl）の scrollTop だけを動かす（M-1・MIN-1）。
     * 要素を画面へ寄せる DOM の API は使わない（スクロールできる祖先すべて＝ページの viewport も動かしうる）。
     */
    private revealInList;
    private onSearchKeydown;
    private commit;
    /**
     * popup を文書の座標で置く。
     *
     * 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】0431 まで狭幅（dock）は `position: fixed` で画面の下に据え付け、
     * `bottom` を visualViewport の offset から計算し、ページのスクロールのたびに置き直していた。実機の
     * iPhone ではキーボード表示中は fixed が visual viewport とずれ、スクロールやキーボードの出入りで
     * popup が欄と無関係に「ふわふわ」動いた（起動ボタンと同じ種類の不具合）。
     * ∴ 起動ボタンと同じく文書の座標（`position: absolute`）で置く。
     * - 狭幅: キャレットの行のすぐ下（0434。キャレットを測れない欄では欄のすぐ下 ＋ 4。0432）、横は文書の
     *   可視幅いっぱい。ページのスクロールはブラウザが本文と一緒に動かすので置き直さない。
     *   読み欄に focus が移ると iOS がその欄をキーボードの上へスクロールして見せる ∴ 画面の下に
     *   据え付ける必要は無い。高さの上限は「キャレットの行の下からキーボードの上まで」。
     * - 広幅（PC）: キャレットの行の下。可視域の下端（`scrollY + innerHeight`）に入らなければ上に出す。
     *
     * visualViewport の値を高さの上限にだけ使う（位置の座標には offset を使わない）。
     * 包含ブロックの補正は `containingBlockOffset()`（起動ボタンと同じ関数）。
     */
    private positionPopup;
    /**
     * 【NOV26-IM-NAGA-CARET-MARK-0437】popup を開いている間、元の欄の挿入位置に縦棒を置く。
     *
     * popup を開くと focus が読み欄へ移り、元の欄のキャレットが見えなくなる（人間の提案
     * 「IME の表示中はキャレットを目立つように変える」）。縦棒は popup・梵ボタンと同じく
     * `position: absolute` の文書座標で置く（placeInDocument で offsetParent を補正する）。
     * - 置き直すのは positionPopup() と同じ契機（resize・開いた直後・スクロールコンテナ要素の scroll）と、
     *   確定で欄の値・selectionStart が変わった直後（commit が positionPopup を呼ぶ）。
     *   ページのスクロールでは置き直さない（ブラウザが本文と一緒に動かす）。
     * - textarea の内部スクロール（scrollTop）は measureCaret が引いた値を返す ∴ そのまま使う。
     *   キャレットの行が欄の可視範囲の外なら隠す。
     * - type="password" の欄・measureCaret が失敗したとき（anchor が null）は出さない。
     */
    private placeCaretMark;
    /**
     * 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup を開いている間だけ、置き直しの購読を張る（閉じたら外す）。
     *
     * popup は起動ボタンと同じく文書の座標で置くので、ページのスクロール（window・visualViewport とも）では
     * 置き直さない —— ブラウザが本文と一緒に動かす。欄や popup の位置が変わるのは
     * resize（キーボードの出入り・回転・窓の大きさ。ensureDom の購読が拾う）と、欄が overflow の
     * スクロールコンテナの中にあるときのその要素のスクロール ∴ そこだけ購読する。
     * 開いた直後の 1 回は focus やフォントの適用でレイアウトが変わる場合に備える（購読ではない）。
     * 同じフレームに何度届いても置き直しは 1 回に間引く。
     */
    private syncPopupTracking;
    /** 次のフレームで 1 回だけ置き直す（同じフレームに何度呼ばれても 1 回）。 */
    private requestPopupPosition;
    private stopPopupTracking;
    /**
     * キャレット座標の計測（ミラー要素方式・viewport の座標）。ミラーは影の中の `.naga-root`
     * （継承を断った箱）に置く。document.body に置くとページの CSS（`text-align` の継承・
     * `div { all: unset }` 等）に写した値を上書きされる（nov26-m3-t1 の R-popup の dx）。
     */
    private measureCaret;
    /** localStorage から読み直す。recentStorageKey が null か recentMax が 0 なら読まない。 */
    private reloadRecents;
    private pushRecent;
}
/** `<naga-ime>` のイベントの型（`addEventListener('nagaCommit', e => e.detail…)`）。 */
export interface NagaIME {
    addEventListener<K extends keyof NagaIMEEventMap>(type: K, listener: (this: NagaIME, ev: NagaIMEEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: NagaIME, ev: HTMLElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof NagaIMEEventMap>(type: K, listener: (this: NagaIME, ev: NagaIMEEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: NagaIME, ev: HTMLElementEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'naga-ime': NagaIME;
    }
}
export {};
