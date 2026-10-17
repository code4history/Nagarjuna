import{_ as ot,F as st,f as A}from"./preload-helper.DXID1e7E.js";const k=[{id:"hentaigana",label:"変体仮名",short:"変"},{id:"siddham",label:"悉曇",short:"悉"},{id:"buddha",label:"仏名",short:"仏"},{id:"itaiji",label:"異体字",short:"異"},{id:"kumimoji",label:"組文字",short:"組"}];let x=null;function at(){return x||(x=ot(async()=>{const{dictionary:n}=await import("./dictionary.7xenPiF3.js");return{dictionary:n}},[],import.meta.url).then(({dictionary:n})=>{const t=new Map;for(const e of k)t.set(e.id,[]);for(const e of n){const i=t.get(e.category);i&&i.push({char:e.char,reading:e.reading,description:e.description,category:e.category})}return t}),x.catch(()=>{x=null})),x}const rt=/^[ぁ-んー]+$/;function ct(n,t,e,i){if(!t)return n.slice(0,i);let o;if(rt.test(t)){const a=[],s=[];for(const r of n)r.reading===t?a.push(r):r.reading.startsWith(t)&&s.push(r);o=[...a,...s]}else o=n.filter(a=>a.description.includes(t)||a.char===t);return o.map(a=>({e:a,recent:e.has(a.char)?0:1})).sort((a,s)=>a.recent-s.recent||a.e.reading.length-s.e.reading.length).map(a=>a.e).slice(0,i)}const lt=`
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
.naga-trigger {
  --naga-special-font: 'NINJAL Hentaigana', 'Noto Sans Siddham', 'Noto Sans JP', serif;
  --naga-accent: #5b4a8a;
}

.naga-popup[hidden],
.naga-trigger[hidden],
.naga-search-row[hidden],
.naga-list[hidden] {
  display: none !important;
}

.naga-trigger {
  position: fixed;
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

.naga-popup {
  position: fixed;
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
.naga-copy {
  display: none;
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
 * positionPopup() が visualViewport の実測から毎回設定する（未設定時のみ既定 226px）。
 * 各行の高さは naga-ime.ts の DOCK_*_PX と一致させる（タイトル 34・写し 22・読み欄 36・候補 44・枠 2）。
 */
.naga-popup.naga-is-docked {
  /* 画面の下に据え付けた板（「ふわふわ浮いて」への対応）: 左右いっぱい・上端のアクセントの線・上向きの影 */
  border: none;
  border-top: 2px solid var(--naga-accent);
  border-radius: 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.18);
  max-height: var(--naga-dock-max, 226px);
}
/* 縮むのは内側の list だけ（タイトル行・写しの行・読み欄は潰さない） */
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
/* 挿入先の写し: 欄が popup に隠れていても、どこに何が入ったか分かるように */
.naga-popup.naga-is-docked .naga-copy {
  display: block;
  flex: none;
  box-sizing: border-box;
  height: 22px;
  padding: 2px 10px;
  font-family: var(--naga-special-font);
  font-size: 13px;
  line-height: 18px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.naga-popup.naga-is-docked .naga-copy-new {
  color: var(--naga-accent);
  font-weight: 700;
}
.naga-popup.naga-is-docked .naga-copy-empty {
  color: #aaa;
}
.naga-popup.naga-is-docked .naga-copy-caret {
  color: var(--naga-accent);
}
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
`,dt="data-naga-style",I="naga-ime",T="nagarjuna-naga-recents",S="梵",F=14,R=60,_=560,K="よみを入力（例: あ / とき）",ht="読み",pt="読みを入力",gt="最近",ft="近",H=26,$={hentaigana:!0,siddham:!0,itaiji:!0},v=k.map(n=>n.id),J=new Set(v),W=34,Z=22,ut=36,Q=44,mt=3,tt=2,D=8,bt=40,et=W+Z+ut+tt,B=et+Q,xt=et+Q*mt,yt=W+Z+tt,X=12,Et={for:"htmlFor",categories:"categories","trigger-label":"triggerLabel",shortcut:"shortcut","recent-storage-key":"recentStorageKey","recent-max":"recentMax","max-candidates":"maxCandidates","dock-breakpoint":"dockBreakpoint","load-fonts":"loadFonts"},vt=["htmlFor","categories","triggerLabel","shortcut","recentStorageKey","recentMax","maxCandidates","dockBreakpoint","loadFonts"];function j(n,t){if(n!==null){if(n===""||n==="true"||n===t)return!0;if(n==="false")return!1}}function G(n){return typeof n=="boolean"?n:void 0}function it(n,t){if(!Number.isFinite(n))return;const e=Math.floor(n);return e>=t?e:void 0}function M(n,t){if(!(n===null||n.trim()===""))return it(Number(n),t)}function P(n,t){return typeof n=="number"?it(n,t):void 0}function E(n){return typeof n=="string"&&n!==""?n:void 0}function nt(n){const t=[];for(const e of n)typeof e=="string"&&J.has(e)&&!t.includes(e)&&t.push(e);return t.length?t:[...v]}function wt(n){return nt(n===null?[]:n.split(/\s+/))}function kt(n){return nt(Array.isArray(n)?n:[])}function y(n){return n==="recent"?gt:k.find(t=>t.id===n)?.label??n}function Ct(n){return n==="recent"?ft:k.find(t=>t.id===n)?.short??y(n).charAt(0)}let Lt=0;function N(n){return typeof HTMLInputElement<"u"&&(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)}function At(n){if(!n||typeof n!="object")return!1;const t=n;return typeof t.char=="string"&&typeof t.reading=="string"&&typeof t.description=="string"&&typeof t.category=="string"&&J.has(t.category)}function U(n){return{char:n.char,reading:n.reading,description:n.description,category:n.category}}function V(){let n=document.activeElement;for(;n&&n.shadowRoot&&n.shadowRoot.activeElement;)n=n.shadowRoot.activeElement;return n}function q(n){return typeof n=="string"?Array.from(document.querySelectorAll(n)):n instanceof Element?[n]:Array.from(n)}function Tt(){const n="@c4h/nagarjuna";return new TypeError(`[${n}] cannot construct NagaIME: <naga-ime> is defined by another implementation. Load a single copy of ${n}, or use document.createElement('naga-ime').`)}class w extends HTMLElement{static get observedAttributes(){return Object.keys(Et)}cfgFor="";cfgCategories=[...v];cfgTriggerLabel=S;cfgShortcut=!0;cfgRecentStorageKey=T;cfgRecentMax=F;cfgMaxCandidates=R;cfgDockBreakpoint=_;cfgLoadFonts=!0;uid;root;fontLoader=null;fields=new Map;dictionary=null;recents=[];recentsLoaded=!1;target=null;activeTab=v[0];candidates=[];selectedIndex=0;composing=!1;openState=!1;openSeq=0;docked=!1;folded=!1;lastCommitted=null;initialized=!1;pendingForLookup=null;trigger=null;popup=null;tabsEl=null;searchEl=null;listEl=null;searchRowEl=null;copyEl=null;foldEl=null;globalCleanup=null;constructor(t={}){if(new.target===w&&customElements.get(I)!==w)throw Tt();super(),this.uid=`naga-${++Lt}`;const e=this.attachShadow({mode:"open"}),i=document.createElement("style");i.setAttribute(dt,""),i.textContent=lt;const o=document.createElement("div");o.className="naga-root",e.append(i,o),this.root=o,t.categories!==void 0&&(this.categories=t.categories),t.triggerLabel!==void 0&&(this.triggerLabel=t.triggerLabel),t.shortcut!==void 0&&(this.shortcut=t.shortcut),t.recentStorageKey!==void 0&&(this.recentStorageKey=t.recentStorageKey),t.recentMax!==void 0&&(this.recentMax=t.recentMax),t.maxCandidates!==void 0&&(this.maxCandidates=t.maxCandidates),t.dockBreakpoint!==void 0&&(this.dockBreakpoint=t.dockBreakpoint),t.loadFonts!==void 0&&(this.loadFonts=t.loadFonts)}connectedCallback(){for(const t of vt)if(Object.prototype.hasOwnProperty.call(this,t)){const e=this[t];delete this[t],this[t]=e}if(this.initialized=!0,this.resolveFor(),document.readyState==="loading"&&!this.pendingForLookup){const t=()=>{this.pendingForLookup=null,this.isConnected&&this.resolveFor()};this.pendingForLookup=()=>document.removeEventListener("DOMContentLoaded",t),document.addEventListener("DOMContentLoaded",t,{once:!0})}}disconnectedCallback(){queueMicrotask(()=>{this.isConnected||(this.pendingForLookup?.(),this.pendingForLookup=null,this.detach())})}attributeChangedCallback(t,e,i){switch(t){case"for":this.setFor(i??"");break;case"categories":this.setCategories(wt(i));break;case"trigger-label":this.setTriggerLabel(E(i)??S);break;case"shortcut":this.cfgShortcut=j(i,t)??!0;break;case"recent-storage-key":this.setRecentStorageKey(E(i)??T);break;case"recent-max":this.setRecentMax(M(i,0)??F);break;case"max-candidates":this.cfgMaxCandidates=M(i,1)??R;break;case"dock-breakpoint":this.cfgDockBreakpoint=M(i,0)??_;break;case"load-fonts":this.cfgLoadFonts=j(i,t)??!0;break}}get htmlFor(){return this.cfgFor}set htmlFor(t){this.setFor(typeof t=="string"?t:"")}get categories(){return[...this.cfgCategories]}set categories(t){this.setCategories(kt(t))}get triggerLabel(){return this.cfgTriggerLabel}set triggerLabel(t){this.setTriggerLabel(E(t)??S)}get shortcut(){return this.cfgShortcut}set shortcut(t){this.cfgShortcut=G(t)??!0}get recentStorageKey(){return this.cfgRecentStorageKey}set recentStorageKey(t){this.setRecentStorageKey(t===null?null:E(t)??T)}get recentMax(){return this.cfgRecentMax}set recentMax(t){this.setRecentMax(P(t,0)??F)}get maxCandidates(){return this.cfgMaxCandidates}set maxCandidates(t){this.cfgMaxCandidates=P(t,1)??R}get dockBreakpoint(){return this.cfgDockBreakpoint}set dockBreakpoint(t){this.cfgDockBreakpoint=P(t,0)??_}get loadFonts(){return this.cfgLoadFonts}set loadFonts(t){this.cfgLoadFonts=G(t)??!0}get isOpen(){return this.openState}setFor(t){this.cfgFor=t,this.initialized&&this.isConnected&&this.resolveFor()}setCategories(t){this.cfgCategories=t,this.activeTab!=="recent"&&!t.includes(this.activeTab)&&(this.activeTab=t[0]),this.rebuildTabs()}setTriggerLabel(t){this.cfgTriggerLabel=t,this.trigger&&(this.trigger.textContent=t)}setRecentStorageKey(t){this.cfgRecentStorageKey=t,t!==null&&this.recentsLoaded&&this.reloadRecents()}setRecentMax(t){const e=this.cfgRecentMax;this.cfgRecentMax=t,t===0?(this.recents=[],this.activeTab==="recent"&&(this.activeTab=this.cfgCategories[0])):e===0?this.recentsLoaded&&this.reloadRecents():this.recents=this.recents.slice(0,t),(e===0||t===0)&&this.rebuildTabs()}attach(t){this.bindAll(q(t),"attach")}detach(t){const e=t===void 0?Array.from(this.fields.keys()):q(t);for(const i of e)N(i)&&this.unbindField(i);this.fields.size===0&&this.teardownDom()}destroy(){this.detach(),this.teardownDom(),this.remove()}bindAll(t,e){const i=t.filter(N),o=[];for(const a of i){const s=this.fields.get(a);s?e==="attach"?s.viaAttach=!0:s.viaFor=!0:o.includes(a)||o.push(a)}o.length!==0&&(this.isConnected||document.body.append(this),this.ensureDom(),this.cfgLoadFonts&&(this.fontLoader??=new st,this.fontLoader.loadFonts($).catch(()=>{})),o.forEach(a=>this.bindField(a,e)))}resolveFor(){const t=this.getRootNode(),e=[];if(typeof t.getElementById=="function")for(const i of this.cfgFor.split(/\s+/)){if(!i)continue;const o=t.getElementById(i);o&&e.push(o)}for(const[i,o]of Array.from(this.fields))!o.viaFor||e.includes(i)||(o.viaAttach?o.viaFor=!1:this.unbindField(i));e.length&&this.bindAll(e,"for"),this.fields.size===0&&this.teardownDom()}unbindField(t){const e=this.fields.get(t);e&&(e.cleanup(),e.addedClass&&t.classList.remove("naga-enabled"),e.appliedFontFamily!==null&&t.style.fontFamily===e.appliedFontFamily&&(t.style.fontFamily=""),this.fields.delete(t),this.target===t&&(this.close(),this.target=null,this.trigger&&(this.trigger.hidden=!0)))}async toggle(t){if(this.openState&&this.target===t){this.close({refocus:!0});return}await this.open(t)}async open(t){if(!this.fields.has(t))return;this.target=t;const e=++this.openSeq;if(!this.dictionary){this.searchEl&&(this.searchEl.placeholder="辞書を読み込み中…");const i=await at();this.dictionary=i,this.searchEl&&(this.searchEl.placeholder=K)}e!==this.openSeq||!this.popup||!this.searchEl||!this.fields.has(t)||(this.recentsLoaded||this.reloadRecents(),this.openState=!0,this.popup.hidden=!1,this.trigger?.setAttribute("aria-expanded","true"),this.searchEl.value="",this.selectedIndex=0,this.lastCommitted=null,this.recents.length?this.activeTab="recent":this.activeTab==="recent"&&(this.activeTab=this.cfgCategories[0]),this.renderTabs(),this.refresh(),this.positionPopup(),this.updateCopy(),this.searchEl.focus({preventScroll:!0}),this.emit("nagaOpen",{field:t}))}close({refocus:t=!1}={}){const e=this.openState;this.openSeq++,this.openState=!1,this.composing=!1,this.popup&&(this.popup.hidden=!0),this.trigger?.setAttribute("aria-expanded","false"),t&&this.target&&this.target.focus({preventScroll:!0}),e&&this.emit("nagaClose",{field:this.target})}emit(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!1,cancelable:!1,detail:e}))}ensureDom(){if(this.popup)return;const t=`${this.uid}-popup`,e=`${this.uid}-list`,i=document.createElement("button");i.type="button",i.className="naga-trigger",i.id=`${this.uid}-trigger`,i.textContent=this.cfgTriggerLabel,i.title="特殊文字を入力 (Ctrl+J / ⌘J)",i.setAttribute("aria-label","特殊文字を入力"),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-controls",t),i.setAttribute("aria-expanded","false"),i.hidden=!0,i.addEventListener("mousedown",g=>{g.preventDefault(),this.target&&this.toggle(this.target)}),i.addEventListener("click",g=>{g.detail===0&&this.target&&this.toggle(this.target)});const o=document.createElement("div");o.className="naga-popup",o.id=t,o.setAttribute("role","dialog"),o.setAttribute("aria-label","特殊文字入力"),o.hidden=!0;const a=document.createElement("div");a.className="naga-titlebar";const s=document.createElement("div");s.className="naga-tabs",s.setAttribute("role","tablist");const r=document.createElement("button");r.type="button",r.className="naga-close",r.title="閉じる (Esc)",r.setAttribute("aria-label","閉じる"),r.textContent="×",r.addEventListener("mousedown",g=>g.preventDefault()),r.addEventListener("click",()=>this.close({refocus:!0}));const d=document.createElement("button");d.type="button",d.className="naga-fold",d.addEventListener("mousedown",g=>g.preventDefault()),d.addEventListener("click",()=>this.toggleFold()),a.append(s,d,r);const l=document.createElement("div");l.className="naga-copy",l.setAttribute("aria-live","polite");const c=document.createElement("input");c.type="text",c.className="naga-search",c.placeholder=K,c.autocomplete="off",c.setAttribute("autocapitalize","off"),c.spellcheck=!1,c.setAttribute("role","combobox"),c.setAttribute("aria-expanded","true"),c.setAttribute("aria-controls",e),c.setAttribute("aria-label",pt);const h=document.createElement("div");h.className="naga-search-row";const p=document.createElement("span");p.className="naga-search-label",p.textContent=ht,p.setAttribute("aria-hidden","true"),h.append(p,c);const f=document.createElement("div");f.className="naga-list",f.id=e,f.setAttribute("role","listbox");const m=document.createElement("div");m.className="naga-hint",m.textContent="↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる",o.append(a,l,h,f,m),c.addEventListener("compositionstart",()=>{this.composing=!0}),c.addEventListener("compositionend",()=>{this.composing=!1,this.refresh()}),c.addEventListener("input",()=>{this.composing||this.refresh()}),c.addEventListener("keydown",g=>this.onSearchKeydown(g)),f.addEventListener("mousedown",g=>g.preventDefault()),f.addEventListener("click",g=>{const C=g.target?.closest?.(".naga-item");C&&this.commit(this.candidates[Number(C.dataset.index)])}),this.root.append(i,o),this.trigger=i,this.popup=o,this.tabsEl=s,this.searchEl=c,this.listEl=f,this.searchRowEl=h,this.copyEl=l,this.foldEl=d,this.applyFold(),this.rebuildTabs();const b=g=>{!this.openState||!this.popup||(typeof g.composedPath=="function"?g.composedPath():[g.target]).some(L=>L===this.popup||L===this.trigger||this.target!==null&&L===this.target)||this.close({refocus:!0})},u=()=>{this.openState&&this.positionPopup(),this.target&&this.trigger&&!this.trigger.hidden&&this.positionTrigger(this.target)},O=()=>{this.openState&&this.popup&&!this.popup.classList.contains("naga-is-docked")&&this.positionPopup(),this.target&&this.trigger&&!this.trigger.hidden&&this.positionTrigger(this.target)},z=window.visualViewport;document.addEventListener("mousedown",b),window.addEventListener("resize",u),window.addEventListener("scroll",O,!0),z?.addEventListener("resize",u),this.globalCleanup=()=>{document.removeEventListener("mousedown",b),window.removeEventListener("resize",u),window.removeEventListener("scroll",O,!0),z?.removeEventListener("resize",u)}}rebuildTabs(){const t=this.tabsEl;if(!t)return;const e=`${this.uid}-list`,i=this.cfgRecentMax>0?["recent",...this.cfgCategories]:[...this.cfgCategories];t.replaceChildren();for(const o of i){const a=document.createElement("button");a.type="button",a.className="naga-tab",a.id=`${this.uid}-tab-${o}`,a.dataset.category=o,a.textContent=y(o),a.title=y(o),a.setAttribute("aria-label",y(o)),a.setAttribute("role","tab"),a.setAttribute("aria-controls",e),a.addEventListener("mousedown",s=>s.preventDefault()),a.addEventListener("click",()=>{this.activeTab=o,this.lastCommitted=null,this.renderTabs(),this.refresh(),this.updateCopy(),this.searchEl?.focus({preventScroll:!0})}),t.appendChild(a)}this.renderTabs(),this.openState&&this.refresh()}teardownDom(){this.close(),this.globalCleanup?.(),this.globalCleanup=null,this.trigger?.remove(),this.popup?.remove(),this.trigger=null,this.popup=null,this.tabsEl=null,this.searchEl=null,this.listEl=null,this.searchRowEl=null,this.copyEl=null,this.foldEl=null,this.target=null,this.docked=!1}bindField(t,e){let i=null;if(!t.style.fontFamily){const l=this.fontLoader?this.fontLoader.getFontFamilyString($):[A.hentaigana,A.siddham,A.itaiji,"serif"].join(", ");let c;try{c=getComputedStyle(t).fontFamily}catch{c=""}t.style.fontFamily=c?`${c}, ${l}`:l,i=t.style.fontFamily}const o=!t.classList.contains("naga-enabled");t.classList.add("naga-enabled");const a=()=>this.showTrigger(t),s=()=>{if(this.openState)return;const l=V();l!==this.trigger&&!(N(l)&&this.fields.has(l))&&this.trigger&&(this.trigger.hidden=!0)},r=l=>{if(this.cfgShortcut&&(l.ctrlKey||l.metaKey)&&!l.altKey&&l.key.toLowerCase()==="j"){l.preventDefault(),this.toggle(t);return}l.key==="Escape"&&this.openState&&this.target===t&&this.close()},d=t;d.addEventListener("focus",a),d.addEventListener("blur",s),d.addEventListener("keydown",r),this.fields.set(t,{appliedFontFamily:i,addedClass:o,viaFor:e==="for",viaAttach:e==="attach",cleanup:()=>{d.removeEventListener("focus",a),d.removeEventListener("blur",s),d.removeEventListener("keydown",r)}}),V()===t&&this.showTrigger(t)}showTrigger(t){this.target=t,this.trigger&&(this.positionTrigger(t),this.trigger.hidden=!1)}positionTrigger(t){if(!this.trigger)return;const e=t.getBoundingClientRect();this.trigger.style.top=`${e.top-H-4}px`,this.trigger.style.left=`${e.right-H}px`}currentEntries(){return this.activeTab==="recent"?this.recents:this.dictionary?.get(this.activeTab)??[]}refresh(){if(!this.searchEl)return;const t=this.searchEl.value.trim(),e=new Set(this.recents.map(i=>i.char));this.candidates=ct(this.currentEntries(),t,e,this.cfgMaxCandidates),this.selectedIndex=0,this.renderList()}renderTabs(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category===this.activeTab;t.classList.toggle("naga-is-active",e),t.setAttribute("aria-selected",String(e))}),this.applyTabLabels()}applyTabLabels(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category;if(!e)return;const i=this.docked&&e!==this.activeTab;t.textContent=i?Ct(e):y(e)})}setDocked(t){this.docked!==t&&(this.docked=t,this.applyTabLabels(),this.applyFold())}toggleFold(){this.folded=!this.folded,this.applyFold(),this.openState&&this.positionPopup(),this.updateCopy(),this.folded||this.searchEl?.focus({preventScroll:!0})}applyFold(){const t=this.folded&&this.docked;this.popup?.classList.toggle("naga-is-folded",t),this.searchRowEl&&(this.searchRowEl.hidden=t),this.listEl&&(this.listEl.hidden=t);const e=this.foldEl;e&&(e.setAttribute("aria-expanded",String(!this.folded)),e.setAttribute("aria-label",this.folded?"ひらく":"たたむ"),e.title=this.folded?"ひらく":"たたむ",e.textContent=this.folded?"▴":"▾")}updateCopy(){const t=this.copyEl;if(!t)return;t.replaceChildren();const e=this.target;if(!e)return;const i=(c,h)=>{const p=document.createElement("span");return p.className=c,p.textContent=h,p};if(e instanceof HTMLInputElement&&e.type==="password"){t.append(i("naga-copy-empty","（非表示）"));return}const o=e.selectionStart??e.value.length,a=Array.from(e.value.slice(0,o));if(a.length===0){t.append(i("naga-copy-empty","（先頭）"));return}const s=a.slice(-X),r=c=>c.join("").replace(/\r?\n/g,"↵");let d=0;if(this.lastCommitted){const c=Array.from(this.lastCommitted).length;c<=s.length&&s.slice(-c).join("")===this.lastCommitted&&(d=c)}a.length>X&&t.append("…");const l=s.slice(0,s.length-d);l.length&&t.append(r(l)),d&&t.append(i("naga-copy-new",r(s.slice(-d)))),t.append(i("naga-copy-caret","▏"))}renderList(){const t=this.listEl;if(!t)return;if(t.replaceChildren(),!this.candidates.length){const i=document.createElement("div");i.className="naga-empty",i.textContent="候補なし",t.appendChild(i),this.searchEl?.removeAttribute("aria-activedescendant");return}let e=null;this.candidates.forEach((i,o)=>{const a=o===this.selectedIndex,s=document.createElement("div");s.className=a?"naga-item naga-is-selected":"naga-item",s.id=`${this.uid}-option-${o}`,s.setAttribute("role","option"),s.setAttribute("aria-selected",String(a)),s.dataset.index=String(o),s.dataset.char=i.char;const r=document.createElement("span");r.className="naga-num",r.textContent=o<9?String(o+1):"";const d=document.createElement("span");d.className="naga-char",d.textContent=i.char;const l=document.createElement("span");l.className="naga-meta";const c=document.createElement("span");c.className="naga-reading",c.textContent=i.reading;const h=document.createElement("span");h.className="naga-desc",h.textContent=i.description,l.append(c,h),s.append(r,d,l),t.appendChild(s),a&&(this.searchEl?.setAttribute("aria-activedescendant",s.id),e=s)}),e&&this.revealInList(e)}revealInList(t){if(!this.listEl)return;const e=this.listEl,i=t.offsetTop-(t.offsetParent===e?0:e.offsetTop),o=i+t.offsetHeight;i<e.scrollTop?this.listEl.scrollTop=i:o>e.scrollTop+e.clientHeight&&(this.listEl.scrollTop=o-e.clientHeight)}onSearchKeydown(t){const e=this.candidates.length,i=this.composing||t.isComposing||t.keyCode===229;if(t.key==="ArrowDown"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex+1)%Math.max(e,1),this.renderList()}else if(t.key==="ArrowUp"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex-1+Math.max(e,1))%Math.max(e,1),this.renderList()}else if(t.key==="Enter"||t.key==="Tab"){if(i)return;t.preventDefault();const o=this.candidates[this.selectedIndex];o&&this.commit(o)}else if(t.key==="Escape"){if(i)return;t.preventDefault(),this.close({refocus:!0})}else if(/^[1-9]$/.test(t.key)&&!i){const o=this.candidates[Number(t.key)-1];o&&(t.preventDefault(),this.commit(o))}}commit(t){const e=this.target;if(!(!e||!t)){if(this.pushRecent(t),typeof e.setRangeText=="function"){const i=e.selectionStart??e.value.length,o=e.selectionEnd??e.value.length;e.setRangeText(t.char,i,o,"end")}else e.value+=t.char;e.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0,inputType:"insertText",data:t.char})),this.emit("nagaCommit",{field:e,candidate:U(t)}),this.lastCommitted=t.char,this.searchEl&&(this.searchEl.value=""),this.selectedIndex=0,this.refresh(),this.positionPopup(),this.updateCopy(),this.searchEl?.focus({preventScroll:!0})}}positionPopup(){const t=this.target,e=this.popup;if(!t||!e)return;const i=t.getBoundingClientRect(),o=window.visualViewport,a=o?o.width:window.innerWidth,s=e.style;if(a<this.cfgDockBreakpoint){e.classList.add("naga-is-docked"),this.setDocked(!0),s.position="fixed",s.left="0px",s.right="0px",s.width="auto",s.top="auto";const f=o?Math.max(0,window.innerHeight-(o.height+o.offsetTop))+D:D;s.bottom=`${f}px`;const m=o?o.height:window.innerHeight,b=Math.max(0,m-D);let u=Math.min(xt,b-bt);u<B&&(u=Math.min(B,b)),this.folded&&(u=Math.min(yt,b)),s.maxHeight=`${u}px`,s.setProperty("--naga-dock-max",`${u}px`),s.setProperty("--naga-dock-avail",`${m}px`);return}e.classList.remove("naga-is-docked"),this.setDocked(!1),s.maxHeight&&(s.maxHeight=""),s.removeProperty("--naga-dock-max"),s.removeProperty("--naga-dock-avail"),s.position="fixed",s.width=`${Math.min(360,a-16)}px`;let r;try{r=this.measureCaret(t)}catch{r=null}const d=e.offsetHeight||320,l=e.offsetWidth||360,c=o?o.height+o.offsetTop:window.innerHeight;let h,p;r?(h=r.y+r.lineHeight+2,p=r.x):(h=i.bottom+4,p=i.left),h+d>c&&(h=r?r.y-d-2:i.top-d-4),p+l>a&&(p=a-l-8),p<4&&(p=4),s.top=`${h}px`,s.left=`${p}px`,s.bottom="auto",s.right="auto"}measureCaret(t){const e=t.getBoundingClientRect(),i=getComputedStyle(t),o=["box-sizing","padding-top","padding-right","padding-bottom","padding-left","border-top-width","border-right-width","border-bottom-width","border-left-width","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-indent","word-wrap","overflow-wrap","tab-size","text-transform"],a=document.createElement("div"),s=a.style;for(const m of o)s.setProperty(m,i.getPropertyValue(m));s.position="absolute",s.top="-9999px",s.left="-9999px",s.visibility="hidden",s.whiteSpace=t instanceof HTMLTextAreaElement?"pre-wrap":"pre",s.width=`${e.width}px`;const r=t.selectionStart??t.value.length;a.textContent=t.value.slice(0,r);const d=document.createElement("span");d.textContent="​",a.appendChild(d),this.root.appendChild(a);const l=d.getBoundingClientRect(),c=a.getBoundingClientRect();a.remove();const h=parseFloat(i.lineHeight)||(parseFloat(i.fontSize)||16)*1.2,p=l.left-c.left-(t.scrollLeft||0),f=l.top-c.top-(t.scrollTop||0);return{x:e.left+p,y:e.top+f,lineHeight:h}}reloadRecents(){this.recentsLoaded=!0;const t=this.cfgRecentStorageKey,e=this.cfgRecentMax;if(t===null||e===0){e===0&&(this.recents=[]);return}try{const i=JSON.parse(localStorage.getItem(t)||"[]");this.recents=Array.isArray(i)?i.filter(At).slice(0,e):[]}catch{this.recents=[]}}pushRecent(t){const e=this.cfgRecentMax;if(e===0)return;const i=U(t);this.recents=[i,...this.recents.filter(a=>a.char!==i.char)].slice(0,e);const o=this.cfgRecentStorageKey;if(o!==null)try{localStorage.setItem(o,JSON.stringify(this.recents))}catch{}}}typeof customElements<"u"&&!customElements.get(I)&&customElements.define(I,w);const Y=document.getElementById("version");Y&&(Y.textContent="1.1.0");if(new URLSearchParams(location.search).get("debugViewport")==="1"){const n=document.createElement("pre");n.id="naga-debug-viewport",n.setAttribute("aria-hidden","true"),n.style.cssText=["font: 11px/1.5 ui-monospace, monospace","background: #f4f4f4","border: 1px solid #ccc","padding: 6px 8px","white-space: pre","overflow-x: auto"].join(";");const t=document.querySelector(".lead");t?t.after(n):document.body.prepend(n);const e=()=>{const i=window.visualViewport,o=i?Math.round(i.height):window.innerHeight,a=i?Math.round(i.offsetTop):0,s=Math.max(0,window.innerHeight-(o+a)),r=document.querySelector("naga-ime")?.shadowRoot?.querySelector(".naga-popup"),d=r&&!r.hidden,l=d?r.getBoundingClientRect():null,c=d?r.style.maxHeight||"(未設定)":"-",h=l?Math.round(l.top-a):null;n.textContent=[`vv.height   = ${o}`,`vv.offsetTop= ${a}`,`innerHeight = ${window.innerHeight}`,`H_kb        = ${s}`,`popup max-h = ${c}`,`popup 実高  = ${l?Math.round(l.height):"-"}`,`popup 上端  = ${l?Math.round(l.top):"-"}`,`上に残る帯  = ${h===null?"-":h}`,`docked      = ${r?r.classList.contains("naga-is-docked"):"-"}`,`folded      = ${r?r.classList.contains("naga-is-folded"):"-"}`].join(`
`)};e(),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),window.visualViewport?.addEventListener("resize",e),window.visualViewport?.addEventListener("scroll",e),setInterval(e,500)}
