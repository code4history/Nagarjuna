/**
 * NagaIME — トリガー式の特殊文字入力ポップアップ（oct26-m7-t1 設計 §3.2-1、
 * nov26-m3-t2 で custom element `<naga-ime>`＋open Shadow DOM に包み直した）。
 *
 * PoC（Playground/NextNaga/js/naga-ime.js）の UX を TypeScript 化したもの。
 *  - 常駐しない。対象にフォーカスすると小さな起動ボタンが出るだけ。
 *  - 起動はボタン押下または Ctrl/Cmd+J の明示操作のみ。
 *  - 起動中もシステム IME の変換（composition）には介入しない。
 *  - 確定は Enter / Tab / クリック / 数字キー、取消は Esc。
 *  - 確定文字は setRangeText() でキャレット位置に挿入し、欄へ InputEvent（composed）を出す。
 *  - 確定してもポップアップは閉じない（連続入力）。
 *  - 直近使用を localStorage に保持し、次回は「最近」タブから開く。
 *  - PC はキャレットの少し下（viewport 基準の fixed）、狭い viewport では画面下部へドッキングする。
 *
 * 要素の形（マイルストーン設計 nov26-m3 §5）:
 *  - `new NagaIME(options)` でも `<naga-ime>` でも同じものができる。モジュールの評価で `naga-ime` を登録する。
 *    別の実装が登録済みなら上書きせず何も出さない。そのときこのクラスの `new` は TypeError を投げる。
 *  - trigger・popup・スタイルは影の中に置く。document.head に `<style>` を入れない。
 *  - 属性 → プロパティの一方向。プロパティへの代入は属性を変えない。不正な値は黙って既定値にする。
 *  - console.warn を出さない（登録の衝突も・不正な属性値や代入も）。legacy の非推奨警告も呼ばない。
 *
 * PoC との意図的な差分:
 *  - 辞書は fetch せず package bundle を使う（naga-dictionary.ts）。`baseUrl` は無い。
 *  - 書体は FontLoader で読む。`window.nagaIME` は公開しない（demo 専用だったため）。
 *  - DOM の class はすべて `naga-` 接頭辞、id と aria-controls はインスタンス固有。
 *  - detach / destroy で DOM と listener を片付ける。候補は textContent で描画する。
 *  - 対象の inline fontFamily は空のときだけ設定し、detach では自分の値のままなら空へ戻す（§3.1）。
 */
import { FontLoader } from '../fonts/loader';
import { fontFamilies } from '../fonts/styles';
import type { FontSettings } from '../fonts/types';
import type { NagaCandidate, NagaCategoryId, NagaIMEEventMap, NagaIMEOptions } from './naga-types';
import { NAGA_CATEGORIES, loadNagaDictionary, searchNagaCandidates, type NagaDictionary } from './naga-dictionary';
import { NAGA_STYLE_ATTRIBUTE, NAGA_STYLE_TEXT } from './naga-styles';

type NagaTarget = HTMLInputElement | HTMLTextAreaElement;
type TabId = NagaCategoryId | 'recent';
type AttachTarget = string | Element | ArrayLike<Element> | Iterable<Element>;

const TAG_NAME = 'naga-ime';
const DEFAULT_RECENT_KEY = 'nagarjuna-naga-recents';
const DEFAULT_TRIGGER_LABEL = '梵';
const DEFAULT_RECENT_MAX = 14;
const DEFAULT_MAX_CANDIDATES = 60;
const DEFAULT_DOCK_BREAKPOINT = 560;
const SEARCH_PLACEHOLDER = 'よみを入力（例: あ / とき）';
const SEARCH_LABEL = '読み';
const SEARCH_ARIA_LABEL = '読みを入力';
const RECENT_LABEL = '最近';
const RECENT_SHORT = '近';
const TRIGGER_SIZE_PX = 26;
/** 起動ボタンと欄の間隔（上下とも）。 */
const TRIGGER_GAP_PX = 4;
/** 起動ボタンが横にはみ出すときに、可視域の左端から空ける余白（0430: 縦の clamp はしない）。 */
const TRIGGER_MARGIN_PX = 4;
/** 狭幅の popup を欄のすぐ下に付けるときの間隔（0432）。 */
const POPUP_GAP_PX = 4;
const FONT_SETTINGS: FontSettings = { hentaigana: true, siddham: true, itaiji: true };
const ALL_CATEGORIES: readonly NagaCategoryId[] = NAGA_CATEGORIES.map((c) => c.id);
const CATEGORY_IDS = new Set<string>(ALL_CATEGORIES);

/*
 * モバイル dock の割り付け（nov26-m3-t3 タスク設計 §3.1）。下の定数が「dock 時の寸法」の唯一の出どころである
 * （CSS 側には --naga-dock-max 未設定時のフォールバックしか置かない）。静的な vh には依存しない。
 * 位置は文書の座標（欄のすぐ下。0432）。
 *   avail    = vvAvail − DOCK_GAP_PX − 欄の高さ
 *   popupMax = min(DOCK_POPUP_MAX_PX, avail)
 *   popupMax < DOCK_MIN_PX なら min(DOCK_MIN_PX, avail)               // 候補 1 行を優先。可視の領域は超えない
 *   畳んでいるときは DOCK_FOLDED_PX
 */
/** タイトル行（タブ・畳むボタン・閉じるボタン）。 */
const DOCK_TITLE_PX = 34;
/** 挿入先の写しの行。 */
const DOCK_COPY_PX = 22;
/** 読み欄の行（外余白 3px×2 を含む。font-size 16px で iOS の自動ズームを避ける）。 */
const DOCK_SEARCH_PX = 36;
/** 候補 1 行の高さ（タップの的の大きさ）。 */
const DOCK_ROW_PX = 44;
/** dock 時に同時に見せる候補の上限。 */
const DOCK_ROWS = 3;
/** popup の上下の枠（上端のアクセントの線 2px・下は無し）。 */
const DOCK_BORDER_PX = 2;
/** キーボード上端（可視領域の下端）との間隔。 */
const DOCK_GAP_PX = 8;
/** 畳んでも残る固定部分 ＋ 読み欄 = 94px。 */
const DOCK_FIXED_PX = DOCK_TITLE_PX + DOCK_COPY_PX + DOCK_SEARCH_PX + DOCK_BORDER_PX;
/** 候補が 1 行まるごと見える下限 = 138px。 */
const DOCK_MIN_PX = DOCK_FIXED_PX + DOCK_ROW_PX;
/** popup の高さの上限 = 226px。 */
const DOCK_POPUP_MAX_PX = DOCK_FIXED_PX + DOCK_ROW_PX * DOCK_ROWS;
/** 畳んだ高さ（タイトル行＋写しの行＋枠）= 58px。 */
const DOCK_FOLDED_PX = DOCK_TITLE_PX + DOCK_COPY_PX + DOCK_BORDER_PX;
/** 写しの行に出すキャレットの直前の文字数。 */
const COPY_MAX_CHARS = 12;

/** 属性名 → プロパティ名（大文字の前で区切り `-` でつなぐ機械変換。`for` だけは DOM の前例どおり `htmlFor`）。 */
const ATTRIBUTE_TO_PROPERTY = {
  for: 'htmlFor',
  categories: 'categories',
  'trigger-label': 'triggerLabel',
  shortcut: 'shortcut',
  'recent-storage-key': 'recentStorageKey',
  'recent-max': 'recentMax',
  'max-candidates': 'maxCandidates',
  'dock-breakpoint': 'dockBreakpoint',
  'load-fonts': 'loadFonts',
} as const;

type ObservedAttribute = keyof typeof ATTRIBUTE_TO_PROPERTY;

/** 昇格前に代入されうるプロパティ（upgrade property。§5.3 末尾）。 */
const UPGRADE_PROPERTIES = [
  'htmlFor',
  'categories',
  'triggerLabel',
  'shortcut',
  'recentStorageKey',
  'recentMax',
  'maxCandidates',
  'dockBreakpoint',
  'loadFonts',
] as const;

