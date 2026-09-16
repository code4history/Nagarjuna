import { NagaIME } from './ime';

// NagaIME の人間検証用 demo（naga.html）。legacy の src/demo.ts とは独立している。
const version = document.getElementById('version');
if (version) version.textContent = import.meta.env.APP_VERSION;

const ime = new NagaIME();
// .naga-target が付いた欄にだけ取り付ける
ime.attach('.naga-target');

/*
 * 実測用の読み取り（oct26-m7-t1 是正設計 v2 §9「要実測一覧」）。
 * `naga.html?debugViewport=1` のときだけ、ソフトキーボード表示中の
 * visualViewport の値と popup の占有高さを画面に出す。人間が実機で数値を読み上げる。
 * 既定（query 無し）では何も作らないので、通常のデモ・配布物の見た目は変わらない。
 */
if (new URLSearchParams(location.search).get('debugViewport') === '1') {
  const panel = document.createElement('div');
  panel.id = 'naga-debug-viewport';
  panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'z-index: 10000',
    'margin: 4px',
    'padding: 6px 8px',
    'background: rgba(0, 0, 0, 0.78)',
    'color: #fff',
    'font: 11px/1.5 ui-monospace, monospace',
    'white-space: pre',
    'border-radius: 6px',
    'pointer-events: none',
  ].join(';');
  document.body.appendChild(panel);

  // 「入力中の欄」＝ popup の外にある最後に触れた input / textarea（読み入力欄は除く）。
  let lastField: HTMLElement | null = null;
  document.addEventListener(
    'focusin',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest('.naga-popup')) return;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) lastField = el;
    },
    true,
  );

  const render = (): void => {
    const vv = window.visualViewport;
    const vvAvail = vv ? Math.round(vv.height) : window.innerHeight;
    const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
    const kb = Math.max(0, window.innerHeight - (vvAvail + offsetTop));
    const pop = document.querySelector('.naga-popup') as HTMLElement | null;
    const shown = pop && !pop.hidden;
    const rect = shown ? pop.getBoundingClientRect() : null;
    const maxH = shown ? pop.style.maxHeight || '(未設定)' : '-';
    // popup の上に残っている帯（本体の入力欄が見える高さ）
    const clearance = rect ? Math.round(rect.top - offsetTop) : null;
    // 入力中の欄が帯（popup 上端より上）に見えているか
    const fRect = lastField ? lastField.getBoundingClientRect() : null;
    let visibility = '-';
    if (fRect) {
      if (!rect) visibility = `${Math.round(fRect.top)}（popup 非表示）`;
      else if (fRect.bottom <= rect.top && fRect.top >= offsetTop) visibility = '見えている（帯の中）';
      else if (fRect.top >= rect.top) visibility = 'popup の背後';
      else if (fRect.top < offsetTop) visibility = '可視領域の上へ外れた';
      else visibility = 'popup に一部かかっている';
    }
    panel.textContent = [
      `vv.height   = ${vvAvail}`,
      `vv.offsetTop= ${offsetTop}`,
      `innerHeight = ${window.innerHeight}`,
      `H_kb        = ${kb}`,
      `popup max-h = ${maxH}`,
      `popup 実高  = ${rect ? Math.round(rect.height) : '-'}`,
      `popup 上端  = ${rect ? Math.round(rect.top) : '-'}`,
      `上に残る帯  = ${clearance === null ? '-' : clearance}`,
      `docked      = ${pop ? pop.classList.contains('naga-is-docked') : '-'}`,
      // (b) 差し替え候補の判定用: 入力中の欄が popup 上端より上に見えているか
      `欄 上端/下端= ${fRect ? `${Math.round(fRect.top)} / ${Math.round(fRect.bottom)}` : '-'}`,
      `欄の可視    = ${visibility}`,
      `寄せ結果    = ${pop?.getAttribute('data-naga-reveal') ?? '-'}`,
    ].join('\n');
  };

  render();
  window.addEventListener('resize', render);
  window.addEventListener('scroll', render, true);
  window.visualViewport?.addEventListener('resize', render);
  window.visualViewport?.addEventListener('scroll', render);
  // popup の開閉・確定は即座に反映されないことがあるので、表示中は軽く追従させる
  setInterval(render, 500);
}
