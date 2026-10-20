/**
 * <naga-ime>（custom element）の契約の単体テスト（nov26-m3-t2 タスク設計 §3.6・§7 t2/AC2・AC3）。
 *
 * マイルストーン設計 §5.3（属性⇔プロパティ・規則 1〜6）・§5.4（メソッド）・§5.5（イベント）の
 * 表を回す。静的 import で登録済みのクラスを使う（§5.2 の表の 2 行目）。
 * テストの名前の [AC2-x] は、タスク設計 §7.1 の (AC2-mark) が機械で照合する印。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';
import { NAGA_CATEGORIES } from '@/lib/ime/naga-dictionary';
import type { NagaCandidate } from '@/lib/ime/naga-types';

const DICTIONARY_TEST_TIMEOUT_MS = 8000;
const ALL = NAGA_CATEGORIES.map((c) => c.id);
const RECENT_KEY = 'nagarjuna-naga-recents';

type Prop =
  | 'htmlFor'
  | 'categories'
  | 'triggerLabel'
  | 'shortcut'
  | 'recentStorageKey'
  | 'recentMax'
  | 'maxCandidates'
  | 'dockBreakpoint'
  | 'loadFonts';

interface Row {
  attr: string;
  prop: Prop;
  def: unknown;
  /** 属性の値 → 期待するプロパティの値（1 つ目と 2 つ目は違う値） */
  a1: [string, unknown];
  a2: [string, unknown];
  /** プロパティへ代入する値（a1・a2 と違う実効値になるもの） */
  p: unknown;
}

const ROWS: Row[] = [
  { attr: 'for', prop: 'htmlFor', def: '', a1: ['x1', 'x1'], a2: ['x1 x2', 'x1 x2'], p: 'x3' },
  {
    attr: 'categories',
    prop: 'categories',
    def: ALL,
    a1: ['itaiji kumimoji', ['itaiji', 'kumimoji']],
    a2: ['siddham', ['siddham']],
    p: ['hentaigana'],
  },
  { attr: 'trigger-label', prop: 'triggerLabel', def: '梵', a1: ['A', 'A'], a2: ['B', 'B'], p: 'C' },
  { attr: 'shortcut', prop: 'shortcut', def: true, a1: ['', true], a2: ['false', false], p: true },
  { attr: 'recent-storage-key', prop: 'recentStorageKey', def: RECENT_KEY, a1: ['k1', 'k1'], a2: ['k2', 'k2'], p: 'k3' },
  { attr: 'recent-max', prop: 'recentMax', def: 14, a1: ['3', 3], a2: ['0', 0], p: 7 },
  { attr: 'max-candidates', prop: 'maxCandidates', def: 60, a1: ['5', 5], a2: ['10', 10], p: 20 },
  { attr: 'dock-breakpoint', prop: 'dockBreakpoint', def: 560, a1: ['100', 100], a2: ['0', 0], p: 300 },
  { attr: 'load-fonts', prop: 'loadFonts', def: true, a1: ['true', true], a2: ['false', false], p: true },
];

function create(): NagaIME {
  const el = document.createElement('naga-ime') as NagaIME;
  document.body.appendChild(el);
  return el;
}

function get(el: NagaIME, prop: Prop): unknown {
  return (el as unknown as Record<string, unknown>)[prop];
}

function set(el: NagaIME, prop: Prop, value: unknown): void {
  (el as unknown as Record<string, unknown>)[prop] = value;
}

function popupOf(el: NagaIME): HTMLElement {
  return el.shadowRoot!.querySelector('.naga-popup') as HTMLElement;
}

function tabIds(el: NagaIME): string[] {
  return Array.from(popupOf(el).querySelectorAll<HTMLElement>('.naga-tab')).map((t) => t.dataset.category ?? '');
}

function activeTab(el: NagaIME): string | undefined {
  return (popupOf(el).querySelector('.naga-tab.naga-is-active') as HTMLElement | null)?.dataset.category;
}

function selectTab(el: NagaIME, id: string): void {
  (popupOf(el).querySelector(`.naga-tab[data-category="${id}"]`) as HTMLButtonElement).click();
}

