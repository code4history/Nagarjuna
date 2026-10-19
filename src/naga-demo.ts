// 次トレインで公開予定の新 IME UI（NagaIME）のプレビュー demo（naga.html）。トップ（index.html）の src/demo.ts とは独立している。
// NagaIME は 1.1.0 の公開 API（nagarjuna/ime）に含めない ∴ ソースを直接 import する
// import の副作用で <naga-ime> を登録する（naga.html の <naga-ime for> が昇格する）
import './lib/ime/naga-ime';

const version = document.getElementById('version');
if (version) version.textContent = import.meta.env.APP_VERSION;

/*
 * 実測用の読み取り（oct26-m7-t1 是正設計 v2 §9「要実測一覧」）。
 * `naga.html?debugViewport=1` のときだけ、ソフトキーボード表示中の
 * visualViewport の値と popup の占有高さを画面に出す。人間が実機で数値を読み上げる。
 * 既定（query 無し）では何も作らないので、通常のデモ・配布物の見た目は変わらない。
 * nov26-m3-t3（M-5）: 画面を覆わないよう、`.lead` の行の直後（文書の流れの中）に置く。
 * 位置・重ね順・ポインタの指定は持たない（計算済みの position は static）。
 */
if (new URLSearchParams(location.search).get('debugViewport') === '1') {
  const panel = document.createElement('pre');
  panel.id = 'naga-debug-viewport';
  panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText = [
    'font: 11px/1.5 ui-monospace, monospace',
    'background: #f4f4f4',
    'border: 1px solid #ccc',
    'padding: 6px 8px',
    'white-space: pre',
    'overflow-x: auto',
  ].join(';');
  const lead = document.querySelector('.lead');
  if (lead) lead.after(panel);
  else document.body.prepend(panel);

  // 欄の focus・blur の順序（直近 8 件）。欄は capture で拾う
  const focusLog: string[] = [];
  const logEv = (e: Event): void => {
    const t = e.target as Element | null;
    if (!t || !(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    focusLog.push(`${e.type}:${t.id || t.tagName.toLowerCase()}`);
    if (focusLog.length > 8) focusLog.shift();
  };
  document.addEventListener('focus', logEv, true);
  document.addEventListener('blur', logEv, true);

  const render = (): void => {
    const vv = window.visualViewport;
    const vvAvail = vv ? Math.round(vv.height) : window.innerHeight;
    const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
    const kb = Math.max(0, window.innerHeight - (vvAvail + offsetTop));
    const pop = document.querySelector('naga-ime')?.shadowRoot?.querySelector('.naga-popup') as HTMLElement | null;
    const shown = pop && !pop.hidden;
    const rect = shown ? pop.getBoundingClientRect() : null;
    const maxH = shown ? pop.style.maxHeight || '(未設定)' : '-';
    // popup の上に残っている帯（本体の入力欄が見える高さ）
    const clearance = rect ? Math.round(rect.top - offsetTop) : null;
    // 【NOV26-M3-NAGA-IOS-DEBUG-0428】iPhone で梵ボタンが出ない件の切り分け用（trigger の状態と focus の記録）
    const trig = document.querySelector('naga-ime')?.shadowRoot?.querySelector('.naga-trigger') as HTMLElement | null;
    const tr = trig ? trig.getBoundingClientRect() : null;
    const ae = document.activeElement;
    panel.textContent = [
      `naga-ime 定義= ${customElements.get('naga-ime') ? 'あり' : 'なし'}`,
      `trigger     = ${trig ? 'あり' : 'なし'}`,
      `trig.hidden = ${trig ? trig.hidden : '-'}`,
      `trig.display= ${trig ? getComputedStyle(trig).display : '-'}`,
      `trig.style  = ${trig ? `${trig.style.top} / ${trig.style.left}` : '-'}`,
      `trig.rect   = ${tr ? `${Math.round(tr.left)},${Math.round(tr.top)} ${Math.round(tr.width)}x${Math.round(tr.height)}` : '-'}`,
      `active      = ${ae ? `${ae.tagName.toLowerCase()}${ae.id ? '#' + ae.id : ''}` : '-'}`,
      `scrollY     = ${Math.round(window.scrollY)}`,
      `events      = ${focusLog.join(' ')}`,
      `vv.height   = ${vvAvail}`,
      `vv.offsetTop= ${offsetTop}`,
      `innerHeight = ${window.innerHeight}`,
      `H_kb        = ${kb}`,
      `popup max-h = ${maxH}`,
      `popup 実高  = ${rect ? Math.round(rect.height) : '-'}`,
      `popup 上端  = ${rect ? Math.round(rect.top) : '-'}`,
      `上に残る帯  = ${clearance === null ? '-' : clearance}`,
      `docked      = ${pop ? pop.classList.contains('naga-is-docked') : '-'}`,
      `folded      = ${pop ? pop.classList.contains('naga-is-folded') : '-'}`,
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
