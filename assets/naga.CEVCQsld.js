import{_ as R,F as P,f as y}from"./preload-helper.DXID1e7E.js";const x=[{id:"hentaigana",label:"変体仮名",short:"変"},{id:"siddham",label:"悉曇",short:"悉"},{id:"buddha",label:"仏名",short:"仏"},{id:"itaiji",label:"異体字",short:"異"},{id:"kumimoji",label:"組文字",short:"組"}];let v=null;function z(){return v||(v=R(async()=>{const{dictionary:c}=await import("./dictionary.7xenPiF3.js");return{dictionary:c}},[],import.meta.url).then(({dictionary:c})=>{const t=new Map;for(const e of x)t.set(e.id,[]);for(const e of c){const n=t.get(e.category);n&&n.push({char:e.char,reading:e.reading,description:e.description,category:e.category})}return t}),v.catch(()=>{v=null})),v}const I=/^[ぁ-んー]+$/;function $(c,t,e,n){if(!t)return c.slice(0,n);let i;if(I.test(t)){const o=[],a=[];for(const r of c)r.reading===t?o.push(r):r.reading.startsWith(t)&&a.push(r);i=[...o,...a]}else i=c.filter(o=>o.description.includes(t)||o.char===t);return i.map(o=>({e:o,recent:e.has(o.char)?0:1})).sort((o,a)=>o.recent-a.recent||o.e.reading.length-a.e.reading.length).map(o=>o.e).slice(0,n)}const M=`
.naga-popup,
.naga-trigger {
  --naga-special-font: 'NINJAL Hentaigana', 'Noto Sans Siddham', 'Noto Sans JP', serif;
  --naga-accent: #5b4a8a;
}

.naga-popup[hidden],
.naga-trigger[hidden] {
  display: none !important;
}

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
 * 読み入力欄の行（是正設計 v2 §5「区別の付け方」）。
 * PC（non-docked）では display: contents なので、input は従来どおり popup 直下の
 * flex item として並び、行も高さも増えない。ラベルは PC では出さない。
 */
.naga-search-row {
  display: contents;
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
  flex: none;
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
 * モバイル dock（是正設計 v2 §3「使える高さからの逆算」・§4 案 A・§5・§6.2）。
 * ここから下の規則はすべて .naga-popup.naga-is-docked スコープに閉じる（PC 非影響）。
 * 高さの静的な viewport 比指定（旧 dock ルールの vh 値）は廃止した。--naga-dock-max は
 * positionPopup() が visualViewport の実測から毎回設定する（未設定時のみ案 A の既定 224px）。
 */
.naga-popup.naga-is-docked {
  border-radius: 12px 12px 0 0;
  max-height: var(--naga-dock-max, 224px);
}
/* 縮むのは内側の list だけ（タブ帯と読み入力欄は潰さない） */
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
/* タブ帯: 背景と下線で「ヘッダー帯」に見せ、候補領域の白と分ける（高さは増やさない） */
.naga-popup.naga-is-docked .naga-titlebar {
  background: #fafafa;
  border-bottom: 1px solid #e2e2e2;
}
.naga-popup.naga-is-docked .naga-tab {
  padding: 9px 12px;
  font-size: 15px;
  line-height: 1.25;
}
.naga-popup.naga-is-docked .naga-close {
  padding: 0 14px;
}
/* 読み入力欄: アクセント縦線＋「読み」ラベルで本体の入力欄と見分ける（高さは 1 行のまま） */
.naga-popup.naga-is-docked .naga-search-row {
  display: flex;
  align-items: stretch;
  flex: none;
  margin: 6px 8px;
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
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  font-size: 16px; /* iOS の focus 時自動ズームを避ける下限 */
  padding: 7px 10px;
}
.naga-popup.naga-is-docked .naga-search:focus {
  outline-offset: -2px;
}
/* 候補行: 44px/行（設計 §3.3）。max-height 224px で 3 件強が見える */
.naga-popup.naga-is-docked .naga-item {
  box-sizing: border-box;
  min-height: 44px;
  padding: 5px 10px;
}
`,C="data-naga-style";function H(c=document){if(c.head.querySelector(`style[${C}]`))return;const t=c.createElement("style");t.setAttribute(C,""),t.textContent=M,c.head.appendChild(t)}const F="nagarjuna-naga-recents",A="よみを入力（例: あ / とき）",O="読み",K="読みを入力",X="最近",B="近",S={hentaigana:!0,siddham:!0,itaiji:!0},N=new Set(x.map(c=>c.id)),V=48,j=40,Y=40,q=44,G=3,J=2,U=10,T=8,W=j+Y+q*G+J+U,Q=96;function w(c){return c==="recent"?X:x.find(t=>t.id===c)?.label??c}function Z(c){return c==="recent"?B:x.find(t=>t.id===c)?.short??w(c).charAt(0)}let tt=0;function E(c){return typeof HTMLInputElement<"u"&&(c instanceof HTMLInputElement||c instanceof HTMLTextAreaElement)}function et(c){if(!c||typeof c!="object")return!1;const t=c;return typeof t.char=="string"&&typeof t.reading=="string"&&typeof t.description=="string"&&typeof t.category=="string"&&N.has(t.category)}class nt{options;uid;fontLoader;fields=new Map;dictionary=null;recents;target=null;activeTab;candidates=[];selectedIndex=0;composing=!1;openState=!1;openSeq=0;docked=!1;trigger=null;popup=null;tabsEl=null;searchEl=null;listEl=null;globalCleanup=null;constructor(t={}){const e=(t.categories??x.map(n=>n.id)).filter(n=>N.has(n));this.options={categories:e.length?e:x.map(n=>n.id),triggerLabel:t.triggerLabel??"梵",shortcut:t.shortcut??!0,recentStorageKey:t.recentStorageKey===void 0?F:t.recentStorageKey,recentMax:Math.max(0,t.recentMax??14),maxCandidates:Math.max(1,t.maxCandidates??60),dockBreakpoint:t.dockBreakpoint??560,loadFonts:t.loadFonts??!0},this.uid=`naga-${++tt}`,this.fontLoader=this.options.loadFonts?new P:null,this.recents=this.loadRecents(),this.activeTab=this.options.categories[0]}get isOpen(){return this.openState}attach(t){const n=(typeof t=="string"?Array.from(document.querySelectorAll(t)):t instanceof Element?[t]:Array.from(t)).filter(E).filter(i=>!this.fields.has(i));n.length!==0&&(this.ensureDom(),this.fontLoader&&this.fontLoader.loadFonts(S).catch(()=>{}),n.forEach(i=>this.bindField(i)))}detach(t){const e=t===void 0?Array.from(this.fields.keys()):typeof t=="string"?Array.from(document.querySelectorAll(t)):t instanceof Element?[t]:Array.from(t);for(const n of e){if(!E(n))continue;const i=this.fields.get(n);i&&(i.cleanup(),i.addedClass&&n.classList.remove("naga-enabled"),i.appliedFontFamily!==null&&n.style.fontFamily===i.appliedFontFamily&&(n.style.fontFamily=""),this.fields.delete(n),this.target===n&&(this.close(),this.target=null,this.trigger&&(this.trigger.hidden=!0)))}this.fields.size===0&&this.teardownDom()}destroy(){this.detach(),this.teardownDom()}async toggle(t){if(this.openState&&this.target===t){this.close({refocus:!0});return}await this.open(t)}async open(t){if(!this.fields.has(t))return;this.target=t;const e=++this.openSeq;if(!this.dictionary){this.searchEl&&(this.searchEl.placeholder="辞書を読み込み中…");const n=await z();this.dictionary=n,this.searchEl&&(this.searchEl.placeholder=A)}e!==this.openSeq||!this.popup||!this.searchEl||!this.fields.has(t)||(this.openState=!0,this.popup.hidden=!1,this.trigger?.setAttribute("aria-expanded","true"),this.searchEl.value="",this.selectedIndex=0,this.recents.length?this.activeTab="recent":this.activeTab==="recent"&&(this.activeTab=this.options.categories[0]),this.renderTabs(),this.refresh(),this.positionPopup(),this.searchEl.focus())}close({refocus:t=!1}={}){this.openSeq++,this.openState=!1,this.composing=!1,this.popup&&(this.popup.hidden=!0),this.trigger?.setAttribute("aria-expanded","false"),t&&this.target&&this.target.focus()}ensureDom(){if(this.popup)return;H(document);const t=`${this.uid}-popup`,e=`${this.uid}-list`,n=document.createElement("button");n.type="button",n.className="naga-trigger",n.id=`${this.uid}-trigger`,n.textContent=this.options.triggerLabel,n.title="特殊文字を入力 (Ctrl+J / ⌘J)",n.setAttribute("aria-label","特殊文字を入力"),n.setAttribute("aria-haspopup","dialog"),n.setAttribute("aria-controls",t),n.setAttribute("aria-expanded","false"),n.hidden=!0,n.addEventListener("mousedown",d=>{d.preventDefault(),this.target&&this.toggle(this.target)}),n.addEventListener("click",d=>{d.detail===0&&this.target&&this.toggle(this.target)});const i=document.createElement("div");i.className="naga-popup",i.id=t,i.setAttribute("role","dialog"),i.setAttribute("aria-label","特殊文字入力"),i.hidden=!0;const o=document.createElement("div");o.className="naga-titlebar";const a=document.createElement("div");a.className="naga-tabs",a.setAttribute("role","tablist");const r=document.createElement("button");r.type="button",r.className="naga-close",r.title="閉じる (Esc)",r.setAttribute("aria-label","閉じる"),r.textContent="×",r.addEventListener("mousedown",d=>d.preventDefault()),r.addEventListener("click",()=>this.close({refocus:!0})),o.append(a,r);const s=document.createElement("input");s.type="text",s.className="naga-search",s.placeholder=A,s.autocomplete="off",s.setAttribute("autocapitalize","off"),s.spellcheck=!1,s.setAttribute("role","combobox"),s.setAttribute("aria-expanded","true"),s.setAttribute("aria-controls",e),s.setAttribute("aria-label",K);const l=document.createElement("div");l.className="naga-search-row";const h=document.createElement("span");h.className="naga-search-label",h.textContent=O,h.setAttribute("aria-hidden","true"),l.append(h,s);const g=document.createElement("div");g.className="naga-list",g.id=e,g.setAttribute("role","listbox");const u=document.createElement("div");u.className="naga-hint",u.textContent="↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる",i.append(o,l,g,u);const b=["recent",...this.options.categories];for(const d of b){const p=document.createElement("button");p.type="button",p.className="naga-tab",p.id=`${this.uid}-tab-${d}`,p.dataset.category=d,p.textContent=w(d),p.title=w(d),p.setAttribute("aria-label",w(d)),p.setAttribute("role","tab"),p.setAttribute("aria-controls",e),p.addEventListener("mousedown",D=>D.preventDefault()),p.addEventListener("click",()=>{this.activeTab=d,this.renderTabs(),this.refresh(),this.searchEl?.focus()}),a.appendChild(p)}s.addEventListener("compositionstart",()=>{this.composing=!0}),s.addEventListener("compositionend",()=>{this.composing=!1,this.refresh()}),s.addEventListener("input",()=>{this.composing||this.refresh()}),s.addEventListener("keydown",d=>this.onSearchKeydown(d)),g.addEventListener("mousedown",d=>d.preventDefault()),g.addEventListener("click",d=>{const p=d.target?.closest?.(".naga-item");p&&this.commit(this.candidates[Number(p.dataset.index)])}),document.body.append(n,i),this.trigger=n,this.popup=i,this.tabsEl=a,this.searchEl=s,this.listEl=g;const f=d=>{if(!this.openState||!this.popup)return;const p=d.target;p&&(this.popup.contains(p)||p===this.trigger||p===this.target)||this.close({refocus:!0})},m=()=>{this.openState&&this.positionPopup(),this.target&&this.trigger&&!this.trigger.hidden&&this.positionTrigger(this.target)},k=()=>{this.openState&&this.popup&&!this.popup.classList.contains("naga-is-docked")&&this.positionPopup()},L=window.visualViewport;document.addEventListener("mousedown",f),window.addEventListener("resize",m),window.addEventListener("scroll",k,!0),L?.addEventListener("resize",m),this.globalCleanup=()=>{document.removeEventListener("mousedown",f),window.removeEventListener("resize",m),window.removeEventListener("scroll",k,!0),L?.removeEventListener("resize",m)}}teardownDom(){this.close(),this.globalCleanup?.(),this.globalCleanup=null,this.trigger?.remove(),this.popup?.remove(),this.trigger=null,this.popup=null,this.tabsEl=null,this.searchEl=null,this.listEl=null,this.target=null,this.docked=!1}bindField(t){let e=null;if(!t.style.fontFamily){const s=this.fontLoader?this.fontLoader.getFontFamilyString(S):[y.hentaigana,y.siddham,y.itaiji,"serif"].join(", ");let l="";try{l=getComputedStyle(t).fontFamily}catch{l=""}t.style.fontFamily=l?`${l}, ${s}`:s,e=t.style.fontFamily}const n=!t.classList.contains("naga-enabled");t.classList.add("naga-enabled");const i=()=>this.showTrigger(t),o=()=>{if(this.openState)return;const s=document.activeElement;s!==this.trigger&&!(E(s)&&this.fields.has(s))&&this.trigger&&(this.trigger.hidden=!0)},a=s=>{if(this.options.shortcut&&(s.ctrlKey||s.metaKey)&&!s.altKey&&s.key.toLowerCase()==="j"){s.preventDefault(),this.toggle(t);return}s.key==="Escape"&&this.openState&&this.target===t&&this.close()},r=t;r.addEventListener("focus",i),r.addEventListener("blur",o),r.addEventListener("keydown",a),this.fields.set(t,{appliedFontFamily:e,addedClass:n,cleanup:()=>{r.removeEventListener("focus",i),r.removeEventListener("blur",o),r.removeEventListener("keydown",a)}}),document.activeElement===t&&this.showTrigger(t)}showTrigger(t){this.target=t,this.trigger&&(this.positionTrigger(t),this.trigger.hidden=!1)}positionTrigger(t){if(!this.trigger)return;const e=t.getBoundingClientRect(),n=26;this.trigger.style.top=`${window.scrollY+e.top-n-4}px`,this.trigger.style.left=`${window.scrollX+e.right-n}px`}currentEntries(){return this.activeTab==="recent"?this.recents:this.dictionary?.get(this.activeTab)??[]}refresh(){if(!this.searchEl)return;const t=this.searchEl.value.trim(),e=new Set(this.recents.map(n=>n.char));this.candidates=$(this.currentEntries(),t,e,this.options.maxCandidates),this.selectedIndex=0,this.renderList()}renderTabs(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category===this.activeTab;t.classList.toggle("naga-is-active",e),t.setAttribute("aria-selected",String(e))}),this.applyTabLabels()}applyTabLabels(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const e=t.dataset.category;if(!e)return;const n=this.docked&&e!==this.activeTab;t.textContent=n?Z(e):w(e)})}setDocked(t){this.docked!==t&&(this.docked=t,this.applyTabLabels())}renderList(){const t=this.listEl;if(t){if(t.replaceChildren(),!this.candidates.length){const e=document.createElement("div");e.className="naga-empty",e.textContent="候補なし",t.appendChild(e),this.searchEl?.removeAttribute("aria-activedescendant");return}this.candidates.forEach((e,n)=>{const i=n===this.selectedIndex,o=document.createElement("div");o.className=i?"naga-item naga-is-selected":"naga-item",o.id=`${this.uid}-option-${n}`,o.setAttribute("role","option"),o.setAttribute("aria-selected",String(i)),o.dataset.index=String(n),o.dataset.char=e.char;const a=document.createElement("span");a.className="naga-num",a.textContent=n<9?String(n+1):"";const r=document.createElement("span");r.className="naga-char",r.textContent=e.char;const s=document.createElement("span");s.className="naga-meta";const l=document.createElement("span");l.className="naga-reading",l.textContent=e.reading;const h=document.createElement("span");h.className="naga-desc",h.textContent=e.description,s.append(l,h),o.append(a,r,s),t.appendChild(o),i&&(this.searchEl?.setAttribute("aria-activedescendant",o.id),typeof o.scrollIntoView=="function"&&o.scrollIntoView({block:"nearest"}))})}}onSearchKeydown(t){const e=this.candidates.length,n=this.composing||t.isComposing||t.keyCode===229;if(t.key==="ArrowDown"){if(n)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex+1)%Math.max(e,1),this.renderList()}else if(t.key==="ArrowUp"){if(n)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex-1+Math.max(e,1))%Math.max(e,1),this.renderList()}else if(t.key==="Enter"||t.key==="Tab"){if(n)return;t.preventDefault();const i=this.candidates[this.selectedIndex];i&&this.commit(i)}else if(t.key==="Escape"){if(n)return;t.preventDefault(),this.close({refocus:!0})}else if(/^[1-9]$/.test(t.key)&&!n){const i=this.candidates[Number(t.key)-1];i&&(t.preventDefault(),this.commit(i))}}commit(t){const e=this.target;if(!(!e||!t)){if(this.pushRecent(t),typeof e.setRangeText=="function"){const n=e.selectionStart??e.value.length,i=e.selectionEnd??e.value.length;e.setRangeText(t.char,n,i,"end")}else e.value+=t.char;e.dispatchEvent(new Event("input",{bubbles:!0})),this.searchEl&&(this.searchEl.value=""),this.selectedIndex=0,this.refresh(),this.positionPopup(),this.searchEl?.focus()}}positionPopup(){const t=this.target,e=this.popup;if(!t||!e)return;const n=t.getBoundingClientRect(),i=window.visualViewport,o=i?i.width:window.innerWidth,a=e.style;if(o<this.options.dockBreakpoint){e.classList.add("naga-is-docked"),this.setDocked(!0),a.position="fixed",a.left="8px",a.right="8px",a.width="auto",a.top="auto";const b=i?Math.max(0,window.innerHeight-(i.height+i.offsetTop))+T:T;a.bottom=`${b}px`;const f=i?i.height:window.innerHeight,m=Math.max(Q,Math.min(W,f-V));a.maxHeight=`${m}px`,a.setProperty("--naga-dock-max",`${m}px`),a.setProperty("--naga-dock-avail",`${f}px`);return}e.classList.remove("naga-is-docked"),this.setDocked(!1),a.maxHeight&&(a.maxHeight=""),a.removeProperty("--naga-dock-max"),a.removeProperty("--naga-dock-avail"),a.position="absolute",a.width=`${Math.min(360,o-16)}px`;let r=null;try{r=this.measureCaret(t)}catch{r=null}const s=e.offsetHeight||320,l=e.offsetWidth||360,h=i?i.height+i.offsetTop:window.innerHeight;let g,u;r?(g=r.y+r.lineHeight+2,u=r.x):(g=window.scrollY+n.bottom+4,u=window.scrollX+n.left),g-window.scrollY+s>h&&(g=r?r.y-s-2:window.scrollY+n.top-s-4),u-window.scrollX+l>o&&(u=window.scrollX+o-l-8),u<window.scrollX+4&&(u=window.scrollX+4),a.top=`${g}px`,a.left=`${u}px`,a.bottom="auto",a.right="auto"}measureCaret(t){const e=t.getBoundingClientRect(),n=getComputedStyle(t),i=["box-sizing","padding-top","padding-right","padding-bottom","padding-left","border-top-width","border-right-width","border-bottom-width","border-left-width","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-indent","word-wrap","overflow-wrap","tab-size","text-transform"],o=document.createElement("div"),a=o.style;for(const f of i)a.setProperty(f,n.getPropertyValue(f));a.position="absolute",a.top="-9999px",a.left="-9999px",a.visibility="hidden",a.whiteSpace=t instanceof HTMLTextAreaElement?"pre-wrap":"pre",a.width=`${e.width}px`;const r=t.selectionStart??t.value.length;o.textContent=t.value.slice(0,r);const s=document.createElement("span");s.textContent="​",o.appendChild(s),document.body.appendChild(o);const l=s.getBoundingClientRect(),h=o.getBoundingClientRect();o.remove();const g=parseFloat(n.lineHeight)||(parseFloat(n.fontSize)||16)*1.2,u=l.left-h.left-(t.scrollLeft||0),b=l.top-h.top-(t.scrollTop||0);return{x:window.scrollX+e.left+u,y:window.scrollY+e.top+b,lineHeight:g}}loadRecents(){const t=this.options.recentStorageKey;if(!t)return[];try{const e=JSON.parse(localStorage.getItem(t)||"[]");return Array.isArray(e)?e.filter(et).slice(0,this.options.recentMax):[]}catch{return[]}}pushRecent(t){const e={char:t.char,reading:t.reading,description:t.description,category:t.category};this.recents=[e,...this.recents.filter(i=>i.char!==e.char)].slice(0,this.options.recentMax);const n=this.options.recentStorageKey;if(n)try{localStorage.setItem(n,JSON.stringify(this.recents))}catch{}}}const _=document.getElementById("version");_&&(_.textContent="1.1.0");const it=new nt;it.attach(".naga-target");if(new URLSearchParams(location.search).get("debugViewport")==="1"){const c=document.createElement("div");c.id="naga-debug-viewport",c.setAttribute("aria-hidden","true"),c.style.cssText=["position: fixed","top: 0","left: 0","z-index: 10000","margin: 4px","padding: 6px 8px","background: rgba(0, 0, 0, 0.78)","color: #fff","font: 11px/1.5 ui-monospace, monospace","white-space: pre","border-radius: 6px","pointer-events: none"].join(";"),document.body.appendChild(c);const t=()=>{const e=window.visualViewport,n=e?Math.round(e.height):window.innerHeight,i=e?Math.round(e.offsetTop):0,o=Math.max(0,window.innerHeight-(n+i)),a=document.querySelector(".naga-popup"),r=a&&!a.hidden,s=r?a.getBoundingClientRect():null,l=r?a.style.maxHeight||"(未設定)":"-",h=s?Math.round(s.top-i):null;c.textContent=[`vv.height   = ${n}`,`vv.offsetTop= ${i}`,`innerHeight = ${window.innerHeight}`,`H_kb        = ${o}`,`popup max-h = ${l}`,`popup 実高  = ${s?Math.round(s.height):"-"}`,`popup 上端  = ${s?Math.round(s.top):"-"}`,`上に残る帯  = ${h===null?"-":h}`,`docked      = ${a?a.classList.contains("naga-is-docked"):"-"}`].join(`
`)};t(),window.addEventListener("resize",t),window.addEventListener("scroll",t,!0),window.visualViewport?.addEventListener("resize",t),window.visualViewport?.addEventListener("scroll",t),setInterval(t,500)}
