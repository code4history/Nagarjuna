/**
 * NagaIME — トリガー式の特殊文字入力ポップアップ（oct26-m7-t1 設計 §3.2-1）。
 *
 * PoC（Playground/NextNaga/js/naga-ime.js）の UX を TypeScript 化したもの。
 *  - 常駐しない。対象にフォーカスすると小さな起動ボタンが出るだけ。
 *  - 起動はボタン押下または Ctrl/Cmd+J の明示操作のみ。
 *  - 起動中もシステム IME の変換（composition）には介入しない。
 *  - 確定は Enter / Tab / クリック / 数字キー、取消は Esc。
 *  - 確定文字は setRangeText() でキャレット位置に挿入し、bubbles な input イベントを発火する。
 *  - 確定してもポップアップは閉じない（連続入力）。
 *  - 直近使用を localStorage に保持し、次回は「最近」タブから開く。
 *  - PC はキャレットの少し下、狭い viewport では画面下部へドッキングする。
 *
 * PoC との意図的な差分:
 *  - 辞書は fetch せず package bundle を使う（naga-dictionary.ts）。`baseUrl` は無い。
 *  - 書体は FontLoader で読む。`window.nagaIME` は公開しない（demo 専用だったため）。
 *  - DOM の class はすべて `naga-` 接頭辞、id と aria-controls はインスタンス固有。
 *  - custom element を登録しない。legacy の非推奨警告も呼ばない。
 *  - detach / destroy で DOM と listener を片付ける。候補は textContent で描画する。
 *  - 対象の inline fontFamily は空のときだけ設定し、detach では自分の値のままなら空へ戻す（§3.1）。
 */
import { FontLoader } from '../fonts/loader';
import { fontFamilies } from '../fonts/styles';
import type { FontSettings } from '../fonts/types';
import type { NagaCandidate, NagaCategoryId, NagaIMEOptions } from './types';
import { NAGA_CATEGORIES, loadNagaDictionary, searchNagaCandidates, type NagaDictionary } from './naga-dictionary';
import { ensureNagaStyle } from './naga-styles';

type NagaTarget = HTMLInputElement | HTMLTextAreaElement;
type TabId = NagaCategoryId | 'recent';

const DEFAULT_RECENT_KEY = 'nagarjuna-naga-recents';
const SEARCH_PLACEHOLDER = 'よみを入力（例: あ / とき）';
const FONT_SETTINGS: FontSettings = { hentaigana: true, siddham: true, itaiji: true };
const CATEGORY_IDS = new Set<string>(NAGA_CATEGORIES.map((c) => c.id));

let instanceSeq = 0;

interface FieldBinding {
  cleanup: () => void;
  /** attach 時に NagaIME が設定した inline fontFamily（設定しなかった場合は null） */
  appliedFontFamily: string | null;
  addedClass: boolean;
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

export class NagaIME {
  private readonly options: Required<Omit<NagaIMEOptions, 'recentStorageKey'>> & { recentStorageKey: string | null };
  private readonly uid: string;
  private readonly fontLoader: FontLoader | null;
  private readonly fields = new Map<NagaTarget, FieldBinding>();

  private dictionary: NagaDictionary | null = null;
  private recents: NagaCandidate[];
  private target: NagaTarget | null = null;
  private activeTab: TabId;
  private candidates: NagaCandidate[] = [];
  private selectedIndex = 0;
  private composing = false;
  private openState = false;
  private openSeq = 0;

  private trigger: HTMLButtonElement | null = null;
  private popup: HTMLDivElement | null = null;
  private tabsEl: HTMLDivElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private listEl: HTMLDivElement | null = null;
  private globalCleanup: (() => void) | null = null;

