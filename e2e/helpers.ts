import type { ElementHandle, Page } from '@playwright/test';

/**
 * nov26-m3-t1 §3.3: 部品の取り出し。
 *
 * origin/master では部品が document.body 直下にあり、t2 の後は <naga-ime> の影の中に入る。
 * spec を t1 と t2 で書き直さずに済むよう、開いた shadow root を深さ優先で辿り、
 * 最初に一致した要素を返す。class 名は公開の契約ではない（内部の実装を見る試験として使う）。
 * t2 以後に class を変える場合は、その変更と同じ commit で本ファイルを直す。
 */
export const PART = {
  trigger: '.naga-trigger',
  popup: '.naga-popup',
  tab: '.naga-tab.naga-is-active',
  search: '.naga-search',
  item: '.naga-item',
} as const;

export type PartName = keyof typeof PART;

/** 比べる計算済みスタイル（§3.4 R）。 */
export const STYLE_PROPS = [
  'font-size',
  'line-height',
  'letter-spacing',
  'color',
  'box-sizing',
  'display',
  'text-align',
  'font-family',
  'direction',
] as const;

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface PartInfo {
  rect: Rect;
  shown: boolean;
  styles: Record<string, string>;
}

/** 開いた shadow root を辿って selector に一致する最初の要素の handle を返す（無ければ null）。 */
export async function deepHandle(page: Page, selector: string): Promise<ElementHandle<Element> | null> {
  const handle = await page.evaluateHandle((sel) => {
    const walk = (root: Document | ShadowRoot): Element | null => {
      const hit = root.querySelector(sel);
      if (hit) return hit;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) {
          const inner = walk(el.shadowRoot);
          if (inner) return inner;
        }
      }
      return null;
    };
    return walk(document);
  }, selector);
  const el = handle.asElement();
  if (!el) {
    await handle.dispose();
    return null;
  }
  return el as ElementHandle<Element>;
}

/** 部品の矩形・表示の有無・計算済みスタイルを取る（無ければ null）。 */
export async function partInfo(page: Page, selector: string): Promise<PartInfo | null> {
  const el = await deepHandle(page, selector);
  if (!el) return null;
  const info = await el.evaluate((node, props) => {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    const styles: Record<string, string> = {};
    for (const p of props) styles[p] = cs.getPropertyValue(p);
    const shown = !(node as HTMLElement).hidden && cs.display !== 'none' && r.width > 0 && r.height > 0;
    return {
      rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      shown,
      styles,
    };
  }, [...STYLE_PROPS] as string[]);
  await el.dispose();
  return info;
}

/** 部品が見えているか（無ければ false）。 */
export async function isShown(page: Page, selector: string): Promise<boolean> {
  const info = await partInfo(page, selector);
  return info?.shown ?? false;
}

/** 影を辿った activeElement の id（無ければ空文字）。 */
export async function deepActiveId(page: Page): Promise<string> {
  return page.evaluate(() => {
    let ae: Element | null = document.activeElement;
    while (ae && ae.shadowRoot && ae.shadowRoot.activeElement) ae = ae.shadowRoot.activeElement;
    return ae?.id ?? '';
  });
}

/** 文書の欄（light DOM）の矩形。 */
export async function fieldRect(page: Page, id: string): Promise<Rect> {
  return page.evaluate((fid) => {
    const r = document.getElementById(fid)!.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }, id);
}

/** NagaIME が開いているか（window.__naga が無ければ false）。 */
export async function nagaIsOpen(page: Page): Promise<boolean> {
  return page.evaluate(() => Boolean((window as unknown as { __naga?: { isOpen: boolean } }).__naga?.isOpen));
}

/** 固定ページを開き、window.__naga が置かれるまで待つ。 */
export async function gotoFixture(page: Page, name: string, waitNaga = true): Promise<void> {
  await page.goto(`/e2e/fixtures/${name}.html`);
  if (waitNaga) await page.waitForFunction(() => Boolean((window as unknown as { __naga?: unknown }).__naga));
}

/** 文書の欄に値を入れ、キャレットを pos（省略時は末尾）に置いて focus する。 */
export async function fillAndFocus(page: Page, id: string, value: string, pos?: number): Promise<void> {
  await page.evaluate(
    ([fid, v, p]) => {
      const f = document.getElementById(fid as string) as HTMLInputElement;
      f.focus();
      f.value = v as string;
      const at = p === null ? f.value.length : (p as number);
      f.setSelectionRange(at, at);
    },
    [id, value, pos ?? null] as const,
  );
}

/** 部品が見えるまで待つ（開く操作の後）。 */
export async function waitShown(page: Page, selector: string, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const walk = (root: Document | ShadowRoot): Element | null => {
        const hit = root.querySelector(sel);
        if (hit) return hit;
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.shadowRoot) {
            const inner = walk(el.shadowRoot);
            if (inner) return inner;
          }
        }
        return null;
      };
      const el = walk(document) as HTMLElement | null;
      if (!el || el.hidden) return false;
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0;
    },
    selector,
    { timeout },
  );
}