/* ------------------------------------------------------------ *
 * 値の解釈（属性の経路と代入の経路の両方から呼ぶ。不正な値は undefined＝既定値）
 * ------------------------------------------------------------ */

function boolFromAttribute(value: string | null, name: string): boolean | undefined {
  if (value === null) return undefined;
  if (value === '' || value === 'true' || value === name) return true;
  if (value === 'false') return false;
  return undefined;
}

function boolFromProperty(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function intFromNumber(value: number, min: number): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  const n = Math.floor(value);
  return n >= min ? n : undefined;
}

function intFromAttribute(value: string | null, min: number): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  return intFromNumber(Number(value), min);
}

function intFromProperty(value: unknown, min: number): number | undefined {
  return typeof value === 'number' ? intFromNumber(value, min) : undefined;
}

function stringFromValue(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** 既知のカテゴリだけを、最初に出た順で重複なく取る。有効なものが 0 個なら全カテゴリ。 */
function normalizeCategories(values: readonly unknown[]): NagaCategoryId[] {
  const out: NagaCategoryId[] = [];
  for (const v of values) {
    if (typeof v === 'string' && CATEGORY_IDS.has(v) && !out.includes(v as NagaCategoryId)) out.push(v as NagaCategoryId);
  }
  return out.length ? out : [...ALL_CATEGORIES];
}

function categoriesFromAttribute(value: string | null): NagaCategoryId[] {
  return normalizeCategories(value === null ? [] : value.split(/\s+/));
}

function categoriesFromProperty(value: unknown): NagaCategoryId[] {
  return normalizeCategories(Array.isArray(value) ? value : []);
}

/* ------------------------------------------------------------ */

/** タブの正式名称（PC・aria-label・title で常に使う）。 */
function tabLabelOf(id: TabId): string {
  if (id === 'recent') return RECENT_LABEL;
  return NAGA_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** タブの一文字表記（dock 時の非選択タブ。設計 §4 案 A）。 */
function tabShortLabelOf(id: TabId): string {
  if (id === 'recent') return RECENT_SHORT;
  return NAGA_CATEGORIES.find((c) => c.id === id)?.short ?? tabLabelOf(id).charAt(0);
}

let instanceSeq = 0;

interface FieldBinding {
  cleanup: () => void;
  /** attach 時に NagaIME が設定した inline fontFamily（設定しなかった場合は null） */
  appliedFontFamily: string | null;
  addedClass: boolean;
  /** `for` で付けた（`for` の付け直し・再接続で引き直す対象） */
  viaFor: boolean;
  /** `attach()` で付けた（`for` の付け直しでは外さない） */
  viaAttach: boolean;
}

function isTarget(el: unknown): el is NagaTarget {
  return (
    typeof HTMLInputElement !== 'undefined' &&
    (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
  );
}

function isCandidate(value: unknown): value is NagaCandidate {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.char === 'string' &&
    typeof v.reading === 'string' &&
    typeof v.description === 'string' &&
    typeof v.category === 'string' &&
    CATEGORY_IDS.has(v.category)
  );
}

function copyCandidate(candidate: NagaCandidate): NagaCandidate {
  return {
    char: candidate.char,
    reading: candidate.reading,
    description: candidate.description,
    category: candidate.category,
  };
}

/** 影を辿った最も深い activeElement（影の中の欄・自分の影の中の部品を見分けるため）。 */
function deepActiveElement(): Element | null {
  let ae: Element | null = document.activeElement;
  while (ae && ae.shadowRoot && ae.shadowRoot.activeElement) ae = ae.shadowRoot.activeElement;
  return ae;
}

function toElements(target: AttachTarget): Element[] {
  if (typeof target === 'string') return Array.from(document.querySelectorAll(target));
  if (target instanceof Element) return [target];
  return Array.from(target as ArrayLike<Element>);
}

function constructionError(): TypeError {
  const name = import.meta.env.PACKAGE_NAME;
  return new TypeError(
    `[${name}] cannot construct NagaIME: <naga-ime> is defined by another implementation. ` +
      `Load a single copy of ${name}, or use document.createElement('naga-ime').`,
  );
}

export class NagaIME extends HTMLElement {
  static get observedAttributes(): string[] {
    return Object.keys(ATTRIBUTE_TO_PROPERTY);
  }

  /* 設定の実効値（§5.3）。公開プロパティは prototype の getter / setter（upgrade property のため） */
  private cfgFor = '';
  private cfgCategories: NagaCategoryId[] = [...ALL_CATEGORIES];
  private cfgTriggerLabel = DEFAULT_TRIGGER_LABEL;
  private cfgShortcut = true;
  private cfgRecentStorageKey: string | null = DEFAULT_RECENT_KEY;
  private cfgRecentMax = DEFAULT_RECENT_MAX;
  private cfgMaxCandidates = DEFAULT_MAX_CANDIDATES;
  private cfgDockBreakpoint = DEFAULT_DOCK_BREAKPOINT;
  private cfgLoadFonts = true;

  private readonly uid: string;
  private readonly root: HTMLDivElement;
  private fontLoader: FontLoader | null = null;
  private readonly fields = new Map<NagaTarget, FieldBinding>();

  private dictionary: NagaDictionary | null = null;
  private recents: NagaCandidate[] = [];
  /** recents を localStorage から読んだか（読むのは最初の open まで遅らせる。§5.3 規則 6） */
  private recentsLoaded = false;
  private target: NagaTarget | null = null;
  private activeTab: TabId = ALL_CATEGORIES[0];
  private candidates: NagaCandidate[] = [];
  private selectedIndex = 0;
  private composing = false;
  private openState = false;
  private openSeq = 0;
  /** 下部ドッキング中か（`.naga-is-docked` と対。dock 限定の振る舞いの唯一の判定源・設計 §6.2-3）。 */
  private docked = false;
  /** 畳んでいるか（人間の操作でだけ変わる。閉じても・dock でなくなっても保つ。§3.3） */
  private folded = false;
  /** 直前の確定で入った文字（写しで強調する。次に開くとき・タブを替えたときに消す。§3.2） */
  private lastCommitted: string | null = null;
  /** 初回の connectedCallback を終えたか（昇格中の attributeChangedCallback で for を引かない） */
  private initialized = false;
  private pendingForLookup: (() => void) | null = null;

  private trigger: HTMLButtonElement | null = null;
  private popup: HTMLDivElement | null = null;
  private tabsEl: HTMLDivElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private listEl: HTMLDivElement | null = null;
  private searchRowEl: HTMLDivElement | null = null;
  private copyEl: HTMLDivElement | null = null;
  private foldEl: HTMLButtonElement | null = null;
  private globalCleanup: (() => void) | null = null;
  /** 起動ボタンの置き直しの購読を外す関数（購読していないときは null）。 */
  private triggerCleanup: (() => void) | null = null;
  /** 置き直しを間引く rAF の id（0 は予約していない）。 */
  private triggerRaf = 0;
  /** popup の置き直しの購読を外す関数（開いていないときは null）。0432 */
  private popupCleanup: (() => void) | null = null;
  /** popup の置き直しを間引く rAF の id（0 は予約していない）。0432 */
  private popupRaf = 0;

  constructor(options: NagaIMEOptions = {}) {
    // 別の実装が naga-ime を登録済みなら、ブラウザの Illegal constructor に任せず理由を言って投げる（§5.2）
    if (new.target === NagaIME && customElements.get(TAG_NAME) !== NagaIME) throw constructionError();
    super();
    this.uid = `naga-${++instanceSeq}`;
    // custom element の構築の規則: 属性と light DOM の子は作らない（影の中だけを作る）
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.setAttribute(NAGA_STYLE_ATTRIBUTE, '');
    style.textContent = NAGA_STYLE_TEXT;
    const root = document.createElement('div');
    root.className = 'naga-root';
    shadow.append(style, root);
    this.root = root;

    if (options.categories !== undefined) this.categories = options.categories;
    if (options.triggerLabel !== undefined) this.triggerLabel = options.triggerLabel;
    if (options.shortcut !== undefined) this.shortcut = options.shortcut;
    if (options.recentStorageKey !== undefined) this.recentStorageKey = options.recentStorageKey;
    if (options.recentMax !== undefined) this.recentMax = options.recentMax;
    if (options.maxCandidates !== undefined) this.maxCandidates = options.maxCandidates;
    if (options.dockBreakpoint !== undefined) this.dockBreakpoint = options.dockBreakpoint;
    if (options.loadFonts !== undefined) this.loadFonts = options.loadFonts;
  }

  /* ------------------------------------------------------------ *
   * custom element のライフサイクル
   * ------------------------------------------------------------ */

  connectedCallback(): void {
    // 昇格前に代入された own property を取り込み直す（prototype の setter を通す）
    for (const name of UPGRADE_PROPERTIES) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const value = (this as unknown as Record<string, unknown>)[name];
        delete (this as unknown as Record<string, unknown>)[name];
        (this as unknown as Record<string, unknown>)[name] = value;
      }
    }
    this.initialized = true;
    this.resolveFor();
    if (document.readyState === 'loading' && !this.pendingForLookup) {
      const onReady = () => {
        this.pendingForLookup = null;
        if (this.isConnected) this.resolveFor();
      };
      this.pendingForLookup = () => document.removeEventListener('DOMContentLoaded', onReady);
      document.addEventListener('DOMContentLoaded', onReady, { once: true });
    }
  }

  disconnectedCallback(): void {
    // 同じタスク内の付け替え（appendChild での移動）では作り直さない（§5.4）
    queueMicrotask(() => {
      if (this.isConnected) return;
      this.pendingForLookup?.();
      this.pendingForLookup = null;
      this.detach();
    });
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    // 同じ値の setAttribute でも呼ばれる。値が変わったときだけに最適化しない（最後に変えた方が効く。§0.3）
    switch (name as ObservedAttribute) {
      case 'for':
        this.setFor(value ?? '');
        break;
      case 'categories':
        this.setCategories(categoriesFromAttribute(value));
        break;
      case 'trigger-label':
        this.setTriggerLabel(stringFromValue(value) ?? DEFAULT_TRIGGER_LABEL);
        break;
      case 'shortcut':
        this.cfgShortcut = boolFromAttribute(value, name) ?? true;
        break;
      case 'recent-storage-key':
        this.setRecentStorageKey(stringFromValue(value) ?? DEFAULT_RECENT_KEY);
        break;
      case 'recent-max':
        this.setRecentMax(intFromAttribute(value, 0) ?? DEFAULT_RECENT_MAX);
        break;
      case 'max-candidates':
        this.cfgMaxCandidates = intFromAttribute(value, 1) ?? DEFAULT_MAX_CANDIDATES;
        break;
      case 'dock-breakpoint':
        this.cfgDockBreakpoint = intFromAttribute(value, 0) ?? DEFAULT_DOCK_BREAKPOINT;
        break;
      case 'load-fonts':
        this.cfgLoadFonts = boolFromAttribute(value, name) ?? true;
        break;
    }
  }

  /* ------------------------------------------------------------ *
   * プロパティ（§5.3。読み出しは実効値。代入は属性を変えない）
   * ------------------------------------------------------------ */

  /**
   * 取り付ける欄の id（空白区切り）。id は要素の root（`getRootNode()`。影の中に置けばその影の中）で引く。
   * 接続時と、文書の読込中なら DOMContentLoaded 時に引く。後から足された欄は `attach()` で付ける。
   * `<label>.htmlFor` と違い、代入は `for` 属性を変えない。
   */
  get htmlFor(): string {
    return this.cfgFor;
  }
  set htmlFor(value: string) {
    this.setFor(typeof value === 'string' ? value : '');
  }

  /** 表示するカテゴリタブと順序。既定は全カテゴリ。読み出しは複製。 */
  get categories(): NagaCategoryId[] {
    return [...this.cfgCategories];
  }
  set categories(value: NagaCategoryId[]) {
    this.setCategories(categoriesFromProperty(value));
  }

  /** 起動ボタンに表示する文字。既定は '梵'。 */
  get triggerLabel(): string {
    return this.cfgTriggerLabel;
  }
  set triggerLabel(value: string) {
    this.setTriggerLabel(stringFromValue(value) ?? DEFAULT_TRIGGER_LABEL);
  }

  /** Ctrl+J / Cmd+J で開閉するか。既定は true。 */
  get shortcut(): boolean {
    return this.cfgShortcut;
  }
  set shortcut(value: boolean) {
    this.cfgShortcut = boolFromProperty(value) ?? true;
  }

  /** 最近使った文字を保存する localStorage のキー。null で保存も読み出しもしない。 */
  get recentStorageKey(): string | null {
    return this.cfgRecentStorageKey;
  }
  set recentStorageKey(value: string | null) {
    this.setRecentStorageKey(value === null ? null : (stringFromValue(value) ?? DEFAULT_RECENT_KEY));
  }

  /** 最近使った文字の最大件数。0 で「最近」タブを持たず、localStorage を読みも書きもしない。 */
  get recentMax(): number {
    return this.cfgRecentMax;
  }
  set recentMax(value: number) {
    this.setRecentMax(intFromProperty(value, 0) ?? DEFAULT_RECENT_MAX);
  }

  /** 一度に表示する候補の最大件数。既定は 60。 */
  get maxCandidates(): number {
    return this.cfgMaxCandidates;
  }
  set maxCandidates(value: number) {
    this.cfgMaxCandidates = intFromProperty(value, 1) ?? DEFAULT_MAX_CANDIDATES;
  }

  /** この幅（CSS px）未満の viewport ではポップアップを画面下部へドッキングする。既定は 560。 */
  get dockBreakpoint(): number {
    return this.cfgDockBreakpoint;
  }
  set dockBreakpoint(value: number) {
    this.cfgDockBreakpoint = intFromProperty(value, 0) ?? DEFAULT_DOCK_BREAKPOINT;
  }

  /** FontLoader で特殊文字フォントを読み込むか。既定は true。次の `attach()` から効く。 */
  get loadFonts(): boolean {
    return this.cfgLoadFonts;
  }
  set loadFonts(value: boolean) {
    this.cfgLoadFonts = boolFromProperty(value) ?? true;
  }

  /** ポップアップが開いているか。 */
  get isOpen(): boolean {
    return this.openState;
  }

  private setFor(value: string): void {
    this.cfgFor = value;
    if (this.initialized && this.isConnected) this.resolveFor();
  }

  private setCategories(next: NagaCategoryId[]): void {
    this.cfgCategories = next;
    if (this.activeTab !== 'recent' && !next.includes(this.activeTab)) this.activeTab = next[0];
    this.rebuildTabs();
  }

  private setTriggerLabel(next: string): void {
    this.cfgTriggerLabel = next;
    if (this.trigger) this.trigger.textContent = next;
  }

  private setRecentStorageKey(next: string | null): void {
    this.cfgRecentStorageKey = next;
    // null は以後読まない・書かない（記憶の中の最近は要素の中で働き続ける）。新しいキーは読み直す
    if (next !== null && this.recentsLoaded) this.reloadRecents();
  }

  private setRecentMax(next: number): void {
    const prev = this.cfgRecentMax;
    this.cfgRecentMax = next;
    if (next === 0) {
      // 「最近」タブを外し、記憶の中の最近を捨てる（保存された値は消さない。§0.2）
      this.recents = [];
      if (this.activeTab === 'recent') this.activeTab = this.cfgCategories[0];
    } else if (prev === 0) {
      if (this.recentsLoaded) this.reloadRecents();
    } else {
      this.recents = this.recents.slice(0, next);
    }
    if (prev === 0 || next === 0) this.rebuildTabs();
  }

  /* ------------------------------------------------------------ *
   * 取り付け / 取り外し
   * ------------------------------------------------------------ */

  /**
   * セレクタ、要素、または要素の列に取り付ける。input / textarea 以外は無視する。
   * 文字列は `document.querySelectorAll` で引く。影の中の欄は Element を渡すか、
   * 同じ影の中に置いた `<naga-ime for>` を使う。要素が未接続なら `document.body` の末尾へ入れる。
   */
  attach(target: AttachTarget): void {
    this.bindAll(toElements(target), 'attach');
  }

  /** 指定要素（省略時はすべて）から取り外す。取り付け先が無くなれば DOM と listener も片付ける。 */
  detach(target?: AttachTarget): void {
    const elements = target === undefined ? Array.from(this.fields.keys()) : toElements(target);
    for (const el of elements) {
      if (isTarget(el)) this.unbindField(el);
    }
    if (this.fields.size === 0) this.teardownDom();
  }

  /** すべての取り付けを外し、DOM と listener を片付け、要素を DOM から外す。 */
  destroy(): void {
    this.detach();
    this.teardownDom();
    this.remove();
  }

  private bindAll(elements: Element[], via: 'attach' | 'for'): void {
    const targets = elements.filter(isTarget);
    const fresh: NagaTarget[] = [];
    for (const field of targets) {
      const binding = this.fields.get(field);
      if (binding) {
        if (via === 'attach') binding.viaAttach = true;
        else binding.viaFor = true;
      } else if (!fresh.includes(field)) {
        fresh.push(field);
      }
    }
    if (fresh.length === 0) return;

    if (!this.isConnected) document.body.append(this);
    this.ensureDom();
    if (this.cfgLoadFonts) {
      this.fontLoader ??= new FontLoader();
      this.fontLoader.loadFonts(FONT_SETTINGS).catch(() => {
        /* 書体の読込失敗は入力機能を止めない（Google Fonts 未到達など） */
      });
    }
    fresh.forEach((field) => this.bindField(field, via));
  }

  /** `for` の id を要素の root で引き直す。`for` で付けた欄だけを付け直す（§5.4）。 */
  private resolveFor(): void {
    const root = this.getRootNode() as Document | ShadowRoot;
    const found: Element[] = [];
    if (typeof root.getElementById === 'function') {
      for (const id of this.cfgFor.split(/\s+/)) {
        if (!id) continue;
        const el = root.getElementById(id);
        if (el) found.push(el);
      }
    }
    for (const [field, binding] of Array.from(this.fields)) {
      if (!binding.viaFor || found.includes(field)) continue;
      if (binding.viaAttach) binding.viaFor = false;
      else this.unbindField(field);
    }
    if (found.length) this.bindAll(found, 'for');
    if (this.fields.size === 0) this.teardownDom();
  }

  private unbindField(el: NagaTarget): void {
    const binding = this.fields.get(el);
    if (!binding) return;
    binding.cleanup();
    if (binding.addedClass) el.classList.remove('naga-enabled');
    if (binding.appliedFontFamily !== null && el.style.fontFamily === binding.appliedFontFamily) {
      el.style.fontFamily = '';
    }
    this.fields.delete(el);
    if (this.target === el) {
      this.close();
      this.target = null;
      this.hideTrigger();
    }
  }

  /* ------------------------------------------------------------ *
   * 開閉
   * ------------------------------------------------------------ */

  async toggle(field: NagaTarget): Promise<void> {
    if (this.openState && this.target === field) {
      this.close({ refocus: true });
      return;
    }
    await this.open(field);
  }

  async open(field: NagaTarget): Promise<void> {
    if (!this.fields.has(field)) return;
    this.target = field;
    const seq = ++this.openSeq;
    if (!this.dictionary) {
      if (this.searchEl) this.searchEl.placeholder = '辞書を読み込み中…';
      const dictionary = await loadNagaDictionary();
      this.dictionary = dictionary;
      if (this.searchEl) this.searchEl.placeholder = SEARCH_PLACEHOLDER;
    }
    // 読込中に close / detach / 別の open が起きたら、この open は取り消す
    if (seq !== this.openSeq || !this.popup || !this.searchEl || !this.fields.has(field)) return;

    if (!this.recentsLoaded) this.reloadRecents();
    this.openState = true;
    this.popup.hidden = false;
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.searchEl.value = '';
    this.selectedIndex = 0;
    this.lastCommitted = null;
    if (this.recents.length) this.activeTab = 'recent';
    else if (this.activeTab === 'recent') this.activeTab = this.cfgCategories[0];
    this.renderTabs();
    this.refresh();
    this.positionPopup();
    // 置き直しの購読を張り、レイアウトが落ち着いてから 1 回置き直す（0432）
    this.syncPopupTracking();
    this.updateCopy();
    // NagaIME はページも欄もスクロールしない（M-1）。focus の暗黙のスクロールも止める（MIN-1）
    this.searchEl.focus({ preventScroll: true });
    this.emit('nagaOpen', { field });
  }

  close({ refocus = false }: { refocus?: boolean } = {}): void {
    const wasOpen = this.openState;
    this.openSeq++;
    this.openState = false;
    this.composing = false;
    if (this.popup) this.popup.hidden = true;
    this.trigger?.setAttribute('aria-expanded', 'false');
    if (refocus && this.target) this.target.focus({ preventScroll: true });
    // 置き直しの購読を外す。欄が focus のままでボタンが見えている（Escape で閉じた等）ときは、
    // 可視を正本に張り直す（閉じたあともボタンは欄の右上に居続ける）
    this.stopPopupTracking();
    this.stopTriggerTracking();
    this.syncTriggerTracking();
    if (wasOpen) this.emit('nagaClose', { field: this.target });
  }

  private emit<K extends keyof NagaIMEEventMap>(type: K, detail: NagaIMEEventMap[K]['detail']): void {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: false, cancelable: false, detail }));
  }

  /* ------------------------------------------------------------ *
   * DOM の構築と片付け
   * ------------------------------------------------------------ */

  private ensureDom(): void {
    if (this.popup) return;
    const popupId = `${this.uid}-popup`;
    const listId = `${this.uid}-list`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'naga-trigger';
    trigger.id = `${this.uid}-trigger`;
    trigger.textContent = this.cfgTriggerLabel;
    trigger.title = '特殊文字を入力 (Ctrl+J / ⌘J)';
    trigger.setAttribute('aria-label', '特殊文字を入力');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', popupId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.hidden = true;
    // 対象の blur より先に処理し、対象のフォーカスを奪わないため mousedown で開く
    trigger.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (this.target) void this.toggle(this.target);
    });
    // キーボードでボタンを押した場合（mousedown が来ない）
    trigger.addEventListener('click', (e) => {
      if (e.detail === 0 && this.target) void this.toggle(this.target);
    });

    const popup = document.createElement('div');
    popup.className = 'naga-popup';
    popup.id = popupId;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', '特殊文字入力');
    popup.hidden = true;

    const titlebar = document.createElement('div');
    titlebar.className = 'naga-titlebar';
    const tabs = document.createElement('div');
    tabs.className = 'naga-tabs';
    tabs.setAttribute('role', 'tablist');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'naga-close';
    closeBtn.title = '閉じる (Esc)';
    closeBtn.setAttribute('aria-label', '閉じる');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('mousedown', (e) => e.preventDefault());
    closeBtn.addEventListener('click', () => this.close({ refocus: true }));
    // 畳むボタン（dock のときだけ見える。§3.3）。押しても欄・読み欄のフォーカスを奪わない
    const foldBtn = document.createElement('button');
    foldBtn.type = 'button';
    foldBtn.className = 'naga-fold';
    foldBtn.addEventListener('mousedown', (e) => e.preventDefault());
    foldBtn.addEventListener('click', () => this.toggleFold());
    titlebar.append(tabs, foldBtn, closeBtn);

    // 挿入先の写し（dock のときだけ見える。§3.2）。欄が popup に隠れていても、どこに何が入ったか分かるように
    const copy = document.createElement('div');
    copy.className = 'naga-copy';
    copy.setAttribute('aria-live', 'polite');

    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'naga-search';
    search.placeholder = SEARCH_PLACEHOLDER;
    search.autocomplete = 'off';
    search.setAttribute('autocapitalize', 'off');
    search.spellcheck = false;
    search.setAttribute('role', 'combobox');
    search.setAttribute('aria-expanded', 'true');
    search.setAttribute('aria-controls', listId);
    search.setAttribute('aria-label', SEARCH_ARIA_LABEL);

    // 読み入力欄の行（設計 §5）。行は flex（nov26-m3-t3 で display: contents をやめた）。PC では
    // ラベルを隠し、input が行いっぱいに広がる（見た目は不変・e2e の P-8）。
    // dock 時だけラベルとアクセント縦線が出て、本体の入力欄と見分けられる。
    const searchRow = document.createElement('div');
    searchRow.className = 'naga-search-row';
    const searchLabel = document.createElement('span');
    searchLabel.className = 'naga-search-label';
    searchLabel.textContent = SEARCH_LABEL;
    searchLabel.setAttribute('aria-hidden', 'true');
    searchRow.append(searchLabel, search);

    const list = document.createElement('div');
    list.className = 'naga-list';
    list.id = listId;
    list.setAttribute('role', 'listbox');

    const hint = document.createElement('div');
    hint.className = 'naga-hint';
    hint.textContent = '↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる';

    popup.append(titlebar, copy, searchRow, list, hint);

    // 検索欄: システム IME の変換中は介入しない
    search.addEventListener('compositionstart', () => {
      this.composing = true;
    });
    search.addEventListener('compositionend', () => {
      this.composing = false;
      this.refresh();
    });
    search.addEventListener('input', () => {
      if (!this.composing) this.refresh();
    });
    search.addEventListener('keydown', (e) => this.onSearchKeydown(e));

    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const item = (e.target as Element | null)?.closest?.('.naga-item') as HTMLElement | null;
      if (item) this.commit(this.candidates[Number(item.dataset.index)]);
    });

    // 部品は影の中（§5.2）。document.body には何も入れない
    this.root.append(trigger, popup);
    this.trigger = trigger;
    this.popup = popup;
    this.tabsEl = tabs;
    this.searchEl = search;
    this.listEl = list;
    this.searchRowEl = searchRow;
    this.copyEl = copy;
    this.foldEl = foldBtn;
    this.applyFold();
    this.rebuildTabs();

    const onDocMouseDown = (e: MouseEvent) => {
      if (!this.openState || !this.popup) return;
      // 影の中の欄・自分の影の中の部品は document から見ると e.target が host に付け替えられる ∴ composedPath で判定する
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];
      if (path.some((n) => n === this.popup || n === this.trigger || (this.target !== null && n === this.target))) return;
      this.close({ refocus: true });
    };
    const onResize = () => {
      if (this.openState) this.positionPopup();
    };
    // 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】popup は文書の座標で置く ∴ ページのスクロールでは置き直さない
    // （ブラウザが本文と一緒に動かす）。開いている間の置き直しは syncPopupTracking() が受け持つ
    // （スクロールコンテナ要素の scroll と、開いた直後の 1 回）。resize はここで拾う。
    const vv = window.visualViewport;
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('resize', onResize);
    vv?.addEventListener('resize', onResize);
    this.globalCleanup = () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('resize', onResize);
      vv?.removeEventListener('resize', onResize);
    };
  }

  /** タブを作り直す（categories・recentMax の変更と DOM の構築時）。選択と dock の表示名は保つ。 */
  private rebuildTabs(): void {
    const tabs = this.tabsEl;
    if (!tabs) return;
    const listId = `${this.uid}-list`;
    const tabIds: TabId[] = this.cfgRecentMax > 0 ? ['recent', ...this.cfgCategories] : [...this.cfgCategories];
    tabs.replaceChildren();
    for (const id of tabIds) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'naga-tab';
      b.id = `${this.uid}-tab-${id}`;
      b.dataset.category = id;
      // 初期値は正式名称。dock 時の一文字表記は applyTabLabels() が一手に引き受ける。
      b.textContent = tabLabelOf(id);
      // 一文字表記でも何のタブか分かるよう、正式名称は常に取れるようにしておく（設計 §6.1 ③）。
      b.title = tabLabelOf(id);
      b.setAttribute('aria-label', tabLabelOf(id));
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', listId);
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        this.activeTab = id;
        this.lastCommitted = null;
        this.renderTabs();
        this.refresh();
        this.updateCopy();
        this.searchEl?.focus({ preventScroll: true });
      });
      tabs.appendChild(b);
    }
    this.renderTabs();
    if (this.openState) this.refresh();
  }

  private teardownDom(): void {
    this.close();
    this.stopTriggerTracking();
    this.globalCleanup?.();
    this.globalCleanup = null;
    this.trigger?.remove();
    this.popup?.remove();
    this.trigger = null;
    this.popup = null;
    this.tabsEl = null;
    this.searchEl = null;
    this.listEl = null;
    this.searchRowEl = null;
    this.copyEl = null;
    this.foldEl = null;
    this.target = null;
    this.docked = false;
  }

  private bindField(field: NagaTarget, via: 'attach' | 'for'): void {
    let appliedFontFamily: string | null = null;
    if (!field.style.fontFamily) {
      // loadFonts: false でも family 文字列は FontLoader と同じ並びにする（style は注入しない）
      const special = this.fontLoader
        ? this.fontLoader.getFontFamilyString(FONT_SETTINGS)
        : [fontFamilies.hentaigana, fontFamilies.siddham, fontFamilies.itaiji, 'serif'].join(', ');
      let current: string;
      try {
        current = getComputedStyle(field).fontFamily;
      } catch {
        current = '';
      }
      // 通常文字の見た目は変えず、特殊文字フォントをフォールバックに足す
      field.style.fontFamily = current ? `${current}, ${special}` : special;
      appliedFontFamily = field.style.fontFamily;
    }
    const addedClass = !field.classList.contains('naga-enabled');
    field.classList.add('naga-enabled');

    const onFocus = () => this.showTrigger(field);
    const onBlur = () => {
      // setTimeout を挟むと focus による付け替えと競合するため、同期的に activeElement で判定する。
      // 影の中の欄・自分の影の中の trigger を見分けるため、影を辿った最も深い要素で判定する
      if (this.openState) return;
      const ae = deepActiveElement();
      if (ae !== this.trigger && !(isTarget(ae) && this.fields.has(ae))) {
        this.hideTrigger();
      }
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (this.cfgShortcut && (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        void this.toggle(field);
        return;
      }
      if (e.key === 'Escape' && this.openState && this.target === field) {
        this.close();
      }
    };
    const el: HTMLElement = field;
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKeydown);
    this.fields.set(field, {
      appliedFontFamily,
      addedClass,
      viaFor: via === 'for',
      viaAttach: via === 'attach',
      cleanup: () => {
        el.removeEventListener('focus', onFocus);
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKeydown);
      },
    });
    if (deepActiveElement() === field) this.showTrigger(field);
  }

  /* ------------------------------------------------------------ *
   * 起動ボタン
   * ------------------------------------------------------------ */

  private showTrigger(field: NagaTarget): void {
    this.target = field;
    if (!this.trigger) return;
    this.positionTrigger(field);
    this.trigger.hidden = false;
    this.syncTriggerTracking();
  }

  /** 起動ボタンを隠す（置き直しの購読も外す）。 */
  private hideTrigger(): void {
    if (this.trigger) this.trigger.hidden = true;
    this.syncTriggerTracking();
  }

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
  private containingBlockOffset(el: HTMLElement): { top: number; left: number } {
    const op = el.offsetParent as HTMLElement | null;
    if (!op || op === document.body || op === document.documentElement) return { top: 0, left: 0 };
    const cs = getComputedStyle(op);
    const borderTop = Number.parseFloat(cs.borderTopWidth) || 0;
    const borderLeft = Number.parseFloat(cs.borderLeftWidth) || 0;
    const o = op.getBoundingClientRect();
    // padding box の文書座標（スクロールした分だけ中身は上へずれる）
    const originTop = o.top + window.scrollY + borderTop - (op.scrollTop || 0);
    const originLeft = o.left + window.scrollX + borderLeft - (op.scrollLeft || 0);
    return { top: originTop, left: originLeft };
  }

  /** 文書の座標の top / left を要素の style に書く（包含ブロックが文書でなければ補正する）。 */
  private placeInDocument(el: HTMLElement, top: number, left: number): void {
    const origin = this.containingBlockOffset(el);
    el.style.top = `${top - origin.top}px`;
    el.style.left = `${left - origin.left}px`;
  }

  /** 文書の可視幅（初期包含ブロックの幅。スクロールバーの分は含めない）。0432 */
  private documentWidth(): number {
    return document.documentElement.clientWidth || window.innerWidth;
  }

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
  private positionTrigger(field: NagaTarget): void {
    const trigger = this.trigger;
    if (!trigger) return;
    const r = field.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // 文書の座標（初期包含ブロック＝文書が基準）
    let top = r.top + scrollY - TRIGGER_SIZE_PX - TRIGGER_GAP_PX;
    if (top < 0) {
      // 欄が文書の先頭にある。欄のすぐ上には置けない ∴ 欄のすぐ下へ回す
      top = r.bottom + scrollY + TRIGGER_GAP_PX;
    }
    let left = r.right + scrollX - TRIGGER_SIZE_PX;
    if (left < scrollX) left = scrollX + TRIGGER_MARGIN_PX;

    this.placeInDocument(trigger, top, left);
  }

  /**
   * 【NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430】起動ボタンが見えている間だけ、置き直しの購読を張る（見えなければ外す）。
   *
   * ボタンは文書の座標で置くので、ページのスクロール（window・visualViewport とも）では置き直さない
   * —— ブラウザが本文と一緒に動かす。欄の位置が変わるのは resize（キーボードの出入り・回転・窓の大きさ）
   * ∴ そこだけ購読する。欄の中身やフォントの適用でレイアウトが変わる場合に備えて、focus の直後に
   * 1 回だけ置き直す（購読ではない）。同じフレームに何度届いても置き直しは 1 回に間引く。
   */
  private syncTriggerTracking(): void {
    const visible = Boolean(this.trigger && !this.trigger.hidden && this.target);
    if (!visible) {
      this.stopTriggerTracking();
      return;
    }
    if (this.triggerCleanup) {
      this.requestTriggerPosition();
      return;
    }
    const request = () => this.requestTriggerPosition();
    // 【NOV26-IR-NAGA-TRIGGER-ABSOLUTE-0431 MAJOR-1】欄が overflow のスクロールコンテナの中にあると、
    // その要素のスクロールでは文書座標のボタンが付いてこない。要素のスクロールだけを capture で拾い、
    // ページ（document）のスクロールは無視する（ページではボタンが本文と一緒に動くので置き直さない）。
    const onElementScroll = (e: Event) => {
      const t = e.target;
      if (t === document || t === window || t === document.documentElement || t === document.body) return;
      request();
    };
    const vv = window.visualViewport;
    window.addEventListener('resize', request, { passive: true });
    vv?.addEventListener('resize', request, { passive: true });
    document.addEventListener('scroll', onElementScroll, { capture: true, passive: true });
    this.triggerCleanup = () => {
      window.removeEventListener('resize', request);
      vv?.removeEventListener('resize', request);
      document.removeEventListener('scroll', onElementScroll, { capture: true });
      if (this.triggerRaf) cancelAnimationFrame(this.triggerRaf);
      this.triggerRaf = 0;
    };
    // focus の直後の 1 回（購読を張ったときだけ）
    this.requestTriggerPosition();
  }

  /** 次のフレームで 1 回だけ置き直す（同じフレームに何度呼ばれても 1 回）。 */
  private requestTriggerPosition(): void {
    if (this.triggerRaf) return;
    this.triggerRaf = requestAnimationFrame(() => {
      this.triggerRaf = 0;
      if (!this.trigger || this.trigger.hidden || !this.target) return;
      this.positionTrigger(this.target);
    });
  }

  private stopTriggerTracking(): void {
    this.triggerCleanup?.();
    this.triggerCleanup = null;
  }

  /* ------------------------------------------------------------ *
   * 検索・描画
   * ------------------------------------------------------------ */

  private currentEntries(): readonly NagaCandidate[] {
    if (this.activeTab === 'recent') return this.recents;
    return this.dictionary?.get(this.activeTab) ?? [];
  }

  private refresh(): void {
    if (!this.searchEl) return;
    const query = this.searchEl.value.trim();
    const recentChars = new Set(this.recents.map((r) => r.char));
    this.candidates = searchNagaCandidates(this.currentEntries(), query, recentChars, this.cfgMaxCandidates);
    this.selectedIndex = 0;
    this.renderList();
  }

  private renderTabs(): void {
    this.tabsEl?.querySelectorAll<HTMLElement>('.naga-tab').forEach((b) => {
      const on = b.dataset.category === this.activeTab;
      b.classList.toggle('naga-is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    this.applyTabLabels();
  }

  /**
   * タブの表示名を `docked` と `activeTab` から冪等に決める（設計 §6.1 ②）。
   * dock 時は非選択タブを一文字にして、タブ帯を 1 行に収める（案 A）。
   * PC（non-docked）は常に正式名称で、既存の見た目を変えない。
   * 呼び出し元は renderTabs()（選択が変わるとき）と setDocked()（dock 遷移のとき）の 2 つだけ。
   */
  private applyTabLabels(): void {
    this.tabsEl?.querySelectorAll<HTMLElement>('.naga-tab').forEach((b) => {
      const id = b.dataset.category as TabId | undefined;
      if (!id) return;
      const short = this.docked && id !== this.activeTab;
      b.textContent = short ? tabShortLabelOf(id) : tabLabelOf(id);
    });
  }

  /** dock 状態の遷移を 1 か所で扱う（変化したときだけ表示名を作り直す）。 */
  private setDocked(next: boolean): void {
    if (this.docked === next) return;
    this.docked = next;
    this.applyTabLabels();
    this.applyFold();
  }

  /* ------------------------------------------------------------ *
   * 折りたたみ（§3.3）と挿入先の写し（§3.2）
   * ------------------------------------------------------------ */

  /** 畳む／開く（人間の操作でだけ呼ぶ）。開くときは読み欄へ戻す（タップの中なのでソフトキーボードが出る）。 */
  private toggleFold(): void {
    this.folded = !this.folded;
    this.applyFold();
    if (this.openState) this.positionPopup();
    this.updateCopy();
    if (!this.folded) this.searchEl?.focus({ preventScroll: true });
  }

  /** 畳んだ状態を見た目へ出す。dock でないとき（PC）は出さない（状態は保つ）。 */
  private applyFold(): void {
    const show = this.folded && this.docked;
    this.popup?.classList.toggle('naga-is-folded', show);
    if (this.searchRowEl) this.searchRowEl.hidden = show;
    if (this.listEl) this.listEl.hidden = show;
    const fold = this.foldEl;
    if (fold) {
      fold.setAttribute('aria-expanded', String(!this.folded));
      fold.setAttribute('aria-label', this.folded ? 'ひらく' : 'たたむ');
      fold.title = this.folded ? 'ひらく' : 'たたむ';
      fold.textContent = this.folded ? '▴' : '▾';
    }
  }

  /**
   * 写しの行を組み直す。テキストノードと textContent だけで組む（欄の値を HTML として解釈させない）。
   * キャレットの直前の最大 12 文字（Array.from で数える）。改行は ↵、前があれば先頭に …、末尾に ▏。
   * type="password" の欄は中身を写さない。
   */
  private updateCopy(): void {
    const el = this.copyEl;
    if (!el) return;
    el.replaceChildren();
    const field = this.target;
    if (!field) return;
    const span = (cls: string, text: string): HTMLSpanElement => {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = text;
      return s;
    };
    if (field instanceof HTMLInputElement && field.type === 'password') {
      el.append(span('naga-copy-empty', '（非表示）'));
      return;
    }
    const caret = field.selectionStart ?? field.value.length;
    const before = Array.from(field.value.slice(0, caret));
    if (before.length === 0) {
      el.append(span('naga-copy-empty', '（先頭）'));
      return;
    }
    const tail = before.slice(-COPY_MAX_CHARS);
    const show = (chars: string[]): string => chars.join('').replace(/\r?\n/g, '↵');
    let fresh = 0;
    if (this.lastCommitted) {
      const n = Array.from(this.lastCommitted).length;
      if (n <= tail.length && tail.slice(-n).join('') === this.lastCommitted) fresh = n;
    }
    if (before.length > COPY_MAX_CHARS) el.append('…');
    const old = tail.slice(0, tail.length - fresh);
    if (old.length) el.append(show(old));
    if (fresh) el.append(span('naga-copy-new', show(tail.slice(-fresh))));
    el.append(span('naga-copy-caret', '▏'));
  }

  private renderList(): void {
    const list = this.listEl;
    if (!list) return;
    list.replaceChildren();
    if (!this.candidates.length) {
      const empty = document.createElement('div');
      empty.className = 'naga-empty';
      empty.textContent = '候補なし';
      list.appendChild(empty);
      this.searchEl?.removeAttribute('aria-activedescendant');
      return;
    }
    let selectedItem: HTMLElement | null = null;
    this.candidates.forEach((c, i) => {
      const selected = i === this.selectedIndex;
      const item = document.createElement('div');
      item.className = selected ? 'naga-item naga-is-selected' : 'naga-item';
      item.id = `${this.uid}-option-${i}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(selected));
      item.dataset.index = String(i);
      item.dataset.char = c.char;

      const num = document.createElement('span');
      num.className = 'naga-num';
      num.textContent = i < 9 ? String(i + 1) : '';
      const ch = document.createElement('span');
      ch.className = 'naga-char';
      ch.textContent = c.char;
      const meta = document.createElement('span');
      meta.className = 'naga-meta';
      const reading = document.createElement('span');
      reading.className = 'naga-reading';
      reading.textContent = c.reading;
      const desc = document.createElement('span');
      desc.className = 'naga-desc';
      desc.textContent = c.description;
      meta.append(reading, desc);
      item.append(num, ch, meta);
      list.appendChild(item);

      if (selected) {
        this.searchEl?.setAttribute('aria-activedescendant', item.id);
        selectedItem = item;
      }
    });
    if (selectedItem) this.revealInList(selectedItem);
  }

  /**
   * 選んだ候補が一覧の見える範囲に入るよう、一覧（this.listEl）の scrollTop だけを動かす（M-1・MIN-1）。
   * 要素を画面へ寄せる DOM の API は使わない（スクロールできる祖先すべて＝ページの viewport も動かしうる）。
   */
  private revealInList(item: HTMLElement): void {
    if (!this.listEl) return;
    const list = this.listEl;
    // offsetParent が一覧でなければ（popup が offsetParent）、一覧の offsetTop を引いて一覧の中の位置にする
    const top = item.offsetTop - (item.offsetParent === list ? 0 : list.offsetTop);
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop) this.listEl.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) this.listEl.scrollTop = bottom - list.clientHeight;
  }

  private onSearchKeydown(e: KeyboardEvent): void {
    const n = this.candidates.length;
    // 変換中（composition）のキーは一切消費しない
    const composing = this.composing || e.isComposing || e.keyCode === 229;
    if (e.key === 'ArrowDown') {
      if (composing) return;
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(n, 1);
      this.renderList();
    } else if (e.key === 'ArrowUp') {
      if (composing) return;
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + Math.max(n, 1)) % Math.max(n, 1);
      this.renderList();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (composing) return;
      e.preventDefault();
      const c = this.candidates[this.selectedIndex];
      if (c) this.commit(c);
    } else if (e.key === 'Escape') {
      if (composing) return;
      e.preventDefault();
      this.close({ refocus: true });
    } else if (/^[1-9]$/.test(e.key) && !composing) {
      const c = this.candidates[Number(e.key) - 1];
      if (c) {
        e.preventDefault();
        this.commit(c);
      }
    }
  }

  /* ------------------------------------------------------------ *
   * 確定（キャレット位置へ挿入）
   * ------------------------------------------------------------ */

  private commit(candidate: NagaCandidate | undefined): void {
    const field = this.target;
    if (!field || !candidate) return;

    this.pushRecent(candidate);

    if (typeof field.setRangeText === 'function') {
      const start = field.selectionStart ?? field.value.length;
      const end = field.selectionEnd ?? field.value.length;
      field.setRangeText(candidate.char, start, end, 'end');
    } else {
      (field as NagaTarget).value += candidate.char;
    }
    // ネイティブの入力と同じ性質の InputEvent（§5.5）。composed なので影の中の欄でも影の外の
    // React / Vue 等に届く
    field.dispatchEvent(
      new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: candidate.char }),
    );
    this.emit('nagaCommit', { field, candidate: copyCandidate(candidate) });

    // 連続入力: 開いたまま検索語だけクリアし、写しを更新する（dock はページも欄も動かさない。M-1）
    this.lastCommitted = candidate.char;
    if (this.searchEl) this.searchEl.value = '';
    this.selectedIndex = 0;
    this.refresh();
    this.positionPopup();
    this.updateCopy();
    this.searchEl?.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ *
   * 位置（文書の座標・`position: absolute`）
   * ------------------------------------------------------------ */

  /**
   * popup を文書の座標で置く。
   *
   * 【NOV26-IM-NAGA-POPUP-ANCHOR-0432】0431 まで狭幅（dock）は `position: fixed` で画面の下に据え付け、
   * `bottom` を visualViewport の offset から計算し、ページのスクロールのたびに置き直していた。実機の
   * iPhone ではキーボード表示中は fixed が visual viewport とずれ、スクロールやキーボードの出入りで
   * popup が欄と無関係に「ふわふわ」動いた（起動ボタンと同じ種類の不具合）。
   * ∴ 起動ボタンと同じく文書の座標（`position: absolute`）で置く。
   * - 狭幅: 欄のすぐ下（`top = 欄の下端 ＋ 4`）、横は文書の可視幅いっぱい。ページのスクロールは
   *   ブラウザが本文と一緒に動かすので置き直さない。
   *   読み欄に focus が移ると iOS がその欄をキーボードの上へスクロールして見せる ∴ 画面の下に
   *   据え付ける必要は無い。
   * - 広幅（PC）: キャレットの行の下。可視域の下端（`scrollY + innerHeight`）に入らなければ上に出す。
   *
   * visualViewport の値を高さの上限にだけ使う（大きさは可視域の offset に依存しない）。
   * 包含ブロックの補正は `containingBlockOffset()`（起動ボタンと同じ関数）。
   */
  private positionPopup(): void {
    const field = this.target;
    const pop = this.popup;
    if (!field || !pop) return;
    const r = field.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth;
    const style = pop.style;

    // 狭幅（またはソフトキーボードで縮んだ viewport）は欄のすぐ下に付ける
    if (vw < this.cfgDockBreakpoint) {
      pop.classList.add('naga-is-docked');
      this.setDocked(true);
      style.position = 'absolute';
      // 横は文書の可視幅いっぱい（right は使わない）
      style.right = '';
      style.bottom = '';
      style.width = `${this.documentWidth()}px`;
      // 高さの上限は「キーボードの上に残る高さ − 欄の高さ − 余白」から逆算する（§3.1）。
      // ソフトキーボードが出ている間の残り可視高 = visualViewport.height。
      const vvAvail = vv ? vv.height : window.innerHeight;
      const avail = Math.max(0, vvAvail - DOCK_GAP_PX - r.height);
      let popupMax = Math.min(DOCK_POPUP_MAX_PX, avail);
      if (popupMax < DOCK_MIN_PX) popupMax = Math.min(DOCK_MIN_PX, avail);
      if (this.folded) popupMax = Math.min(DOCK_FOLDED_PX, avail);
      style.maxHeight = `${popupMax}px`;
      style.setProperty('--naga-dock-max', `${popupMax}px`);
      style.setProperty('--naga-dock-avail', `${vvAvail}px`);
      // 縦は欄のすぐ下（文書の座標）、横は文書の可視域の左端
      this.placeInDocument(pop, r.bottom + scrollY + POPUP_GAP_PX, scrollX);
      return;
    }

    pop.classList.remove('naga-is-docked');
    this.setDocked(false);
    // dock から戻ったときだけ後片付けする（PC しか使わない場合は最初から未設定のまま）。
    if (style.maxHeight) style.maxHeight = '';
    style.removeProperty('--naga-dock-max');
    style.removeProperty('--naga-dock-avail');
    style.position = 'absolute';
    style.width = `${Math.min(360, vw - 16)}px`;
    style.bottom = 'auto';
    style.right = 'auto';

    let anchor: { x: number; y: number; lineHeight: number } | null;
    try {
      anchor = this.measureCaret(field);
    } catch {
      anchor = null;
    }

    const h = pop.offsetHeight || 320;
    const w = pop.offsetWidth || 360;
    // 可視域の下端（文書の座標）。visualViewport の offset は使わない
    const vpBottom = scrollY + window.innerHeight;
    let top: number;
    let left: number;
    if (anchor) {
      top = anchor.y + scrollY + anchor.lineHeight + 2;
      left = anchor.x + scrollX;
    } else {
      top = r.bottom + scrollY + POPUP_GAP_PX;
      left = r.left + scrollX;
    }
    if (top + h > vpBottom) {
      top = anchor ? anchor.y + scrollY - h - 2 : r.top + scrollY - h - POPUP_GAP_PX;
    }
    if (left + w > scrollX + vw) left = scrollX + vw - w - 8;
    if (left < scrollX + 4) left = scrollX + 4;

    this.placeInDocument(pop, top, left);
  }

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
  private syncPopupTracking(): void {
    if (!this.openState || !this.popup) {
      this.stopPopupTracking();
      return;
    }
    if (this.popupCleanup) {
      this.requestPopupPosition();
      return;
    }
    const request = () => this.requestPopupPosition();
    const onElementScroll = (e: Event) => {
      const t = e.target;
      // ページ（document）のスクロールは無視する（本文と一緒に popup も動くので置き直さない）
      if (t === document || t === window || t === document.documentElement || t === document.body) return;
      request();
    };
    document.addEventListener('scroll', onElementScroll, { capture: true, passive: true });
    this.popupCleanup = () => {
      document.removeEventListener('scroll', onElementScroll, { capture: true });
      if (this.popupRaf) cancelAnimationFrame(this.popupRaf);
      this.popupRaf = 0;
    };
    // 開いた直後の 1 回（購読を張ったときだけ）
    this.requestPopupPosition();
  }

  /** 次のフレームで 1 回だけ置き直す（同じフレームに何度呼ばれても 1 回）。 */
  private requestPopupPosition(): void {
    if (this.popupRaf) return;
    this.popupRaf = requestAnimationFrame(() => {
      this.popupRaf = 0;
      if (!this.openState || !this.popup) return;
      this.positionPopup();
    });
  }

  private stopPopupTracking(): void {
    this.popupCleanup?.();
    this.popupCleanup = null;
  }

  /**
   * キャレット座標の計測（ミラー要素方式・viewport の座標）。ミラーは影の中の `.naga-root`
   * （継承を断った箱）に置く。document.body に置くとページの CSS（`text-align` の継承・
   * `div { all: unset }` 等）に写した値を上書きされる（nov26-m3-t1 の R-popup の dx）。
   */
  private measureCaret(field: NagaTarget): { x: number; y: number; lineHeight: number } {
    const rect = field.getBoundingClientRect();
    const cs = getComputedStyle(field);
    const props = [
      'box-sizing', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
      'text-indent', 'word-wrap', 'overflow-wrap', 'tab-size', 'text-transform',
    ];
    const mirror = document.createElement('div');
    const ms = mirror.style;
    for (const p of props) ms.setProperty(p, cs.getPropertyValue(p));
    ms.position = 'absolute';
    ms.top = '-9999px';
    ms.left = '-9999px';
    ms.visibility = 'hidden';
    ms.whiteSpace = field instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre';
    ms.width = `${rect.width}px`;

    const caretPos = field.selectionStart ?? field.value.length;
    mirror.textContent = field.value.slice(0, caretPos);
    const marker = document.createElement('span');
    marker.textContent = '​'; // 末尾改行でも高さを確保する
    mirror.appendChild(marker);
    this.root.appendChild(mirror);
    const mRect = marker.getBoundingClientRect();
    const dRect = mirror.getBoundingClientRect();
    mirror.remove();

    const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 16) * 1.2;
    const relX = mRect.left - dRect.left - (field.scrollLeft || 0);
    const relY = mRect.top - dRect.top - (field.scrollTop || 0);
    return {
      x: rect.left + relX,
      y: rect.top + relY,
      lineHeight,
    };
  }

  /* ------------------------------------------------------------ *
   * 直近使用
   * ------------------------------------------------------------ */

  /** localStorage から読み直す。recentStorageKey が null か recentMax が 0 なら読まない。 */
  private reloadRecents(): void {
    this.recentsLoaded = true;
    const key = this.cfgRecentStorageKey;
    const max = this.cfgRecentMax;
    if (key === null || max === 0) {
      if (max === 0) this.recents = [];
      return;
    }
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      this.recents = Array.isArray(parsed) ? parsed.filter(isCandidate).slice(0, max) : [];
    } catch {
      this.recents = [];
    }
  }

  private pushRecent(candidate: NagaCandidate): void {
    const max = this.cfgRecentMax;
    if (max === 0) return;
    const entry = copyCandidate(candidate);
    this.recents = [entry, ...this.recents.filter((r) => r.char !== entry.char)].slice(0, max);
    const key = this.cfgRecentStorageKey;
    if (key === null) return;
    try {
      localStorage.setItem(key, JSON.stringify(this.recents));
    } catch {
      /* private mode 等は黙殺する */
    }
  }
}

/** `<naga-ime>` のイベントの型（`addEventListener('nagaCommit', e => e.detail…)`）。 */
// eslint-disable-next-line no-redeclare -- TS の class と interface の宣言の合併（実行時の再宣言ではない）
export interface NagaIME {
  addEventListener<K extends keyof NagaIMEEventMap>(
    type: K,
    listener: (this: NagaIME, ev: NagaIMEEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: NagaIME, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof NagaIMEEventMap>(
    type: K,
    listener: (this: NagaIME, ev: NagaIMEEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: NagaIME, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'naga-ime': NagaIME;
  }
}

// 登録（モジュールの評価につき 1 回）。既に登録済みなら（自分でも別の実装でも）何もしない・何も出さない
if (typeof customElements !== 'undefined' && !customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, NagaIME);
}
