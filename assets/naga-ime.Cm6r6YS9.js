(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function e(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(n){if(n.ep)return;n.ep=!0;const o=e(n);fetch(n.href,o)}})();class H extends Error{constructor(t,e,i){super(i??`Failed to load font for ${t}${e?` from ${e}`:""}`),this.system=t,this.url=e,this.name="FontLoadError"}system;url}const at=""+new URL("ninjal_hentaigana.ZV3gqHt3.woff2",import.meta.url).href,rt=""+new URL("ninjal_hentaigana.DM189ZoV.woff",import.meta.url).href,ct={hentaigana:`
    @font-face {
      font-family: 'NINJAL Hentaigana';
      src: url('${at}') format('woff2'),
           url('${rt}') format('woff');
      font-display: swap;
    }
  `},v={hentaigana:"NINJAL Hentaigana",siddham:"Noto Sans Siddham",itaiji:"Noto Sans JP"},$={hentaigana:{type:"local",style:ct.hentaigana,family:v.hentaigana},siddham:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Siddham&display=swap",family:v.siddham},itaiji:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",family:v.itaiji}};class lt{loadedFonts=new Set;loadingPromises=new Map;styleElement=null;constructor(){this.styleElement=document.createElement("style"),document.head.appendChild(this.styleElement)}async loadFonts(t){const e=Object.entries(t).filter(([i,n])=>n).map(([i])=>i);try{await Promise.all(e.map(i=>this.loadFont(i)))}catch(i){if(i instanceof H)throw i;const n=new Error("Failed to load fonts");throw i instanceof Error&&(n.cause=i),n}}async loadFont(t){if(this.loadedFonts.has(t))return;const e=this.loadingPromises.get(t);if(e)return e;const i=$[t];let n;if(i.type==="local")n=new Promise(o=>{this.styleElement&&(this.styleElement.textContent=(this.styleElement.textContent??"")+i.style),o()});else{const o=document.createElement("link");o.rel="stylesheet",o.href=i.url,n=new Promise((a,c)=>{o.addEventListener("load",()=>{a()}),o.addEventListener("error",()=>{c(new H(t,i.url))}),document.head.appendChild(o)})}this.loadingPromises.set(t,n);try{await n,this.loadedFonts.add(t),this.loadingPromises.delete(t)}catch(o){throw this.loadingPromises.delete(t),o}}getFontFamilyString(t){const e=Object.entries(t).filter(([i,n])=>n).map(([i])=>$[i].family);return e.length>0?e.concat(["serif"]).join(", "):"serif"}isFontLoaded(t){return this.loadedFonts.has(t)}}const dt="modulepreload",ht=function(s,t){return new URL(s,t).href},G={},pt=function(t,e,i){let n=Promise.resolve();if(e&&e.length>0){let r=function(d){return Promise.all(d.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const a=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),l=c?.nonce||c?.getAttribute("nonce");n=r(e.map(d=>{if(d=ht(d,i),d in G)return;G[d]=!0;const p=d.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(i)for(let h=a.length-1;h>=0;h--){const m=a[h];if(m.href===d&&(!p||m.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${f}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":dt,p||(u.as="script"),u.crossOrigin="",u.href=d,l&&u.setAttribute("nonce",l),document.head.appendChild(u),p)return new Promise((h,m)=>{u.addEventListener("load",h),u.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(a){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=a,window.dispatchEvent(c),!c.defaultPrevented)throw a}return n.then(a=>{for(const c of a||[])c.status==="rejected"&&o(c.reason);return t().catch(o)})},S=[{id:"hentaigana",label:"変体仮名",short:"変"},{id:"siddham",label:"悉曇",short:"悉"},{id:"buddha",label:"仏名",short:"仏"},{id:"itaiji",label:"異体字",short:"異"},{id:"kumimoji",label:"組文字",short:"組"}];let k=null;function gt(){return k||(k=pt(async()=>{const{dictionary:s}=await import("./dictionary.7xenPiF3.js");return{dictionary:s}},[],import.meta.url).then(({dictionary:s})=>{const t=new Map;for(const e of S)t.set(e.id,[]);for(const e of s){const i=t.get(e.category);i&&i.push({char:e.char,reading:e.reading,description:e.description,category:e.category})}return t}),k.catch(()=>{k=null})),k}const ut=/^[ぁ-んー]+$/;function ft(s,t,e,i){if(!t)return s.slice(0,i);let n;if(ut.test(t)){const o=[],a=[];for(const c of s)c.reading===t?o.push(c):c.reading.startsWith(t)&&a.push(c);n=[...o,...a]}else n=s.filter(o=>o.description.includes(t)||o.char===t);return n.map(o=>({e:o,recent:e.has(o.char)?0:1})).sort((o,a)=>o.recent-a.recent||o.e.reading.length-a.e.reading.length).map(o=>o.e).slice(0,i)}const mt=`
:host {
  display: contents;
}
:host([hidden]) {
  display: none;
}
.naga-root {
  all: initial;
  display: contents;
  direction: ltr;
}

.naga-popup,
.naga-trigger,
.naga-caret-mark {
  --naga-special-font: 'NINJAL Hentaigana', 'Noto Sans Siddham', 'Noto Sans JP', serif;
  --naga-accent: #5b4a8a;
}

.naga-popup[hidden],
.naga-trigger[hidden],
.naga-search-row[hidden],
.naga-list[hidden],
.naga-caret-mark[hidden] {
  display: none !important;
}

/* 起動ボタンは文書の座標で置く（positionTrigger が top/left に文書座標を書く）。
   fixed ＋ JS 追随は iOS の visual viewport とずれる（NOV26-IM-NAGA-TRIGGER-ABSOLUTE-0430）。
   host と .naga-root が display: contents なので、position を持つ祖先が無ければ包含ブロックは文書になる。 */
.naga-trigger {
  position: absolute;
  z-index: 9998;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: var(--naga-accent);
  font-family: var(--naga-special-font);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.55;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: opacity 0.15s;
  padding: 0;
}
.naga-trigger:hover,
.naga-trigger:focus-visible {
  opacity: 1;
}

/* popup も文書の座標で置く（positionPopup が top/left に文書座標を書く）。
   狭幅は欄のすぐ下、広幅はキャレットの行の下。fixed ＋ visualViewport の offset は iOS のキーボードで
   ずれる（NOV26-IM-NAGA-POPUP-ANCHOR-0432）。包含ブロックは .naga-root が display: contents なので、
   position を持つ祖先が無ければ文書になる。 */
.naga-popup {
  position: absolute;
  z-index: 9999;
  box-sizing: border-box;
  background: #fff;
  color: #333;
  border: 1px solid #d0d0d0;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  text-align: left;
}

.naga-titlebar {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #eee;
  flex: none;
}
.naga-tabs {
  display: flex;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
}
.naga-close {
  flex: none;
  border: none;
  background: none;
  font-size: 18px;
  line-height: 1;
  padding: 0 12px;
  cursor: pointer;
  color: #999;
  border-left: 1px solid #eee;
}
.naga-close:hover {
  color: #333;
  background: #f5f5f5;
}
.naga-tab {
  flex: 1 0 auto;
  border: none;
  background: none;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.naga-tab.naga-is-active {
  color: var(--naga-accent);
  border-bottom-color: var(--naga-accent);
  font-weight: 600;
}

/*
 * 非 dock（PC）で隠す・構造の selector は base に置く（nov26-m3-t3 タスク設計 §1 の 4-2 の定め直し）。
 * dock 専用の見た目は下の .naga-popup.naga-is-docked スコープに置く。
 */
.naga-fold {
  display: none;
  flex: none;
  border: none;
  background: none;
  font-size: 16px;
  line-height: 1;
  padding: 0 12px;
  cursor: pointer;
  color: #666;
  border-left: 1px solid #eee;
}

/*
 * 【NOV26-IM-NAGA-CARET-MARK-0437】挿入位置の縦棒。
 * popup を開くと focus が読み欄へ移り、元の欄のキャレットが見えなくなる ∴ 元の欄の挿入位置に
 * 縦棒を出す（人間の提案「IME の表示中はキャレットを目立つように変える」）。
 * 位置は positionPopup() と同じ文書の座標（placeCaretMark が top/left に書く）。
 * 幅 2px・高さは行の高さ（JS が書く）・色は NagaIME の紫（--naga-accent）。
 * z-index は popup（9999）より下・欄より上。操作の邪魔をしない（pointer-events: none）。
 * 1s 周期で点滅するが、動きを減らす設定では点滅しない。
 */
.naga-caret-mark {
  position: absolute;
  z-index: 9997;
  width: 2px;
  pointer-events: none;
  background: var(--naga-accent);
  animation: naga-caret-blink 1s step-end infinite;
}
@keyframes naga-caret-blink {
  0%,
  49.99% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .naga-caret-mark {
    animation: none;
  }
}

/*
 * 確定した文字だけを読み上げる live region（0437）。写し（.naga-copy）に付いていた aria-live の
 * 最小の代替で、見た目には出さない（visually-hidden。レイアウトにも場所を取らせない）。
 */
.naga-live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

/*
 * 読み入力欄の行（是正設計 v2 §5「区別の付け方」）。
 * 行は flex（nov26-m3-t3: a11y の木から要素を落としうる contents の箱をやめた）。PC では input が
 * 行いっぱいに広がり、外余白 8px で従来と同じ位置に来る（e2e の P-8）。ラベルは PC では出さない。
 */
.naga-search-row {
  display: flex;
  flex: none;
}
.naga-search-label {
  display: none;
}

.naga-search {
  margin: 8px;
  padding: 8px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
.naga-search:focus {
  outline: 2px solid var(--naga-accent);
  outline-offset: -1px;
}

.naga-list {
  overflow-y: auto;
  max-height: 260px;
  min-height: 60px;
}

.naga-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.naga-item.naga-is-selected {
  background: #efeafa;
}
.naga-item:hover {
  background: #f5f5f5;
}
.naga-item.naga-is-selected:hover {
  background: #efeafa;
}

.naga-num {
  width: 14px;
  font-size: 11px;
  color: #aaa;
  text-align: right;
  flex: none;
}

.naga-char {
  font-family: var(--naga-special-font);
  font-size: 26px;
  line-height: 1.2;
  min-width: 36px;
  text-align: center;
  flex: none;
}

.naga-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.naga-reading {
  font-size: 13px;
  color: #333;
}
.naga-desc {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.naga-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.naga-hint {
  flex: none;
  padding: 5px 10px;
  font-size: 10px;
  color: #aaa;
  border-top: 1px solid #eee;
  background: #fafafa;
}

/*
 * モバイル dock（是正設計 v2 §3・§4 案 A・§5、nov26-m3-t3 タスク設計 §3.1〜§3.3）。
 * ここから下の規則はすべて .naga-popup.naga-is-docked スコープに閉じる（PC 非影響）。
 * 高さの静的な viewport 比指定（旧 dock ルールの vh 値）は使わない。--naga-dock-max は
 * positionPopup() が visualViewport の実測から毎回設定する（未設定時のみ既定 204px）。
 * 各行の高さは naga-ime.ts の DOCK_*_PX と一致させる（タイトル 34・読み欄 36・候補 44・枠 2）。
 * 【0437】挿入先の写し（行の高さ 22px）は広幅・狭幅とも撤去した ∴ 高さの計算にも入れない。
 */
.naga-popup.naga-is-docked {
  /* 画面の下に据え付けた板（「ふわふわ浮いて」への対応）: 左右いっぱい・上端のアクセントの線・上向きの影 */
  border: none;
  border-top: 2px solid var(--naga-accent);
  border-radius: 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.18);
  max-height: var(--naga-dock-max, 204px); /* 未設定時の既定（0436 で写しの行を外して 204。0437 で写し自体を撤去） */
}
/* 縮むのは内側の list だけ（タイトル行・読み欄は潰さない） */
.naga-popup.naga-is-docked .naga-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.naga-popup.naga-is-docked .naga-hint {
  display: none;
}
/* タイトル行: 背景と下線で「ヘッダー帯」に見せ、候補領域の白と分ける */
.naga-popup.naga-is-docked .naga-titlebar {
  box-sizing: border-box;
  height: 34px;
  background: #fafafa;
  border-bottom: 1px solid #e2e2e2;
}
.naga-popup.naga-is-docked .naga-tab {
  padding: 0 10px;
  font-size: 15px;
  line-height: 20px;
}
.naga-popup.naga-is-docked .naga-close,
.naga-popup.naga-is-docked .naga-fold {
  padding: 0 14px;
}
.naga-popup.naga-is-docked .naga-fold {
  display: block;
}
/*
 * 【NOV26-IM-NAGA-CARET-MARK-0437】挿入先の写し（欄の中身を ↵ で 1 行に詰めた文脈の表示）は
 * 広幅・狭幅とも撤去した（実機の「元フォームと IME の間にわかりにくい文字列が表示され、狭いのに
 * 場所を取る」への対応）。挿入位置は .naga-caret-mark の縦棒で示す ∴ ここに写しの規則は無い。
 */
/* 読み入力欄: アクセント縦線＋「読み」ラベルで本体の入力欄と見分ける（高さは 1 行のまま） */
.naga-popup.naga-is-docked .naga-search-row {
  box-sizing: border-box;
  height: 30px;
  align-items: stretch;
  margin: 3px 8px;
  border: 1px solid #ccc;
  border-left: 3px solid var(--naga-accent);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}
.naga-popup.naga-is-docked .naga-search-label {
  display: flex;
  align-items: center;
  flex: none;
  padding: 0 8px;
  font-size: 12px;
  line-height: 1;
  color: var(--naga-accent);
  background: #f3f0fa;
  border-right: 1px solid #e4dff2;
}
.naga-popup.naga-is-docked .naga-search {
  box-sizing: border-box;
  margin: 0;
  border: none;
  border-radius: 0;
  font-size: 16px; /* iOS の focus 時自動ズームを避ける下限 */
  line-height: 20px;
  padding: 4px 10px;
}
.naga-popup.naga-is-docked .naga-search:focus {
  outline-offset: -2px;
}
/* 候補行: 44px/行（タップの的の大きさ） */
.naga-popup.naga-is-docked .naga-item {
  box-sizing: border-box;
  height: 44px;
  padding: 5px 10px;
}
`,bt="data-naga-style",K="naga-ime",F="nagarjuna-naga-recents",R="梵",P=14,N=60,M=560,X="よみを入力（例: あ / とき）",yt="読み",Et="読みを入力",xt="最近",vt="近",q=26,j=4,wt=4,_=4,D=2,U={hentaigana:!0,siddham:!0,itaiji:!0},T=S.map(s=>s.id),Q=new Set(T),tt=34,kt=36,et=44,Lt=3,it=2,Ct=8,nt=tt+kt+it,O=nt+et,Tt=nt+et*Lt,At=tt+it,St={for:"htmlFor",categories:"categories","trigger-label":"triggerLabel",shortcut:"shortcut","recent-storage-key":"recentStorageKey","recent-max":"recentMax","max-candidates":"maxCandidates","dock-breakpoint":"dockBreakpoint","load-fonts":"loadFonts"},Ft=["htmlFor","categories","triggerLabel","shortcut","recentStorageKey","recentMax","maxCandidates","dockBreakpoint","loadFonts"];function V(s,t){if(s!==null){if(s===""||s==="true"||s===t)return!0;if(s==="false")return!1}}function W(s){return typeof s=="boolean"?s:void 0}function ot(s,t){if(!Number.isFinite(s))return;const e=Math.floor(s);return e>=t?e:void 0}function I(s,t){if(!(s===null||s.trim()===""))return ot(Number(s),t)}function z(s,t){return typeof s=="number"?ot(s,t):void 0}function C(s){return typeof s=="string"&&s!==""?s:void 0}function st(s){const t=[];for(const e of s)typeof e=="string"&&Q.has(e)&&!t.includes(e)&&t.push(e);return t.length?t:[...T]}function Rt(s){return st(s===null?[]:s.split(/\s+/))}function Pt(s){return st(Array.isArray(s)?s:[])}function L(s){return s==="recent"?xt:S.find(t=>t.id===s)?.label??s}function Nt(s){return s==="recent"?vt:S.find(t=>t.id===s)?.short??L(s).charAt(0)}let Mt=0;function B(s){return typeof HTMLInputElement<"u"&&(s instanceof HTMLInputElement||s instanceof HTMLTextAreaElement)}function _t(s){if(!s||typeof s!="object")return!1;const t=s;return typeof t.char=="string"&&typeof t.reading=="string"&&typeof t.description=="string"&&typeof t.category=="string"&&Q.has(t.category)}function J(s){return{char:s.char,reading:s.reading,description:s.description,category:s.category}}function Y(){let s=document.activeElement;for(;s&&s.shadowRoot&&s.shadowRoot.activeElement;)s=s.shadowRoot.activeElement;return s}function Z(s){return typeof s=="string"?Array.from(document.querySelectorAll(s)):s instanceof Element?[s]:Array.from(s)}function Dt(){const s="@c4h/nagarjuna";return new TypeError(`[${s}] cannot construct NagaIME: <naga-ime> is defined by another implementation. Load a single copy of ${s}, or use document.createElement('naga-ime').`)}class A extends HTMLElement{static get observedAttributes(){return Object.keys(St)}cfgFor="";cfgCategories=[...T];cfgTriggerLabel=R;cfgShortcut=!0;cfgRecentStorageKey=F;cfgRecentMax=P;cfgMaxCandidates=N;cfgDockBreakpoint=M;cfgLoadFonts=!0;uid;root;fontLoader=null;fields=new Map;dictionary=null;recents=[];recentsLoaded=!1;target=null;activeTab=T[0];candidates=[];selectedIndex=0;composing=!1;openState=!1;openSeq=0;docked=!1;folded=!1;selfFocus=!1;dockScrollDone=!1;initialized=!1;pendingForLookup=null;trigger=null;popup=null;tabsEl=null;searchEl=null;listEl=null;searchRowEl=null;caretMarkEl=null;liveEl=null;foldEl=null;globalCleanup=null;triggerCleanup=null;triggerRaf=0;popupCleanup=null;popupRaf=0;constructor(t={}){if(new.target===A&&customElements.get(K)!==A)throw Dt();super(),this.uid=`naga-${++Mt}`;const e=this.attachShadow({mode:"open"}),i=document.createElement("style");i.setAttribute(bt,""),i.textContent=mt;const n=document.createElement("div");n.className="naga-root",e.append(i,n),this.root=n,t.categories!==void 0&&(this.categories=t.categories),t.triggerLabel!==void 0&&(this.triggerLabel=t.triggerLabel),t.shortcut!==void 0&&(this.shortcut=t.shortcut),t.recentStorageKey!==void 0&&(this.recentStorageKey=t.recentStorageKey),t.recentMax!==void 0&&(this.recentMax=t.recentMax),t.maxCandidates!==void 0&&(this.maxCandidates=t.maxCandidates),t.dockBreakpoint!==void 0&&(this.dockBreakpoint=t.dockBreakpoint),t.loadFonts!==void 0&&(this.loadFonts=t.loadFonts)}connectedCallback(){for(const t of Ft)if(Object.prototype.hasOwnProperty.call(this,t)){const e=this[t];delete this[t],this[t]=e}if(this.initialized=!0,this.resolveFor(),document.readyState==="loading"&&!this.pendingForLookup){const t=()=>{this.pendingForLookup=null,this.isConnected&&this.resolveFor()};this.pendingForLookup=()=>document.removeEventListener("DOMContentLoaded",t),document.addEventListener("DOMContentLoaded",t,{once:!0})}}disconnectedCallback(){queueMicrotask(()=>{this.isConnected||(this.pendingForLookup?.(),this.pendingForLookup=null,this.detach())})}attributeChangedCallback(t,e,i){switch(t){case"for":this.setFor(i??"");break;case"categories":this.setCategories(Rt(i));break;case"trigger-label":this.setTriggerLabel(C(i)??R);break;case"shortcut":this.cfgShortcut=V(i,t)??!0;break;case"recent-storage-key":this.setRecentStorageKey(C(i)??F);break;case"recent-max":this.setRecentMax(I(i,0)??P);break;case"max-candidates":this.cfgMaxCandidates=I(i,1)??N;break;case"dock-breakpoint":this.cfgDockBreakpoint=I(i,0)??M;break;case"load-fonts":this.cfgLoadFonts=V(i,t)??!0;break}}get htmlFor(){return this.cfgFor}set htmlFor(t){this.setFor(typeof t=="string"?t:"")}get categories(){return[...this.cfgCategories]}set categories(t){this.setCategories(Pt(t))}get triggerLabel(){return this.cfgTriggerLabel}set triggerLabel(t){this.setTriggerLabel(C(t)??R)}get shortcut(){return this.cfgShortcut}set shortcut(t){this.cfgShortcut=W(t)??!0}get recentStorageKey(){return this.cfgRecentStorageKey}set recentStorageKey(t){this.setRecentStorageKey(t===null?null:C(t)??F)}get recentMax(){return this.cfgRecentMax}set recentMax(t){this.setRecentMax(z(t,0)??P)}get maxCandidates(){return this.cfgMaxCandidates}set maxCandidates(t){this.cfgMaxCandidates=z(t,1)??N}get dockBreakpoint(){return this.cfgDockBreakpoint}set dockBreakpoint(t){this.cfgDockBreakpoint=z(t,0)??M}get loadFonts(){return this.cfgLoadFonts}set loadFonts(t){this.cfgLoadFonts=W(t)??!0}get isOpen(){return this.openState}setFor(t){this.cfgFor=t,this.initialized&&this.isConnected&&this.resolveFor()}setCategories(t){this.cfgCategories=t,this.activeTab!=="recent"&&!t.includes(this.activeTab)&&(this.activeTab=t[0]),this.rebuildTabs()}setTriggerLabel(t){this.cfgTriggerLabel=t,this.trigger&&(this.trigger.textContent=t)}setRecentStorageKey(t){this.cfgRecentStorageKey=t,t!==null&&this.recentsLoaded&&this.reloadRecents()}setRecentMax(t){const e=this.cfgRecentMax;this.cfgRecentMax=t,t===0?(this.recents=[],this.activeTab==="recent"&&(this.activeTab=this.cfgCategories[0])):e===0?this.recentsLoaded&&this.reloadRecents():this.recents=this.recents.slice(0,t),(e===0||t===0)&&this.rebuildTabs()}attach(t){this.bindAll(Z(t),"attach")}detach(t){const e=t===void 0?Array.from(this.fields.keys()):Z(t);for(const i of e)B(i)&&this.unbindField(i);this.fields.size===0&&this.teardownDom()}destroy(){this.detach(),this.teardownDom(),this.remove()}bindAll(t,e){const i=t.filter(B),n=[];for(const o of i){const a=this.fields.get(o);a?e==="attach"?a.viaAttach=!0:a.viaFor=!0:n.includes(o)||n.push(o)}n.length!==0&&(this.isConnected||document.body.append(this),this.ensureDom(),this.cfgLoadFonts&&(this.fontLoader??=new lt,this.fontLoader.loadFonts(U).catch(()=>{})),n.forEach(o=>this.bindField(o,e)))}resolveFor(){const t=this.getRootNode(),e=[];if(typeof t.getElementById=="function")for(const i of this.cfgFor.split(/\s+/)){if(!i)continue;const n=t.getElementById(i);n&&e.push(n)}for(const[i,n]of Array.from(this.fields))!n.viaFor||e.includes(i)||(n.viaAttach?n.viaFor=!1:this.unbindField(i));e.length&&this.bindAll(e,"for"),this.fields.size===0&&this.teardownDom()}unbindField(t){const e=this.fields.get(t);e&&(e.cleanup(),e.addedClass&&t.classList.remove("naga-enabled"),e.appliedFontFamily!==null&&t.style.fontFamily===e.appliedFontFamily&&(t.style.fontFamily=""),this.fields.delete(t),this.target===t&&(this.close(),this.target=null,this.hideTrigger()))}async toggle(t){if(this.openState&&this.target===t){this.close({refocus:!0});return}await this.open(t)}async open(t){if(!this.fields.has(t))return;this.target=t;const e=++this.openSeq;if(!this.dictionary){this.searchEl&&(this.searchEl.placeholder="辞書を読み込み中…");const i=await gt();this.dictionary=i,this.searchEl&&(this.searchEl.placeholder=X)}e!==this.openSeq||!this.popup||!this.searchEl||!this.fields.has(t)||(this.recentsLoaded||this.reloadRecents(),this.openState=!0,this.popup.hidden=!1,this.trigger?.setAttribute("aria-expanded","true"),this.searchEl.value="",this.selectedIndex=0,this.liveEl&&(this.liveEl.textContent=""),this.recents.length?this.activeTab="recent":this.activeTab==="recent"&&(this.activeTab=this.cfgCategories[0]),this.renderTabs(),this.refresh(),this.dockScrollDone=!1,this.positionPopup(),this.syncPopupTracking(),this.searchEl.focus({preventScroll:!0}),this.emit("nagaOpen",{field:t}))}close({refocus:t=!1}={}){const e=this.openState;this.openSeq++,this.openState=!1,this.composing=!1,this.popup&&(this.popup.hidden=!0),this.caretMarkEl&&(this.caretMarkEl.hidden=!0),this.trigger?.setAttribute("aria-expanded","false"),t&&this.target&&this.focusFieldSelf(this.target),this.stopPopupTracking(),this.stopTriggerTracking(),this.syncTriggerTracking(),e&&this.emit("nagaClose",{field:this.target})}focusFieldSelf(t){this.selfFocus=!0;try{t.focus({preventScroll:!0})}finally{this.selfFocus=!1}}emit(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!1,cancelable:!1,detail:e}))}ensureDom(){if(this.popup)return;const t=`${this.uid}-popup`,e=`${this.uid}-list`,i=document.createElement("button");i.type="button",i.className="naga-trigger",i.id=`${this.uid}-trigger`,i.textContent=this.cfgTriggerLabel,i.title="特殊文字を入力 (Ctrl+J / ⌘J)",i.setAttribute("aria-label","特殊文字を入力"),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-controls",t),i.setAttribute("aria-expanded","false"),i.hidden=!0,i.addEventListener("mousedown",g=>{g.preventDefault(),this.target&&this.toggle(this.target)}),i.addEventListener("click",g=>{g.detail===0&&this.target&&this.toggle(this.target)});const n=document.createElement("div");n.className="naga-popup",n.id=t,n.setAttribute("role","dialog"),n.setAttribute("aria-label","特殊文字入力"),n.hidden=!0;const o=document.createElement("div");o.className="naga-titlebar";const a=document.createElement("div");a.className="naga-tabs",a.setAttribute("role","tablist");const c=document.createElement("button");c.type="button",c.className="naga-close",c.title="閉じる (Esc)",c.setAttribute("aria-label","閉じる"),c.textContent="×",c.addEventListener("mousedown",g=>g.preventDefault()),c.addEventListener("click",()=>this.close({refocus:!0}));const l=document.createElement("button");l.type="button",l.className="naga-fold",l.addEventListener("mousedown",g=>g.preventDefault()),l.addEventListener("click",()=>this.toggleFold()),o.append(a,l,c);const r=document.createElement("input");r.type="text",r.className="naga-search",r.placeholder=X,r.autocomplete="off",r.setAttribute("autocapitalize","off"),r.spellcheck=!1,r.setAttribute("role","combobox"),r.setAttribute("aria-expanded","true"),r.setAttribute("aria-controls",e),r.setAttribute("aria-label",Et);const d=document.createElement("div");d.className="naga-search-row";const p=document.createElement("span");p.className="naga-search-label",p.textContent=yt,p.setAttribute("aria-hidden","true"),d.append(p,r);const f=document.createElement("div");f.className="naga-list",f.id=e,f.setAttribute("role","listbox");const u=document.createElement("div");u.className="naga-hint",u.textContent="↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる";const h=document.createElement("div");h.className="naga-live",h.setAttribute("aria-live","polite"),h.setAttribute("aria-atomic","true");const m=document.createElement("div");m.className="naga-caret-mark",m.hidden=!0,n.append(o,d,f,u),r.addEventListener("compositionstart",()=>{this.composing=!0}),r.addEventListener("compositionend",()=>{this.composing=!1,this.refresh()}),r.addEventListener("input",()=>{this.composing||this.refresh()}),r.addEventListener("keydown",g=>this.onSearchKeydown(g)),f.addEventListener("mousedown",g=>g.preventDefault()),f.addEventListener("click",g=>{const b=g.target?.closest?.(".naga-item");b&&this.commit(this.candidates[Number(b.dataset.index)])}),this.root.append(i,n,m,h),this.trigger=i,this.popup=n,this.tabsEl=a,this.searchEl=r,this.listEl=f,this.searchRowEl=d,this.caretMarkEl=m,this.liveEl=h,this.foldEl=l,this.applyFold(),this.rebuildTabs();const y=g=>{!this.openState||!this.popup||(typeof g.composedPath=="function"?g.composedPath():[g.target]).some(x=>x===this.popup||x===this.trigger||this.target!==null&&x===this.target)||this.close({refocus:!0})},E=()=>{this.openState&&this.positionPopup()},w=window.visualViewport;document.addEventListener("mousedown",y),window.addEventListener("resize",E),w?.addEventListener("resize",E),this.globalCleanup=()=>{document.removeEventListener("mousedown",y),window.removeEventListener("resize",E),w?.removeEventListener("resize",E)}}rebuildTabs(){const t=this.tabsEl;if(!t)return;const e=`${this.uid}-list`,i=this.cfgRecentMax>0?["recent",...this.cfgCategories]:[...this.cfgCategories];t.replaceChildren();for(const n of i){const o=document.createElement("button");o.type="button",o.className="naga-tab",o.id=`${this.uid}-tab-${n}`,o.dataset.category=n,o.textContent=L(n),o.title=L(n),o.setAttribute("aria-label",L(n)),o.setAttribute("role","tab"),o.setAttribute("aria-controls",e),o.addEventListener("mousedown",a=>a.preventDefault()),o.addEventListener("click",()=>{this.activeTab=n,this.renderTabs(),this.refresh(),this.searchEl?.focus({preventScroll:!0})}),t.appendChild(o)}this.renderTabs(),this.openState&&this.refresh()}teardownDom(){this.close(),this.stopTriggerTracking(),this.globalCleanup?.(),this.globalCleanup=null,this.trigger?.remove(),this.popup?.remove(),this.caretMarkEl?.remove(),this.liveEl?.remove(),this.trigger=null,this.popup=null,this.tabsEl=null,this.searchEl=null,this.listEl=null,this.searchRowEl=null,this.caretMarkEl=null,this.liveEl=null,this.foldEl=null,this.target=null,this.docked=!1}bindField(t,e){let i=null;if(!t.style.fontFamily){const r=this.fontLoader?this.fontLoader.getFontFamilyString(U):[v.hentaigana,v.siddham,v.itaiji,"serif"].join(", ");let d;try{d=getComputedStyle(t).fontFamily}catch{d=""}t.style.fontFamily=d?`${d}, ${r}`:r,i=t.style.fontFamily}const n=!t.classList.contains("naga-enabled");t.classList.add("naga-enabled");const o=()=>{this.openState&&!this.selfFocus&&this.close(),this.showTrigger(t)},a=()=>{if(this.openState)return;const r=Y();r!==this.trigger&&!(B(r)&&this.fields.has(r))&&this.hideTrigger()},c=r=>{if(this.cfgShortcut&&(r.ctrlKey||r.metaKey)&&!r.altKey&&r.key.toLowerCase()==="j"){r.preventDefault(),this.toggle(t);return}r.key==="Escape"&&this.openState&&this.target===t&&this.close()},l=t;l.addEventListener("focus",o),l.addEventListener("blur",a),l.addEventListener("keydown",c),this.fields.set(t,{appliedFontFamily:i,addedClass:n,viaFor:e==="for",viaAttach:e==="attach",cleanup:()=>{l.removeEventListener("focus",o),l.removeEventListener("blur",a),l.removeEventListener("keydown",c)}}),Y()===t&&this.showTrigger(t)}showTrigger(t){this.target=t,this.trigger&&(this.positionTrigger(t),this.trigger.hidden=!1,this.syncTriggerTracking())}hideTrigger(){this.trigger&&(this.trigger.hidden=!0),this.syncTriggerTracking()}containingBlockOffset(t){const e=t.offsetParent;if(!e||e===document.body||e===document.documentElement)return{top:0,left:0};const i=getComputedStyle(e),n=Number.parseFloat(i.borderTopWidth)||0,o=Number.parseFloat(i.borderLeftWidth)||0,a=e.getBoundingClientRect(),c=a.top+window.scrollY+n-(e.scrollTop||0),l=a.left+window.scrollX+o-(e.scrollLeft||0);return{top:c,left:l}}placeInDocument(t,e,i){const n=this.containingBlockOffset(t);t.style.top=`${e-n.top}px`,t.style.left=`${i-n.left}px`}documentWidth(){return document.documentElement.clientWidth||window.innerWidth}positionTrigger(t){const e=this.trigger;if(!e)return;const i=t.getBoundingClientRect(),n=window.scrollX,o=window.scrollY;let a=i.top+o-q-j;a<0&&(a=i.bottom+o+j);let c=i.right+n-q;c<n&&(c=n+wt),this.placeInDocument(e,a,c)}syncTriggerTracking(){if(!!!(this.trigger&&!this.trigger.hidden&&this.target)){this.stopTriggerTracking();return}if(this.triggerCleanup){this.requestTriggerPosition();return}const e=()=>this.requestTriggerPosition(),i=o=>{const a=o.target;a===document||a===window||a===document.documentElement||a===document.body||e()},n=window.visualViewport;window.addEventListener("resize",e,{passive:!0}),n?.addEventListener("resize",e,{passive:!0}),document.addEventListener("scroll",i,{capture:!0,passive:!0}),this.triggerCleanup=()=>{window.removeEventListener("resize",e),n?.removeEventListener("resize",e),document.removeEventListener("scroll",i,{capture:!0}),this.triggerRaf&&cancelAnimationFrame(this.triggerRaf),this.triggerRaf=0},this.requestTriggerPosition()}requestTriggerPosition(){this.triggerRaf||(this.triggerRaf=requestAnimationFrame(()=>{this.triggerRaf=0,!(!this.trigger||this.trigger.hidden||!this.target)&&this.positionTrigger(this.target)}))}stopTriggerTracking(){this.triggerCleanup?.(),this.triggerCleanup=null}currentEntries(){return this.activeTab==="recent"?this.recents:this.dictionary?.get(this.activeTab)??[]}refresh(){if(!this.searchEl)return;const t=this.searchEl.value.trim(),e=new Set(this.recents.map(i=>i.char));this.candidates=ft(this.currentEntries(),t,e,this.cfgMaxCandidates),this.selectedIndex=0,this.renderList()}renderTabs(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category===this.activeTab;t.classList.toggle("naga-is-active",e),t.setAttribute("aria-selected",String(e))}),this.applyTabLabels()}applyTabLabels(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category;if(!e)return;const i=this.docked&&e!==this.activeTab;t.textContent=i?Nt(e):L(e)})}setDocked(t){this.docked!==t&&(this.docked=t,this.applyTabLabels(),this.applyFold())}toggleFold(){this.folded=!this.folded,this.applyFold(),this.openState&&this.positionPopup(),this.folded||this.searchEl?.focus({preventScroll:!0})}applyFold(){const t=this.folded&&this.docked;this.popup?.classList.toggle("naga-is-folded",t),this.searchRowEl&&(this.searchRowEl.hidden=t),this.listEl&&(this.listEl.hidden=t);const e=this.foldEl;e&&(e.setAttribute("aria-expanded",String(!this.folded)),e.setAttribute("aria-label",this.folded?"ひらく":"たたむ"),e.title=this.folded?"ひらく":"たたむ",e.textContent=this.folded?"▴":"▾")}renderList(){const t=this.listEl;if(!t)return;if(t.replaceChildren(),!this.candidates.length){const i=document.createElement("div");i.className="naga-empty",i.textContent="候補なし",t.appendChild(i),this.searchEl?.removeAttribute("aria-activedescendant");return}let e=null;this.candidates.forEach((i,n)=>{const o=n===this.selectedIndex,a=document.createElement("div");a.className=o?"naga-item naga-is-selected":"naga-item",a.id=`${this.uid}-option-${n}`,a.setAttribute("role","option"),a.setAttribute("aria-selected",String(o)),a.dataset.index=String(n),a.dataset.char=i.char;const c=document.createElement("span");c.className="naga-num",c.textContent=n<9?String(n+1):"";const l=document.createElement("span");l.className="naga-char",l.textContent=i.char;const r=document.createElement("span");r.className="naga-meta";const d=document.createElement("span");d.className="naga-reading",d.textContent=i.reading;const p=document.createElement("span");p.className="naga-desc",p.textContent=i.description,r.append(d,p),a.append(c,l,r),t.appendChild(a),o&&(this.searchEl?.setAttribute("aria-activedescendant",a.id),e=a)}),e&&this.revealInList(e)}revealInList(t){if(!this.listEl)return;const e=this.listEl,i=t.offsetTop-(t.offsetParent===e?0:e.offsetTop),n=i+t.offsetHeight;i<e.scrollTop?this.listEl.scrollTop=i:n>e.scrollTop+e.clientHeight&&(this.listEl.scrollTop=n-e.clientHeight)}onSearchKeydown(t){const e=this.candidates.length,i=this.composing||t.isComposing||t.keyCode===229;if(t.key==="ArrowDown"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex+1)%Math.max(e,1),this.renderList()}else if(t.key==="ArrowUp"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex-1+Math.max(e,1))%Math.max(e,1),this.renderList()}else if(t.key==="Enter"||t.key==="Tab"){if(i)return;t.preventDefault();const n=this.candidates[this.selectedIndex];n&&this.commit(n)}else if(t.key==="Escape"){if(i)return;t.preventDefault(),this.close({refocus:!0})}else if(/^[1-9]$/.test(t.key)&&!i){const n=this.candidates[Number(t.key)-1];n&&(t.preventDefault(),this.commit(n))}}commit(t){const e=this.target;if(!(!e||!t)){if(this.pushRecent(t),typeof e.setRangeText=="function"){const i=e.selectionStart??e.value.length,n=e.selectionEnd??e.value.length;e.setRangeText(t.char,i,n,"end")}else e.value+=t.char;e.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0,inputType:"insertText",data:t.char})),this.emit("nagaCommit",{field:e,candidate:J(t)}),this.liveEl&&(this.liveEl.textContent=t.char),this.searchEl&&(this.searchEl.value=""),this.selectedIndex=0,this.refresh(),this.positionPopup(),this.searchEl?.focus({preventScroll:!0})}}positionPopup(){const t=this.target,e=this.popup;if(!t||!e)return;const i=t.getBoundingClientRect(),n=window.scrollX,o=window.scrollY,a=window.visualViewport,c=a?a.width:window.innerWidth,l=e.style;if(c<this.cfgDockBreakpoint){e.classList.add("naga-is-docked"),this.setDocked(!0),l.position="absolute",l.right="",l.bottom="",l.width=`${this.documentWidth()}px`;let m;try{m=this.measureCaret(t)}catch{m=null}const y=m?m.y+m.lineHeight+D:i.bottom+_,E=a?a.height:window.innerHeight,w=a?a.offsetTop+a.height:window.innerHeight,g=w-y-Ct;let b=Math.min(Tt,Math.max(0,g));if(g<O&&(b=O),this.folded&&(b=Math.min(At,b)),l.maxHeight=`${b}px`,l.setProperty("--naga-dock-max",`${b}px`),l.setProperty("--naga-dock-avail",`${E}px`),this.placeInDocument(e,y+o,n),g<O&&!this.dockScrollDone){const x=y+b-w;x>0&&window.scrollBy(0,x)}this.dockScrollDone=!0,this.placeCaretMark(m);return}e.classList.remove("naga-is-docked"),this.setDocked(!1),l.maxHeight&&(l.maxHeight=""),l.removeProperty("--naga-dock-max"),l.removeProperty("--naga-dock-avail"),l.position="absolute",l.width=`${Math.min(360,c-16)}px`,l.bottom="auto",l.right="auto";let r;try{r=this.measureCaret(t)}catch{r=null}const d=e.offsetHeight||320,p=e.offsetWidth||360,f=o+window.innerHeight;let u,h;r?(u=r.y+o+r.lineHeight+D,h=r.x+n):(u=i.bottom+o+_,h=i.left+n),u+d>f&&(u=r?r.y+o-d-D:i.top+o-d-_),h+p>n+c&&(h=n+c-p-8),h<n+4&&(h=n+4),this.placeInDocument(e,u,h),this.placeCaretMark(r)}placeCaretMark(t){const e=this.caretMarkEl,i=this.target;if(!e)return;if(!this.openState||!i||!t||i instanceof HTMLInputElement&&i.type==="password"){e.hidden=!0;return}const n=i.getBoundingClientRect();if(t.y<n.top||t.y+t.lineHeight>n.bottom){e.hidden=!0;return}e.style.height=`${t.lineHeight}px`,e.hidden=!1,this.placeInDocument(e,t.y+window.scrollY,t.x+window.scrollX)}syncPopupTracking(){if(!this.openState||!this.popup){this.stopPopupTracking();return}if(this.popupCleanup){this.requestPopupPosition();return}const t=()=>this.requestPopupPosition(),e=i=>{const n=i.target;n===document||n===window||n===document.documentElement||n===document.body||t()};document.addEventListener("scroll",e,{capture:!0,passive:!0}),this.popupCleanup=()=>{document.removeEventListener("scroll",e,{capture:!0}),this.popupRaf&&cancelAnimationFrame(this.popupRaf),this.popupRaf=0},this.requestPopupPosition()}requestPopupPosition(){this.popupRaf||(this.popupRaf=requestAnimationFrame(()=>{this.popupRaf=0,!(!this.openState||!this.popup)&&this.positionPopup()}))}stopPopupTracking(){this.popupCleanup?.(),this.popupCleanup=null}measureCaret(t){const e=t.getBoundingClientRect(),i=getComputedStyle(t),n=["box-sizing","padding-top","padding-right","padding-bottom","padding-left","border-top-width","border-right-width","border-bottom-width","border-left-width","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-indent","word-wrap","overflow-wrap","tab-size","text-transform"],o=document.createElement("div"),a=o.style;for(const h of n)a.setProperty(h,i.getPropertyValue(h));a.position="absolute",a.top="-9999px",a.left="-9999px",a.visibility="hidden",a.whiteSpace=t instanceof HTMLTextAreaElement?"pre-wrap":"pre",a.width=`${e.width}px`;const c=t.selectionStart??t.value.length;o.textContent=t.value.slice(0,c);const l=document.createElement("span");l.textContent="​",o.appendChild(l),this.root.appendChild(o);const r=l.getBoundingClientRect(),d=o.getBoundingClientRect();o.remove();const p=parseFloat(i.lineHeight)||(parseFloat(i.fontSize)||16)*1.2,f=r.left-d.left-(t.scrollLeft||0),u=r.top-d.top-(t.scrollTop||0);return{x:e.left+f,y:e.top+u,lineHeight:p}}reloadRecents(){this.recentsLoaded=!0;const t=this.cfgRecentStorageKey,e=this.cfgRecentMax;if(t===null||e===0){e===0&&(this.recents=[]);return}try{const i=JSON.parse(localStorage.getItem(t)||"[]");this.recents=Array.isArray(i)?i.filter(_t).slice(0,e):[]}catch{this.recents=[]}}pushRecent(t){const e=this.cfgRecentMax;if(e===0)return;const i=J(t);this.recents=[i,...this.recents.filter(o=>o.char!==i.char)].slice(0,e);const n=this.cfgRecentStorageKey;if(n!==null)try{localStorage.setItem(n,JSON.stringify(this.recents))}catch{}}}typeof customElements<"u"&&!customElements.get(K)&&customElements.define(K,A);export{lt as F,pt as _};