  constructor(options: NagaIMEOptions = {}) {
    const categories = (options.categories ?? NAGA_CATEGORIES.map((c) => c.id)).filter((id) => CATEGORY_IDS.has(id));
    this.options = {
      categories: categories.length ? categories : NAGA_CATEGORIES.map((c) => c.id),
      triggerLabel: options.triggerLabel ?? '梵',
      shortcut: options.shortcut ?? true,
      recentStorageKey: options.recentStorageKey === undefined ? DEFAULT_RECENT_KEY : options.recentStorageKey,
      recentMax: Math.max(0, options.recentMax ?? 14),
      maxCandidates: Math.max(1, options.maxCandidates ?? 60),
      dockBreakpoint: options.dockBreakpoint ?? 560,
      loadFonts: options.loadFonts ?? true,
    };
    this.uid = `naga-${++instanceSeq}`;
    this.fontLoader = this.options.loadFonts ? new FontLoader() : null;
    this.recents = this.loadRecents();
    this.activeTab = this.options.categories[0];
  }

  /** ポップアップが開いているか。 */
  get isOpen(): boolean {
    return this.openState;
  }

  /* ------------------------------------------------------------ *
   * 取り付け / 取り外し
   * ------------------------------------------------------------ */

  /** セレクタ、要素、または要素の列に取り付ける。input / textarea 以外は無視する。 */
  attach(target: string | Element | ArrayLike<Element> | Iterable<Element>): void {
    const elements: Element[] =
      typeof target === 'string'
        ? Array.from(document.querySelectorAll(target))
        : target instanceof Element
          ? [target]
          : Array.from(target as ArrayLike<Element>);
    const fields = elements.filter(isTarget).filter((el) => !this.fields.has(el));
    if (fields.length === 0) return;

    this.ensureDom();
    if (this.fontLoader) {
      this.fontLoader.loadFonts(FONT_SETTINGS).catch(() => {
        /* 書体の読込失敗は入力機能を止めない（Google Fonts 未到達など） */
      });
    }
    fields.forEach((field) => this.bindField(field));
  }

  /** 指定要素（省略時はすべて）から取り外す。取り付け先が無くなれば DOM と listener も片付ける。 */
  detach(target?: string | Element | ArrayLike<Element> | Iterable<Element>): void {
    const elements: Element[] =
      target === undefined
        ? Array.from(this.fields.keys())
        : typeof target === 'string'
          ? Array.from(document.querySelectorAll(target))
          : target instanceof Element
            ? [target]
            : Array.from(target as ArrayLike<Element>);
    for (const el of elements) {
      if (!isTarget(el)) continue;
      const binding = this.fields.get(el);
      if (!binding) continue;
      binding.cleanup();
      if (binding.addedClass) el.classList.remove('naga-enabled');
      if (binding.appliedFontFamily !== null && el.style.fontFamily === binding.appliedFontFamily) {
        el.style.fontFamily = '';
      }
      this.fields.delete(el);
      if (this.target === el) {
        this.close();
        this.target = null;
        if (this.trigger) this.trigger.hidden = true;
      }
    }
    if (this.fields.size === 0) this.teardownDom();
  }

  /** すべての取り付けを外し、DOM と listener を片付ける。 */
  destroy(): void {
    this.detach();
    this.teardownDom();
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

    this.openState = true;
    this.popup.hidden = false;
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.searchEl.value = '';
    this.selectedIndex = 0;
    if (this.recents.length) this.activeTab = 'recent';
    else if (this.activeTab === 'recent') this.activeTab = this.options.categories[0];
    this.renderTabs();
    this.refresh();
    this.positionPopup();
    this.searchEl.focus();
  }

  close({ refocus = false }: { refocus?: boolean } = {}): void {
    this.openSeq++;
    this.openState = false;
    this.composing = false;
    if (this.popup) this.popup.hidden = true;
    this.trigger?.setAttribute('aria-expanded', 'false');
    if (refocus && this.target) this.target.focus();
  }

  /* ------------------------------------------------------------ *
   * DOM の構築と片付け
   * ------------------------------------------------------------ */

