/**
 * NagaIME の単体テスト（oct26-m7-t1 設計 v4 §5.3.2 AC4 ③・AC5）。
 *
 * PoC（Playground/NextNaga/js/naga-ime.js）の UX を TypeScript 化した NagaIME が、
 * bundle 辞書・FontLoader・明示 trigger・keyboard・composition 非介入・setRangeText・
 * bubbles input・recent を満たし、通常入力を妨げないことを確かめる。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NagaIME } from '@/lib/ime/naga-ime';
import { FontLoader } from '@/lib/fonts/loader';

// 辞書（生成済み dictionary.ts）の動的 import を伴うテストは、vitest.config.ts の testTimeout: 1000 では
// 高負荷時に偽の赤になる（実装レビュー Round 1 Minor-1）。legacy-manager.test.ts と同じく個別に 8000ms を与える。
const DICTIONARY_TEST_TIMEOUT_MS = 8000;

const DEPRECATION_PREFIX = '[nagarjuna] DEPRECATED:';

function key(type: 'keydown', init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
}

function popupOf(): HTMLElement {
  return document.body.querySelector('.naga-popup') as HTMLElement;
}

function searchOf(): HTMLInputElement {
  return popupOf().querySelector('.naga-search') as HTMLInputElement;
}

function itemsOf(): HTMLElement[] {
  return Array.from(popupOf().querySelectorAll('.naga-item')) as HTMLElement[];
}

function typeSearch(value: string): void {
  const search = searchOf();
  search.value = value;
  search.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectTab(category: string): void {
  const tab = popupOf().querySelector(`.naga-tab[data-category="${category}"]`) as HTMLButtonElement;
  tab.click();
}

describe('NagaIME', () => {
  let field: HTMLInputElement;
  let textarea: HTMLTextAreaElement;
  let ime: NagaIME;

  beforeEach(() => {
    localStorage.clear();
    field = document.createElement('input');
    field.type = 'text';
    textarea = document.createElement('textarea');
    document.body.append(field, textarea);
    ime = new NagaIME({ loadFonts: true });
  });

  afterEach(() => {
    ime.destroy();
    field.remove();
    textarea.remove();
    vi.restoreAllMocks();
  });

  it('bundle 辞書を使い fetch を呼ばない。辞書のカテゴリと説明文で検索できる（AC5）', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    try {
      ime.attach(field);
      await ime.open(field);
      expect(ime.isOpen).toBe(true);

      const tabs = Array.from(popupOf().querySelectorAll('.naga-tab')).map((t) => (t as HTMLElement).dataset.category);
      expect(tabs).toEqual(['recent', 'hentaigana', 'siddham', 'buddha', 'itaiji', 'kumimoji']);

      selectTab('itaiji');
      typeSearch('とき');
      expect(itemsOf().map((el) => el.dataset.char)).toContain('旹');

      // ひらがな以外は説明文の部分一致（「時」→ 時の異体字）
      typeSearch('時');
      expect(itemsOf().map((el) => el.dataset.char)).toContain('旹');
      expect(itemsOf()[0].querySelector('.naga-desc')!.textContent).toContain('時');

      selectTab('kumimoji');
      typeSearch('より');
      expect(itemsOf().map((el) => el.dataset.char)).toEqual(['ゟ']);

      // 読みは完全一致を前方一致より先に並べる
      selectTab('hentaigana');
      typeSearch('か');
      const readings = itemsOf().map((el) => el.querySelector('.naga-reading')!.textContent);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings.every((r) => r!.startsWith('か'))).toBe(true);
      expect(readings[0]).toBe('か');

      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('FontLoader で特殊文字フォントを読み、対象の inline fontFamily が空なら特殊フォントを足す（AC5）', () => {
    const load = vi.spyOn(FontLoader.prototype, 'loadFonts');
    const local = new NagaIME();
    local.attach(field);
    expect(load).toHaveBeenCalledWith({ hentaigana: true, siddham: true, itaiji: true });
    expect(field.style.fontFamily).toContain('NINJAL Hentaigana');
    expect(field.style.fontFamily).toContain('Noto Sans Siddham');
    local.destroy();
    // 自分が設定した値のままなら detach で空へ戻す
    expect(field.style.fontFamily).toBe('');
  });

  it('focus で trigger だけを出し、trigger の mousedown と Ctrl/Cmd+J で開閉する（AC5）', async () => {
    ime.attach(field);
    const trigger = document.body.querySelector('.naga-trigger') as HTMLButtonElement;
    expect(trigger.hidden).toBe(true);

    field.focus();
    expect(trigger.hidden).toBe(false);
    expect(ime.isOpen).toBe(false);
    expect(popupOf().hidden).toBe(true);

    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    trigger.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true); // 対象のフォーカスを奪わない
    await vi.waitFor(() => expect(ime.isOpen).toBe(true));
    expect(popupOf().hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    ime.close({ refocus: true });
    expect(ime.isOpen).toBe(false);
    expect(document.activeElement).toBe(field);

    const ctrlJ = key('keydown', { key: 'j', ctrlKey: true });
    field.dispatchEvent(ctrlJ);
    expect(ctrlJ.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(ime.isOpen).toBe(true));

    // 開いている状態で同じ対象から Cmd+J → 閉じる
    const cmdJ = key('keydown', { key: 'J', metaKey: true });
    field.dispatchEvent(cmdJ);
    await vi.waitFor(() => expect(ime.isOpen).toBe(false));
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('閉じている間は通常入力の keydown / input を preventDefault しない（AC5）', () => {
    ime.attach(field);
    field.focus();
    for (const k of ['a', 'あ', 'Enter', 'Tab', 'Escape', '1', 'ArrowDown', 'j']) {
      const ev = key('keydown', { key: k });
      field.dispatchEvent(ev);
      expect(ev.defaultPrevented, k).toBe(false);
    }
    const input = new Event('input', { bubbles: true, cancelable: true });
    field.dispatchEvent(input);
    expect(input.defaultPrevented).toBe(false);
    expect(ime.isOpen).toBe(false);
  });

  it('shortcut: false では Ctrl+J を消費しない', () => {
    const local = new NagaIME({ shortcut: false });
    const other = document.createElement('input');
    document.body.appendChild(other);
    local.attach(other);
    const ev = key('keydown', { key: 'j', ctrlKey: true });
    other.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(local.isOpen).toBe(false);
    local.destroy();
    other.remove();
  });

  it('検索欄の composition 中の keydown（Enter / 数字）を消費せず、確定もしない（AC5）', async () => {
    ime.attach(field);
    await ime.open(field);
    selectTab('kumimoji');
    typeSearch('より');
    expect(itemsOf()).toHaveLength(1);

    const search = searchOf();
    search.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    const enterDuring = key('keydown', { key: 'Enter' });
    search.dispatchEvent(enterDuring);
    const digitDuring = key('keydown', { key: '1' });
    search.dispatchEvent(digitDuring);
    const composingFlag = key('keydown', { key: 'Enter', isComposing: true });
    search.dispatchEvent(composingFlag);
    expect(enterDuring.defaultPrevented).toBe(false);
    expect(digitDuring.defaultPrevented).toBe(false);
    expect(composingFlag.defaultPrevented).toBe(false);
    expect(field.value).toBe('');

    // composition 中の input では候補を再計算しない
    search.value = 'こと';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(itemsOf().map((el) => el.dataset.char)).toEqual(['ゟ']);

    search.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(itemsOf().map((el) => el.dataset.char)).toEqual(['ヿ']);
    const enterAfter = key('keydown', { key: 'Enter' });
    search.dispatchEvent(enterAfter);
    expect(enterAfter.defaultPrevented).toBe(true);
    expect(field.value).toBe('ヿ');
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('確定は setRangeText でキャレット位置へ 1 回挿入し、bubbles な input を 1 回発火する。連続入力のため開いたまま（AC5）', async () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    wrapper.appendChild(textarea);
    textarea.value = '昔々あるところに';
    ime.attach(textarea);
    await ime.open(textarea);
    textarea.setSelectionRange(1, 1);

    const setRangeText = vi.spyOn(textarea, 'setRangeText');
    const bubbled: Event[] = [];
    wrapper.addEventListener('input', (e) => bubbled.push(e));

    selectTab('kumimoji');
    typeSearch('より');
    const enter = key('keydown', { key: 'Enter' });
    searchOf().dispatchEvent(enter);

    expect(enter.defaultPrevented).toBe(true);
    expect(setRangeText).toHaveBeenCalledTimes(1);
    expect(setRangeText).toHaveBeenCalledWith('ゟ', 1, 1, 'end');
    expect(textarea.value).toBe('昔ゟ々あるところに');
    expect(bubbled).toHaveLength(1);
    expect(bubbled[0].bubbles).toBe(true);
    expect(bubbled[0].target).toBe(textarea);

    // 連続入力モード: 開いたまま検索語だけクリア
    expect(ime.isOpen).toBe(true);
    expect(searchOf().value).toBe('');

    // クリック確定（1 回目の挿入の直後へ続けて入る）と数字キー確定
    typeSearch('こと');
    itemsOf()[0].click();
    expect(textarea.value).toBe('昔ゟヿ々あるところに');
    selectTab('itaiji');
    typeSearch('とき');
    const digit = key('keydown', { key: '1' });
    searchOf().dispatchEvent(digit);
    expect(digit.defaultPrevented).toBe(true);
    expect(textarea.value).toBe('昔ゟヿ旹々あるところに');
    expect(setRangeText).toHaveBeenCalledTimes(3);
    expect(bubbled).toHaveLength(3);
    wrapper.remove();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('↑↓ で選択を移動し Tab でも確定する', async () => {
    ime.attach(field);
    await ime.open(field);
    selectTab('hentaigana');
    typeSearch('あ');
    const items = itemsOf();
    expect(items.length).toBeGreaterThan(1);
    const down = key('keydown', { key: 'ArrowDown' });
    searchOf().dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    const selected = popupOf().querySelector('.naga-item.naga-is-selected') as HTMLElement;
    expect(selected.dataset.index).toBe('1');
    expect(searchOf().getAttribute('aria-activedescendant')).toBe(selected.id);
    const expected = selected.dataset.char;
    searchOf().dispatchEvent(key('keydown', { key: 'Tab' }));
    expect(field.value).toBe(expected);
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('Esc で閉じて対象へフォーカスを戻す。× ボタンと外側クリックでも閉じる（AC5）', async () => {
    ime.attach(field);
    await ime.open(field);
    const esc = key('keydown', { key: 'Escape' });
    searchOf().dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    expect(ime.isOpen).toBe(false);
    expect(popupOf().hidden).toBe(true);
    expect(document.activeElement).toBe(field);

    await ime.open(field);
    (popupOf().querySelector('.naga-close') as HTMLButtonElement).click();
    expect(ime.isOpen).toBe(false);

    await ime.open(field);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(ime.isOpen).toBe(false);
    outside.remove();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('recent は新しい順に並び、localStorage に保存され、次の起動は最近タブから開く（AC5）', async () => {
    ime.attach(field);
    await ime.open(field);
    selectTab('kumimoji');
    typeSearch('より');
    searchOf().dispatchEvent(key('keydown', { key: 'Enter' }));
    typeSearch('こと');
    searchOf().dispatchEvent(key('keydown', { key: 'Enter' }));
    // 同じ文字を再度使うと先頭へ移動し重複しない
    typeSearch('より');
    searchOf().dispatchEvent(key('keydown', { key: 'Enter' }));
    ime.close();

    await ime.open(field);
    const active = popupOf().querySelector('.naga-tab.naga-is-active') as HTMLElement;
    expect(active.dataset.category).toBe('recent');
    expect(itemsOf().map((el) => el.dataset.char)).toEqual(['ゟ', 'ヿ']);

    const stored = JSON.parse(localStorage.getItem('nagarjuna-naga-recents') || '[]');
    expect(stored.map((c: { char: string }) => c.char)).toEqual(['ゟ', 'ヿ']);

    // 別インスタンスも保存済みの recent を読む
    ime.destroy();
    const next = new NagaIME();
    next.attach(field);
    await next.open(field);
    expect(itemsOf().map((el) => el.dataset.char)).toEqual(['ゟ', 'ヿ']);
    next.destroy();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('recentStorageKey: null では保存しない。壊れた保存値は無視する', async () => {
    localStorage.setItem('nagarjuna-naga-recents', '{broken');
    const local = new NagaIME({ recentStorageKey: null });
    local.attach(field);
    await local.open(field);
    selectTab('kumimoji');
    typeSearch('より');
    searchOf().dispatchEvent(key('keydown', { key: 'Enter' }));
    expect(localStorage.getItem('nagarjuna-naga-recents')).toBe('{broken');
    local.destroy();
    const reader = new NagaIME();
    reader.attach(field);
    await reader.open(field);
    expect((popupOf().querySelector('.naga-tab.naga-is-active') as HTMLElement).dataset.category).toBe('hentaigana');
    reader.destroy();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('候補の文字と説明は HTML として解釈しない', async () => {
    localStorage.setItem(
      'nagarjuna-naga-recents',
      JSON.stringify([{ char: '<img src=x onerror=alert(1)>', reading: 'あ', description: '<b>x</b>', category: 'hentaigana' }])
    );
    const local = new NagaIME();
    local.attach(field);
    await local.open(field);
    expect(popupOf().querySelector('img')).toBeNull();
    expect(popupOf().querySelector('b')).toBeNull();
    expect(itemsOf()[0].querySelector('.naga-char')!.textContent).toBe('<img src=x onerror=alert(1)>');
    local.destroy();
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('detach / destroy で trigger・popup・class・listener を片付け、再 attach できる（AC5・AC6 cleanup）', async () => {
    ime.attach(field);
    expect(field.classList.contains('naga-enabled')).toBe(true);
    expect(document.body.querySelectorAll('.naga-popup')).toHaveLength(1);
    expect(document.body.querySelectorAll('.naga-trigger')).toHaveLength(1);
    await ime.open(field);

    ime.detach(field);
    expect(field.classList.contains('naga-enabled')).toBe(false);
    expect(document.body.querySelectorAll('.naga-popup')).toHaveLength(0);
    expect(document.body.querySelectorAll('.naga-trigger')).toHaveLength(0);
    expect(ime.isOpen).toBe(false);

    const ev = key('keydown', { key: 'j', ctrlKey: true });
    field.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);

    ime.attach(field);
    await ime.open(field);
    expect(ime.isOpen).toBe(true);
  }, DICTIONARY_TEST_TIMEOUT_MS);

  it('セレクタ文字列で複数要素へ attach でき、各インスタンスの id と aria-controls は固有', async () => {
    field.classList.add('naga-target-x');
    textarea.classList.add('naga-target-x');
    ime.attach('.naga-target-x');
    const second = new NagaIME();
    const other = document.createElement('input');
    document.body.appendChild(other);
    second.attach(other);

    const popups = Array.from(document.body.querySelectorAll('.naga-popup'));
    const triggers = Array.from(document.body.querySelectorAll('.naga-trigger'));
    expect(popups).toHaveLength(2);
    expect(new Set(popups.map((p) => p.id)).size).toBe(2);
    expect(triggers.map((t) => t.getAttribute('aria-controls')).sort()).toEqual(popups.map((p) => p.id).sort());

    textarea.focus();
    await vi.waitFor(() => expect((triggers[0] as HTMLElement).hidden).toBe(false));
    await ime.open(textarea);
    expect(ime.isOpen).toBe(true);
    second.destroy();
    other.remove();
  }, DICTIONARY_TEST_TIMEOUT_MS);
});

describe('NagaIME だけの利用では非推奨警告を出さない（AC4 ③）', () => {
  it('vi.resetModules() 後に nagarjuna/ime から NagaIME だけを使って attach / 入力 / detach しても 0 回', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn');
    const { NagaIME: FreshNagaIME } = await import('@/ime');
    const target = document.createElement('input');
    document.body.appendChild(target);
    const local = new FreshNagaIME();
    local.attach(target);
    target.focus();
    await local.open(target);
    const search = document.body.querySelector('.naga-search') as HTMLInputElement;
    search.value = 'より';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    local.detach(target);
    target.remove();
    const deprecations = warn.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).startsWith(DEPRECATION_PREFIX)
    );
    expect(deprecations).toHaveLength(0);
    warn.mockRestore();
  }, DICTIONARY_TEST_TIMEOUT_MS);
});