function commitByReading(el: NagaIME, reading: string): void {
  const search = el.shadowRoot!.querySelector('.naga-search') as HTMLInputElement;
  search.value = reading;
  search.dispatchEvent(new Event('input', { bubbles: true }));
  search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  warn = vi.spyOn(console, 'warn');
});

afterEach(() => {
  document.querySelectorAll('naga-ime').forEach((el) => (el as NagaIME).destroy());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('<naga-ime> の形', () => {
  it('タグ名 naga-ime・open Shadow DOM・影の中に style が 1 つ（document.head には入れない）', () => {
    const el = new NagaIME();
    expect(el.tagName.toLowerCase()).toBe('naga-ime');
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.mode).toBe('open');
    expect(el.shadowRoot!.querySelectorAll('style[data-naga-style]')).toHaveLength(1);
    expect(document.head.querySelector('style[data-naga-style]')).toBeNull();
    // コンストラクタは属性も light DOM の子も作らない
    expect(el.attributes).toHaveLength(0);
    expect(el.childNodes).toHaveLength(0);
  });

  it('observedAttributes は 9 つの属性', () => {
    expect([...NagaIME.observedAttributes].sort()).toEqual(ROWS.map((r) => r.attr).sort());
  });

  it('new NagaIME(options) は各キーをプロパティへ代入し、属性を変えない', () => {
    const el = new NagaIME({
      categories: ['itaiji'],
      triggerLabel: 'X',
      shortcut: false,
      recentStorageKey: null,
      recentMax: 2,
      maxCandidates: 3,
      dockBreakpoint: 4,
      loadFonts: false,
    });
    expect(el.categories).toEqual(['itaiji']);
    expect(el.triggerLabel).toBe('X');
    expect(el.shortcut).toBe(false);
    expect(el.recentStorageKey).toBeNull();
    expect(el.recentMax).toBe(2);
    expect(el.maxCandidates).toBe(3);
    expect(el.dockBreakpoint).toBe(4);
    expect(el.loadFonts).toBe(false);
    expect(el.attributes).toHaveLength(0);
  });
});

describe('属性⇔プロパティ（§5.3 の表を回す）', () => {
  for (const r of ROWS) {
    it(`[AC2-a] ${r.attr}: 付ける・変える・外す（外すと既定値）`, () => {
      const el = create();
      expect(get(el, r.prop)).toEqual(r.def);
      el.setAttribute(r.attr, r.a1[0]);
      expect(get(el, r.prop)).toEqual(r.a1[1]);
      el.setAttribute(r.attr, r.a2[0]);
      expect(get(el, r.prop)).toEqual(r.a2[1]);
      el.removeAttribute(r.attr);
      expect(get(el, r.prop)).toEqual(r.def);
    });

    it(`[AC2-b] ${r.prop}: 代入の前後で getAttribute('${r.attr}') が変わらない`, () => {
      const el = create();
      expect(el.getAttribute(r.attr)).toBeNull();
      set(el, r.prop, r.p);
      expect(el.getAttribute(r.attr)).toBeNull();
      el.setAttribute(r.attr, r.a1[0]);
      set(el, r.prop, r.p);
      expect(el.getAttribute(r.attr)).toBe(r.a1[0]);
      expect(get(el, r.prop)).toEqual(r.p);
    });

    it(`[AC2-c] ${r.attr}: 属性 → 代入 → 属性の順で、最後に変えた方の値`, () => {
      const el = create();
      el.setAttribute(r.attr, r.a1[0]);
      expect(get(el, r.prop)).toEqual(r.a1[1]);
      set(el, r.prop, r.p);
      expect(get(el, r.prop)).toEqual(r.p);
      el.setAttribute(r.attr, r.a2[0]);
      expect(get(el, r.prop)).toEqual(r.a2[1]);
    });

    it(`[AC2-c'] ${r.attr}: 代入の後に前と同じ値で setAttribute すると属性の値へ戻る`, () => {
      const el = create();
      el.setAttribute(r.attr, r.a1[0]);
      set(el, r.prop, r.p);
      expect(get(el, r.prop)).toEqual(r.p);
      el.setAttribute(r.attr, r.a1[0]);
      expect(get(el, r.prop)).toEqual(r.a1[1]);
    });
  }

  it('[AC2-f] categories の実効値（[]・未知だけ・重複・属性の bogus bogus）と読み出しの複製', () => {
    const el = create();
    el.categories = [];
    expect(el.categories).toEqual(ALL);
    el.categories = ['bogus' as never];
    expect(el.categories).toEqual(ALL);
    el.categories = ['itaiji', 'itaiji', 'bogus' as never, 'kumimoji', 'itaiji'];
    expect(el.categories).toEqual(['itaiji', 'kumimoji']);
    el.categories = 'itaiji' as never;
    expect(el.categories).toEqual(ALL);
    el.setAttribute('categories', 'bogus bogus');
    expect(el.categories).toEqual(ALL);
    el.setAttribute('categories', '  kumimoji\titaiji  kumimoji ');
    expect(el.categories).toEqual(['kumimoji', 'itaiji']);
    // 読み出しは複製（書き換えても実効値は変わらない）
    const copy = el.categories;
    copy.push('siddham');
    expect(el.categories).toEqual(['kumimoji', 'itaiji']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('[AC2-g] 不正な属性値と代入は黙って既定値（console.warn 0 回・例外なし）', () => {
    const el = create();
    const attrCases: Array<[string, string, Prop, unknown]> = [
      ['shortcut', 'yes', 'shortcut', true],
      ['shortcut', 'shortcut', 'shortcut', true],
      ['load-fonts', 'nope', 'loadFonts', true],
      ['load-fonts', 'FALSE', 'loadFonts', true],
      ['recent-max', '-1', 'recentMax', 14],
      ['recent-max', 'abc', 'recentMax', 14],
      ['recent-max', '', 'recentMax', 14],
      ['recent-max', 'Infinity', 'recentMax', 14],
      ['recent-max', '2.7', 'recentMax', 2],
      ['max-candidates', '0', 'maxCandidates', 60],
      ['max-candidates', '0.5', 'maxCandidates', 60],
      ['max-candidates', 'NaN', 'maxCandidates', 60],
      ['dock-breakpoint', '-5', 'dockBreakpoint', 560],
      ['dock-breakpoint', '', 'dockBreakpoint', 560],
      ['trigger-label', '', 'triggerLabel', '梵'],
      ['recent-storage-key', '', 'recentStorageKey', RECENT_KEY],
    ];
    for (const [attr, value, prop, expected] of attrCases) {
      set(el, prop, prop === 'recentMax' ? 1 : prop === 'maxCandidates' ? 2 : prop === 'dockBreakpoint' ? 3 : get(el, prop));
      el.setAttribute(attr, value);
      expect(get(el, prop), `${attr}="${value}"`).toEqual(expected);
      el.removeAttribute(attr);
    }
    const propCases: Array<[Prop, unknown, unknown]> = [
      ['recentMax', -1, 14],
      ['recentMax', Number.NaN, 14],
      ['recentMax', '3', 14],
      ['recentMax', 4.9, 4],
      ['maxCandidates', 0, 60],
      ['maxCandidates', Number.POSITIVE_INFINITY, 60],
      ['dockBreakpoint', -1, 560],
      ['shortcut', 'no', true],
      ['shortcut', 0, true],
      ['loadFonts', null, true],
      ['triggerLabel', '', '梵'],
      ['triggerLabel', 5, '梵'],
      ['recentStorageKey', '', RECENT_KEY],
      ['recentStorageKey', 5, RECENT_KEY],
      ['recentStorageKey', undefined, RECENT_KEY],
      ['htmlFor', 5, ''],
    ];
    for (const [prop, value, expected] of propCases) {
      expect(() => set(el, prop, value)).not.toThrow();
      expect(get(el, prop), `${prop} = ${String(value)}`).toEqual(expected);
    }
    // 真偽の属性: 属性名と同じ値・空・"true" は true、"false" は false
    el.setAttribute('shortcut', 'false');
    expect(el.shortcut).toBe(false);
    el.setAttribute('shortcut', 'true');
    expect(el.shortcut).toBe(true);
    el.setAttribute('load-fonts', 'load-fonts');
    expect(el.loadFonts).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('最近使った文字を止める手段（§5.3 規則 6・§0.2）', () => {
  it(
    '[AC2-d] recentStorageKey = null では localStorage を読みも書きもせず、「最近」タブは要素の中だけで働く',
    async () => {
      localStorage.setItem(RECENT_KEY, JSON.stringify([{ char: 'ゟ', reading: 'より', description: '', category: 'kumimoji' }]));
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const field = document.createElement('input');
      document.body.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      el.recentStorageKey = null;
      expect(el.recentStorageKey).toBeNull();
      el.attach(field);
      await el.open(field);
      expect(tabIds(el)).toContain('recent');
      expect(activeTab(el)).toBe('hentaigana');
      selectTab(el, 'kumimoji');
      commitByReading(el, 'こと');
      el.close();
      await el.open(field);
      expect(activeTab(el)).toBe('recent');
      const items = Array.from(popupOf(el).querySelectorAll<HTMLElement>('.naga-item')).map((i) => i.dataset.char);
      expect(items).toEqual(['ヿ']);
      expect(getItem).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
      expect(el.recentStorageKey).toBeNull();
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '[AC2-e] 属性 recent-max="0" では localStorage を読み書きせず、「最近」タブが無く、開くタブは直前のカテゴリ',
    async () => {
      localStorage.setItem(RECENT_KEY, JSON.stringify([{ char: 'ゟ', reading: 'より', description: '', category: 'kumimoji' }]));
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const field = document.createElement('input');
      field.id = 'rm0';
      document.body.appendChild(field);
      document.body.insertAdjacentHTML('beforeend', '<naga-ime for="rm0" recent-max="0" load-fonts="false" categories="itaiji kumimoji"></naga-ime>');
      const el = document.querySelector('naga-ime') as NagaIME;
      expect(el.recentMax).toBe(0);
      await el.open(field);
      expect(tabIds(el)).toEqual(['itaiji', 'kumimoji']);
      expect(activeTab(el)).toBe('itaiji'); // 初回は categories の先頭
      selectTab(el, 'kumimoji');
      commitByReading(el, 'より');
      expect(field.value).toBe('ゟ');
      el.close();
      await el.open(field);
      expect(tabIds(el)).toEqual(['itaiji', 'kumimoji']);
      expect(activeTab(el)).toBe('kumimoji'); // 直前に選ばれていたカテゴリ
      expect(getItem).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
      // 既に保存された値は消さない
      expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)[0].char).toBe('ゟ');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '[AC2-e] プロパティ recentMax = 0 でも同じ。起動後に 0 へ／0 から戻す遷移',
    async () => {
      const stored: NagaCandidate[] = [{ char: 'ゟ', reading: 'より', description: '', category: 'kumimoji' }];
      localStorage.setItem(RECENT_KEY, JSON.stringify(stored));
      const field = document.createElement('input');
      document.body.appendChild(field);

      // 0 で始める: 読みも書きもしない
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const el = new NagaIME({ loadFonts: false, recentMax: 0 });
      el.attach(field);
      await el.open(field);
      expect(tabIds(el)).toEqual(ALL);
      expect(activeTab(el)).toBe('hentaigana');
      commitByReading(el, 'か');
      expect(getItem).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();

      // 0 から 1 以上へ: その時点で読み直し、「最近」タブを先頭に作り直す
      el.recentMax = 5;
      expect(getItem).toHaveBeenCalledWith(RECENT_KEY);
      expect(tabIds(el)).toEqual(['recent', ...ALL]);
      el.close();
      await el.open(field);
      expect(activeTab(el)).toBe('recent');
      expect(Array.from(popupOf(el).querySelectorAll<HTMLElement>('.naga-item')).map((i) => i.dataset.char)).toEqual(['ゟ']);

      // 開いたまま 0 へ: 「最近」タブを外し、選択は categories の先頭へ移る。保存された値は消さない
      getItem.mockClear();
      setItem.mockClear();
      el.recentMax = 0;
      expect(tabIds(el)).toEqual(ALL);
      expect(activeTab(el)).toBe('hentaigana');
      expect(el.isOpen).toBe(true);
      commitByReading(el, 'か');
      el.close();
      await el.open(field);
      expect(tabIds(el)).toEqual(ALL);
      expect(getItem).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual(stored);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});

describe('起動後の変更（§5.3 の表の「起動後の変更」列）', () => {
  it(
    'categories を変えるとタブを作り直し、開いたまま。triggerLabel は起動ボタンの文字を替える',
    async () => {
      const field = document.createElement('input');
      document.body.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      el.attach(field);
      await el.open(field);
      el.setAttribute('categories', 'kumimoji itaiji');
      expect(tabIds(el)).toEqual(['recent', 'kumimoji', 'itaiji']);
      expect(activeTab(el)).toBe('kumimoji');
      expect(el.isOpen).toBe(true);
      el.triggerLabel = '字';
      expect(el.shadowRoot!.querySelector('.naga-trigger')!.textContent).toBe('字');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    'recentStorageKey を変えると新しいキーから読み直す',
    async () => {
      localStorage.setItem('other-key', JSON.stringify([{ char: 'ヿ', reading: 'こと', description: '', category: 'kumimoji' }]));
      const field = document.createElement('input');
      document.body.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      el.attach(field);
      await el.open(field);
      expect(activeTab(el)).toBe('hentaigana');
      el.close();
      el.setAttribute('recent-storage-key', 'other-key');
      await el.open(field);
      expect(activeTab(el)).toBe('recent');
      expect(Array.from(popupOf(el).querySelectorAll<HTMLElement>('.naga-item')).map((i) => i.dataset.char)).toEqual(['ヿ']);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );
});

describe('メソッドとイベント（§5.4・§5.5）', () => {
  it(
    'open / close / toggle と isOpen、nagaOpen・nagaClose の detail と性質',
    async () => {
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      const field = document.createElement('input');
      wrapper.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      wrapper.appendChild(el);
      const events: Event[] = [];
      document.addEventListener('nagaOpen', (e) => events.push(e));
      document.addEventListener('nagaClose', (e) => events.push(e));
      el.attach(field);
      expect(el.isOpen).toBe(false);

      // 開いていないときの close() は nagaClose を出さない
      el.close();
      expect(events).toHaveLength(0);

      await el.open(field);
      expect(el.isOpen).toBe(true);
      await el.toggle(field);
      expect(el.isOpen).toBe(false);
      await el.toggle(field);
      expect(el.isOpen).toBe(true);
      el.close();
      expect(el.isOpen).toBe(false);

      expect(events.map((e) => e.type)).toEqual(['nagaOpen', 'nagaClose', 'nagaOpen', 'nagaClose']);
      for (const e of events) {
        expect(e).toBeInstanceOf(CustomEvent);
        expect(e.bubbles).toBe(true);
        expect(e.composed).toBe(false);
        expect(e.cancelable).toBe(false);
        expect(e.target).toBe(el);
        expect((e as CustomEvent<{ field: unknown }>).detail.field).toBe(field);
      }

      // 取り付けていない欄では開かない
      const other = document.createElement('input');
      document.body.appendChild(other);
      await el.open(other);
      expect(el.isOpen).toBe(false);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it(
    '確定で欄へ InputEvent（composed・insertText・data）を出し、その後に nagaCommit（candidate は複製）',
    async () => {
      const field = document.createElement('textarea');
      document.body.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      el.attach(field);
      await el.open(field);
      const order: string[] = [];
      const inputs: Event[] = [];
      document.addEventListener('input', (e) => {
        if (e.target === field) {
          inputs.push(e);
          order.push('input');
        }
      });
      const commits: CustomEvent[] = [];
      el.addEventListener('nagaCommit', (e) => {
        commits.push(e);
        order.push('nagaCommit');
      });
      selectTab(el, 'kumimoji');
      commitByReading(el, 'より');

      expect(field.value).toBe('ゟ');
      expect(order).toEqual(['input', 'nagaCommit']);
      const input = inputs[0] as InputEvent;
      expect(input).toBeInstanceOf(InputEvent);
      expect(input.bubbles).toBe(true);
      expect(input.composed).toBe(true);
      expect(input.inputType).toBe('insertText');
      expect(input.data).toBe('ゟ');

      const commit = commits[0];
      expect(commit).toBeInstanceOf(CustomEvent);
      expect(commit.bubbles).toBe(true);
      expect(commit.composed).toBe(false);
      expect(commit.cancelable).toBe(false);
      expect(commit.detail.field).toBe(field);
      expect(commit.detail.candidate).toMatchObject({ char: 'ゟ', reading: 'より', category: 'kumimoji' });
      // 複製: 書き換えても次の確定に影響しない
      commit.detail.candidate.char = 'X';
      commitByReading(el, 'より');
      expect(field.value).toBe('ゟゟ');
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it('attach は未接続の要素を document.body へ入れる。destroy は要素を DOM から外す', () => {
    const field = document.createElement('input');
    document.body.appendChild(field);
    const el = new NagaIME({ loadFonts: false });
    expect(el.isConnected).toBe(false);
    el.attach(field);
    expect(el.parentNode).toBe(document.body);
    expect(field.classList.contains('naga-enabled')).toBe(true);
    // 部品は影の中にだけある
    expect(el.shadowRoot!.querySelectorAll('.naga-popup')).toHaveLength(1);
    expect(el.shadowRoot!.querySelectorAll('.naga-trigger')).toHaveLength(1);
    expect(document.body.querySelectorAll(':scope > .naga-popup, :scope > .naga-trigger')).toHaveLength(0);
    el.destroy();
    expect(el.isConnected).toBe(false);
    expect(field.classList.contains('naga-enabled')).toBe(false);
  });

  it(
    '外側の mousedown で閉じる。自分の部品の mousedown では閉じない。影の中の欄へ focus が戻ると閉じ、欄の mousedown だけでは閉じない（0436・0438）',
    async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: 'open' });
      const field = document.createElement('input');
      root.appendChild(field);
      const el = new NagaIME({ loadFonts: false });
      el.attach(field);
      await el.open(field);
      // 【NOV26-IM-NAGA-POPUP-REFOCUS-0436】利用者が元の欄を触ったら閉じる（影の中の欄も同じ）。
      // 0436 以前は「欄の mousedown では閉じない」だったが、実機の「フォーカスを戻しても連携しない」
      // 「改行するとカーソルが IME の下に回り込む」への対応で閉じる側に変えた
      // 【0438 MAJOR-1】欄の mousedown だけでは閉じない（iOS で欄の上から始めたスクロールで閉じないため）。
      // 閉じるのは欄へ focus が戻ったとき
      field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
      expect(el.isOpen).toBe(true);
      field.focus();
      expect(el.isOpen).toBe(false);
      await el.open(field);
      popupOf(el).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
      expect(el.isOpen).toBe(true);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
      expect(el.isOpen).toBe(false);
    },
    DICTIONARY_TEST_TIMEOUT_MS,
  );

  it('影の中の欄の focus で trigger が出て、影の中の欄から外れると消える（深い activeElement）', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const f1 = document.createElement('input');
    const f2 = document.createElement('input');
    root.append(f1, f2);
    const el = new NagaIME({ loadFonts: false });
    el.attach([f1, f2]);
    const trigger = el.shadowRoot!.querySelector('.naga-trigger') as HTMLButtonElement;
    f1.focus();
    expect(trigger.hidden).toBe(false);
    f2.focus();
    expect(trigger.hidden).toBe(false);
    const plain = document.createElement('input');
    document.body.appendChild(plain);
    plain.focus();
    expect(trigger.hidden).toBe(true);
  });

  it('既に focus 済みの影の中の欄へ attach すると trigger が出る', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const f1 = document.createElement('input');
    root.append(f1);
    f1.focus();
    const el = new NagaIME({ loadFonts: false });
    el.attach(f1);
    expect((el.shadowRoot!.querySelector('.naga-trigger') as HTMLButtonElement).hidden).toBe(false);
  });
});

describe('for 属性（§5.3 の htmlFor の行）', () => {
  it('文書の id で付け、htmlFor の代入で付け直す（for 属性は変えない）。後から足した欄は付かない', () => {
    document.body.insertAdjacentHTML('beforeend', '<input id="fa"><input id="fb"><input id="fc">');
    const fa = document.getElementById('fa') as HTMLInputElement;
    const fb = document.getElementById('fb') as HTMLInputElement;
    const fc = document.getElementById('fc') as HTMLInputElement;
    const el = document.createElement('naga-ime') as NagaIME;
    el.setAttribute('load-fonts', 'false');
    el.setAttribute('for', 'fa fb missing');
    document.body.appendChild(el);
    expect(fa.classList.contains('naga-enabled')).toBe(true);
    expect(fb.classList.contains('naga-enabled')).toBe(true);
    expect(fc.classList.contains('naga-enabled')).toBe(false);

    el.htmlFor = 'fc';
    expect(el.getAttribute('for')).toBe('fa fb missing');
    expect(el.htmlFor).toBe('fc');
    expect(fa.classList.contains('naga-enabled')).toBe(false);
    expect(fb.classList.contains('naga-enabled')).toBe(false);
    expect(fc.classList.contains('naga-enabled')).toBe(true);

    // 後から足した欄（id が for に一致しても）は付かない。attach() で付ける
    el.htmlFor = 'fd';
    document.body.insertAdjacentHTML('beforeend', '<input id="fd">');
    const fd = document.getElementById('fd') as HTMLInputElement;
    expect(fd.classList.contains('naga-enabled')).toBe(false);
    el.attach(fd);
    expect(fd.classList.contains('naga-enabled')).toBe(true);
  });

  it('attach() で付けた欄は for の付け直しで外れない', () => {
    document.body.insertAdjacentHTML('beforeend', '<input id="ga"><input id="gb">');
    const ga = document.getElementById('ga') as HTMLInputElement;
    const gb = document.getElementById('gb') as HTMLInputElement;
    const el = new NagaIME({ loadFonts: false });
    el.attach(gb);
    el.htmlFor = 'ga gb';
    expect(ga.classList.contains('naga-enabled')).toBe(true);
    el.htmlFor = '';
    expect(ga.classList.contains('naga-enabled')).toBe(false);
    expect(gb.classList.contains('naga-enabled')).toBe(true);
  });

  it('影の中に置いた <naga-ime for> は同じ影の中の id を引く（getRootNode）', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<input id="sx"><naga-ime for="sx" load-fonts="false"></naga-ime>';
    const field = root.getElementById('sx') as HTMLInputElement;
    expect(field.classList.contains('naga-enabled')).toBe(true);
    // 文書に同じ id の欄があっても引かない
    document.body.insertAdjacentHTML('beforeend', '<input id="sx2">');
    const el = root.querySelector('naga-ime') as NagaIME;
    el.htmlFor = 'sx2';
    expect((document.getElementById('sx2') as HTMLInputElement).classList.contains('naga-enabled')).toBe(false);
  });
});

describe('切断と再接続（§5.4）', () => {
  it('同じタスク内の移動では作り直さない。切断のままなら次のマイクロタスクで全部 detach する', async () => {
    document.body.insertAdjacentHTML('beforeend', '<input id="ma"><div id="box"></div>');
    const ma = document.getElementById('ma') as HTMLInputElement;
    const box = document.getElementById('box') as HTMLDivElement;
    const extra = document.createElement('input');
    document.body.appendChild(extra);
    const el = document.createElement('naga-ime') as NagaIME;
    el.setAttribute('load-fonts', 'false');
    el.setAttribute('for', 'ma');
    document.body.appendChild(el);
    el.attach(extra);
    const trigger = el.shadowRoot!.querySelector('.naga-trigger');
    expect(trigger).not.toBeNull();

    box.appendChild(el); // 同じタスク内の付け替え
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot!.querySelector('.naga-trigger')).toBe(trigger);
    expect(ma.classList.contains('naga-enabled')).toBe(true);
    expect(extra.classList.contains('naga-enabled')).toBe(true);

    el.remove();
    expect(ma.classList.contains('naga-enabled')).toBe(true); // まだ同じタスク
    await Promise.resolve();
    await Promise.resolve();
    expect(ma.classList.contains('naga-enabled')).toBe(false);
    expect(extra.classList.contains('naga-enabled')).toBe(false);
    expect(el.shadowRoot!.querySelector('.naga-trigger')).toBeNull();

    // 再接続では for だけを引き直す（JS で attach した欄は付け直さない）
    document.body.appendChild(el);
    expect(ma.classList.contains('naga-enabled')).toBe(true);
    expect(extra.classList.contains('naga-enabled')).toBe(false);
  });
});