  private ensureDom(): void {
    if (this.popup) return;
    ensureNagaStyle(document);
    const popupId = `${this.uid}-popup`;
    const listId = `${this.uid}-list`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'naga-trigger';
    trigger.id = `${this.uid}-trigger`;
    trigger.textContent = this.options.triggerLabel;
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
    titlebar.append(tabs, closeBtn);

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

    const list = document.createElement('div');
    list.className = 'naga-list';
    list.id = listId;
    list.setAttribute('role', 'listbox');

    const hint = document.createElement('div');
    hint.className = 'naga-hint';
    hint.textContent = '↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる';

    popup.append(titlebar, search, list, hint);

    const tabIds: TabId[] = ['recent', ...this.options.categories];
    for (const id of tabIds) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'naga-tab';
      b.id = `${this.uid}-tab-${id}`;
      b.dataset.category = id;
      b.textContent = id === 'recent' ? '最近' : NAGA_CATEGORIES.find((c) => c.id === id)!.label;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', listId);
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        this.activeTab = id;
        this.renderTabs();
        this.refresh();
        this.searchEl?.focus();
      });
      tabs.appendChild(b);
    }

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

    document.body.append(trigger, popup);
    this.trigger = trigger;
    this.popup = popup;
    this.tabsEl = tabs;
    this.searchEl = search;
    this.listEl = list;

    const onDocMouseDown = (e: MouseEvent) => {
      if (!this.openState || !this.popup) return;
      const t = e.target as Node | null;
      if (t && (this.popup.contains(t) || t === this.trigger || t === this.target)) return;
      this.close({ refocus: true });
    };
    const onResize = () => {
      if (this.openState) this.positionPopup();
      if (this.target && this.trigger && !this.trigger.hidden) this.positionTrigger(this.target);
    };
    const onScroll = () => {
      if (this.openState && this.popup && !this.popup.classList.contains('naga-is-docked')) this.positionPopup();
    };
    const vv = window.visualViewport;
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    vv?.addEventListener('resize', onResize);
    this.globalCleanup = () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      vv?.removeEventListener('resize', onResize);
    };
  }

  private teardownDom(): void {
    this.close();
    this.globalCleanup?.();
    this.globalCleanup = null;
    this.trigger?.remove();
    this.popup?.remove();
    this.trigger = null;
    this.popup = null;
    this.tabsEl = null;
    this.searchEl = null;
    this.listEl = null;
    this.target = null;
  }

  private bindField(field: NagaTarget): void {
    let appliedFontFamily: string | null = null;
    if (!field.style.fontFamily) {
      // loadFonts: false でも family 文字列は FontLoader と同じ並びにする（style は注入しない）
      const special = this.fontLoader
        ? this.fontLoader.getFontFamilyString(FONT_SETTINGS)
        : [fontFamilies.hentaigana, fontFamilies.siddham, fontFamilies.itaiji, 'serif'].join(', ');
      let current = '';
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
      // setTimeout を挟むと focus による付け替えと競合するため、同期的に activeElement で判定する
      if (this.openState) return;
      const ae = document.activeElement;
      if (ae !== this.trigger && !(isTarget(ae) && this.fields.has(ae))) {
        if (this.trigger) this.trigger.hidden = true;
      }
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (this.options.shortcut && (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'j') {
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
      cleanup: () => {
        el.removeEventListener('focus', onFocus);
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKeydown);
      },
    });
    if (document.activeElement === field) this.showTrigger(field);
  }

  /* ------------------------------------------------------------ *
   * 起動ボタン
   * ------------------------------------------------------------ */

  private showTrigger(field: NagaTarget): void {
    this.target = field;
    if (!this.trigger) return;
    this.positionTrigger(field);
    this.trigger.hidden = false;
  }

  private positionTrigger(field: NagaTarget): void {
    if (!this.trigger) return;
    const r = field.getBoundingClientRect();
    const size = 26;
    this.trigger.style.top = `${window.scrollY + r.top - size - 4}px`;
    this.trigger.style.left = `${window.scrollX + r.right - size}px`;
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
    this.candidates = searchNagaCandidates(this.currentEntries(), query, recentChars, this.options.maxCandidates);
    this.selectedIndex = 0;
    this.renderList();
  }

  private renderTabs(): void {
    this.tabsEl?.querySelectorAll<HTMLElement>('.naga-tab').forEach((b) => {
      const on = b.dataset.category === this.activeTab;
      b.classList.toggle('naga-is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
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
        if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
      }
    });
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
    // React / Vue 等に変更を知らせるため bubbles な input を発火する
    field.dispatchEvent(new Event('input', { bubbles: true }));

    // 連続入力: 開いたまま検索語だけクリアし、キャレットへ追従する
    if (this.searchEl) this.searchEl.value = '';
    this.selectedIndex = 0;
    this.refresh();
    this.positionPopup();
    this.searchEl?.focus();
  }

  /* ------------------------------------------------------------ *
   * 位置
   * ------------------------------------------------------------ */

  private positionPopup(): void {
    const field = this.target;
    const pop = this.popup;
    if (!field || !pop) return;
    const r = field.getBoundingClientRect();
    const vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth;
    const style = pop.style;

    // 狭幅（またはソフトキーボードで縮んだ viewport）は下部ドッキング
    if (vw < this.options.dockBreakpoint) {
      pop.classList.add('naga-is-docked');
      style.position = 'fixed';
      style.left = '8px';
      style.right = '8px';
      style.width = 'auto';
      style.top = 'auto';
      const bottom = vv ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) + 8 : 8;
      style.bottom = `${bottom}px`;
      return;
    }

    pop.classList.remove('naga-is-docked');
    style.position = 'absolute';
    style.width = `${Math.min(360, vw - 16)}px`;

    let anchor: { x: number; y: number; lineHeight: number } | null = null;
    try {
      anchor = this.measureCaret(field);
    } catch {
      anchor = null;
    }

    const h = pop.offsetHeight || 320;
    const w = pop.offsetWidth || 360;
    const vpBottom = vv ? vv.height + vv.offsetTop : window.innerHeight;
    let top: number;
    let left: number;
    if (anchor) {
      top = anchor.y + anchor.lineHeight + 2;
      left = anchor.x;
    } else {
      top = window.scrollY + r.bottom + 4;
      left = window.scrollX + r.left;
    }
    if (top - window.scrollY + h > vpBottom) {
      top = anchor ? anchor.y - h - 2 : window.scrollY + r.top - h - 4;
    }
    if (left - window.scrollX + w > vw) left = window.scrollX + vw - w - 8;
    if (left < window.scrollX + 4) left = window.scrollX + 4;

    style.top = `${top}px`;
    style.left = `${left}px`;
    style.bottom = 'auto';
    style.right = 'auto';
  }

  /** キャレット座標の計測（ミラー要素方式）。 */
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
    document.body.appendChild(mirror);
    const mRect = marker.getBoundingClientRect();
    const dRect = mirror.getBoundingClientRect();
    mirror.remove();

    const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 16) * 1.2;
    const relX = mRect.left - dRect.left - (field.scrollLeft || 0);
    const relY = mRect.top - dRect.top - (field.scrollTop || 0);
    return {
      x: window.scrollX + rect.left + relX,
      y: window.scrollY + rect.top + relY,
      lineHeight,
    };
  }

  /* ------------------------------------------------------------ *
   * 直近使用
   * ------------------------------------------------------------ */

  private loadRecents(): NagaCandidate[] {
    const key = this.options.recentStorageKey;
    if (!key) return [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed.filter(isCandidate).slice(0, this.options.recentMax) : [];
    } catch {
      return [];
    }
  }

  private pushRecent(candidate: NagaCandidate): void {
    const entry: NagaCandidate = {
      char: candidate.char,
      reading: candidate.reading,
      description: candidate.description,
      category: candidate.category,
    };
    this.recents = [entry, ...this.recents.filter((r) => r.char !== entry.char)].slice(0, this.options.recentMax);
    const key = this.options.recentStorageKey;
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(this.recents));
    } catch {
      /* private mode 等は黙殺する */
    }
  }
}
