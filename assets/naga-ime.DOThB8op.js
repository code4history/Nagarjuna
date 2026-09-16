(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?a.credentials="include":e.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(e){if(e.ep)return;e.ep=!0;const a=n(e);fetch(e.href,a)}})();class C extends Error{constructor(t,n,i){super(i??`Failed to load font for ${t}${n?` from ${n}`:""}`),this.system=t,this.url=n,this.name="FontLoadError"}system;url}const M=""+new URL("ninjal_hentaigana.ZV3gqHt3.woff2",import.meta.url).href,z=""+new URL("ninjal_hentaigana.DM189ZoV.woff",import.meta.url).href,H={hentaigana:`
    @font-face {
      font-family: 'NINJAL Hentaigana';
      src: url('${M}') format('woff2'),
           url('${z}') format('woff');
      font-display: swap;
    }
  `},b={hentaigana:"NINJAL Hentaigana",siddham:"Noto Sans Siddham",itaiji:"Noto Sans JP"},k={hentaigana:{type:"local",style:H.hentaigana,family:b.hentaigana},siddham:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Siddham&display=swap",family:b.siddham},itaiji:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",family:b.itaiji}};class I{loadedFonts=new Set;loadingPromises=new Map;styleElement=null;constructor(){this.styleElement=document.createElement("style"),document.head.appendChild(this.styleElement)}async loadFonts(t){const n=Object.entries(t).filter(([i,e])=>e).map(([i])=>i);try{await Promise.all(n.map(i=>this.loadFont(i)))}catch(i){if(i instanceof C)throw i;const e=new Error("Failed to load fonts");throw i instanceof Error&&(e.cause=i),e}}async loadFont(t){if(this.loadedFonts.has(t))return;const n=this.loadingPromises.get(t);if(n)return n;const i=k[t];let e;if(i.type==="local")e=new Promise(a=>{this.styleElement&&(this.styleElement.textContent=(this.styleElement.textContent??"")+i.style),a()});else{const a=document.createElement("link");a.rel="stylesheet",a.href=i.url,e=new Promise((s,r)=>{a.addEventListener("load",()=>{s()}),a.addEventListener("error",()=>{r(new C(t,i.url))}),document.head.appendChild(a)})}this.loadingPromises.set(t,e);try{await e,this.loadedFonts.add(t),this.loadingPromises.delete(t)}catch(a){throw this.loadingPromises.delete(t),a}}getFontFamilyString(t){const n=Object.entries(t).filter(([i,e])=>e).map(([i])=>k[i].family);return n.length>0?n.concat(["serif"]).join(", "):"serif"}isFontLoaded(t){return this.loadedFonts.has(t)}}const j="modulepreload",K=function(c,t){return new URL(c,t).href},A={},O=function(t,n,i){let e=Promise.resolve();if(n&&n.length>0){let h=function(l){return Promise.all(l.map(d=>Promise.resolve(d).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const s=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),o=r?.nonce||r?.getAttribute("nonce");e=h(n.map(l=>{if(l=K(l,i),l in A)return;A[l]=!0;const d=l.endsWith(".css"),g=d?'[rel="stylesheet"]':"";if(i)for(let m=s.length-1;m>=0;m--){const y=s[m];if(y.href===l&&(!d||y.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${l}"]${g}`))return;const f=document.createElement("link");if(f.rel=d?"stylesheet":j,d||(f.as="script"),f.crossOrigin="",f.href=l,o&&f.setAttribute("nonce",o),document.head.appendChild(f),d)return new Promise((m,y)=>{f.addEventListener("load",m),f.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${l}`)))})}))}function a(s){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=s,window.dispatchEvent(r),!r.defaultPrevented)throw s}return e.then(s=>{for(const r of s||[])r.status==="rejected"&&a(r.reason);return t().catch(a)})};class T extends Error{constructor(t){super(t),this.name="IMEError"}}class B{dictionary=[];options;constructor(t={enabledTypes:{}}){this.options=t}setDictionary(t){this.dictionary=t}updateOptions(t){this.options=t}search(t){if(!t)return[];if(!/^[ぁ-んー]*$/.test(t))throw new T("Reading must be hiragana");const n=this.dictionary.filter(e=>!this.options.enabledTypes[e.type]||e.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:e.reading.startsWith(t)).map(e=>({char:e.char,reading:e.reading,type:e.type})),i=new Map;return n.forEach(e=>{const a=e.char,s=i.get(a);(!s||s.reading.length>e.reading.length)&&i.set(a,{...e,fullReading:s?.fullReading||e.reading})}),Array.from(i.values())}searchExact(t){if(!t)return[];if(!/^[ぁ-んー]*$/.test(t))throw new T("Reading must be hiragana");const n=this.dictionary.filter(e=>!this.options.enabledTypes[e.type]||e.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:e.reading===t).map(e=>({char:e.char,reading:e.reading,type:e.type})),i=new Map;return n.forEach(e=>{const a=e.char,s=i.get(a);(!s||s.reading.length>e.reading.length)&&i.set(a,{...e,fullReading:s?.fullReading||e.reading})}),Array.from(i.values())}}const X="[nagarjuna] DEPRECATED: IMEManager and <ime-ui> are deprecated since 1.1.0 and will be removed in 3.0.0. Use NagaIME instead.";let N=!1;function q(){N||(N=!0,console.warn(X))}class Y extends HTMLElement{props={target:document.createElement("input"),options:{enabledTypes:{}}};state={input:"",candidates:[],cursorPosition:null};ime;fontLoader;container;input;candidateList;constructor(){super(),this.attachShadow({mode:"open"}),this.ime=new B({enabledTypes:{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}}),O(async()=>{const{dictionary:t}=await import("./dictionary.7xenPiF3.js");return{dictionary:t}},[],import.meta.url).then(({dictionary:t})=>{console.log("Loaded dictionary:",t),this.ime.setDictionary(t)}).catch(t=>{console.error("Failed to load dictionary:",t)}),this.fontLoader=new I,this.fontLoader.loadFonts({hentaigana:!0,siddham:!0,itaiji:!0}).catch(t=>{console.error("Failed to load fonts:",t)})}connectedCallback(){q(),this.render(),this.setupStyles(),this.setupEventListeners()}render(){const t=`
      <div class="ime-container">
        <div class="ime-input-area">
          <input type="text" class="ime-input" placeholder="ひらがなで入力">
          <button type="button" class="ime-close">×</button>
        </div>
        <div class="ime-candidates"></div>
     </div>
    `;this.shadowRoot&&(this.shadowRoot.innerHTML=t,this.setupElements())}setupStyles(){const t=document.createElement("style"),n=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});t.textContent=`
      .ime-container {
        position: absolute;
        z-index: 1000;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        width: 300px;
        max-width: 90vw;
      }
  
      .ime-input-area {
        display: flex;
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
  
      .ime-input {
        flex: 1;
        border: 1px solid #ccc;
        padding: 4px;
        font-size: 16px;
      }
  
      .ime-close {
        border: none;
        background: none;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 16px;
      }
  
      .ime-candidates {
        max-height: 200px;
        overflow-y: auto;
        padding: 8px;
        font-family: ${n};
      }
  
      .ime-candidate {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: ${n};
      }
  
      .ime-candidate:hover {
        background: #f5f5f5;
      }
  
      .ime-candidate-char {
        font-family: ${n};
        margin-right: 8px;
      }
  
      .ime-candidate-reading {
        color: #666;
        font-size: 0.9em;
      }
    `,this.shadowRoot?.appendChild(t)}setupElements(){this.shadowRoot&&(this.container=this.shadowRoot.querySelector(".ime-container"),this.input=this.shadowRoot.querySelector(".ime-input"),this.candidateList=this.shadowRoot.querySelector(".ime-candidates"))}setupEventListeners(){this.input?.addEventListener("input",this.handleInput.bind(this)),this.props.target?.addEventListener("select",this.updatePosition.bind(this)),this.props.target?.addEventListener("click",this.updatePosition.bind(this)),this.shadowRoot?.querySelector(".ime-close")?.addEventListener("click",this.handleClose.bind(this))}handleInput(t){const n=t.target,i=n.value,e=i.replace(/[^ぁ-んー]/g,"");e!==this.state.input&&(this.state.input=e,i!==e&&(n.value=e),this.updateCandidates())}async updateCandidates(){try{const t=this.ime.search(this.state.input);this.state.candidates=t,this.renderCandidates()}catch(t){console.warn("Search failed:",t)}}renderCandidates(){this.candidateList&&(this.candidateList.innerHTML=this.state.candidates.map(t=>`
        <div class="ime-candidate" data-char="${t.char}">
          <span class="ime-candidate-char">${t.char}</span>
          <span class="ime-candidate-reading">(${t.reading})</span>
        </div>
      `).join(""),this.candidateList.querySelectorAll(".ime-candidate").forEach(t=>{t.addEventListener("click",n=>{const e=n.currentTarget.dataset.char;e&&this.handleCandidateSelect(e)})}))}handleCandidateSelect(t){if(this.props.target){const n=this.props.target,i=n.selectionStart||0,e=n.selectionEnd||0,a=n.value,s=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});n.style.fontFamily=s,n.value=a.slice(0,i)+t+a.slice(e),n.selectionStart=n.selectionEnd=i+t.length,this.input.value="",this.state.input="",this.state.candidates=[],this.renderCandidates(),this.props.onChange?.(n.value)}}handleClose(){this.props.onClose?.()}updatePosition(){if(!this.props.target||!this.container)return;const t=this.props.target,n=t.getBoundingClientRect(),i=window.scrollX,e=window.scrollY,a=window.getComputedStyle(t),s=parseInt(a.lineHeight||"0")||parseInt(a.fontSize||"16")*1.2,r=s*2;this.container.style.position="absolute",this.container.style.top=`${n.top+e+r}px`,this.container.style.left=`${n.left+i}px`;const o=this.container.getBoundingClientRect();o.right>window.innerWidth&&(this.container.style.left=`${window.innerWidth-o.width-10+i}px`),o.bottom>window.innerHeight&&(this.container.style.top=`${n.top+e-o.height-s*2}px`)}updateOptions(t){this.props&&(this.props.options=t,this.ime.updateOptions(t))}}window.customElements.get("ime-ui")||window.customElements.define("ime-ui",Y);const x=[{id:"hentaigana",label:"変体仮名",short:"変"},{id:"siddham",label:"悉曇",short:"悉"},{id:"buddha",label:"仏名",short:"仏"},{id:"itaiji",label:"異体字",short:"異"},{id:"kumimoji",label:"組文字",short:"組"}];let w=null;function W(){return w||(w=O(async()=>{const{dictionary:c}=await import("./dictionary.7xenPiF3.js");return{dictionary:c}},[],import.meta.url).then(({dictionary:c})=>{const t=new Map;for(const n of x)t.set(n.id,[]);for(const n of c){const i=t.get(n.category);i&&i.push({char:n.char,reading:n.reading,description:n.description,category:n.category})}return t}),w.catch(()=>{w=null})),w}const G=/^[ぁ-んー]+$/;function J(c,t,n,i){if(!t)return c.slice(0,i);let e;if(G.test(t)){const a=[],s=[];for(const r of c)r.reading===t?a.push(r):r.reading.startsWith(t)&&s.push(r);e=[...a,...s]}else e=c.filter(a=>a.description.includes(t)||a.char===t);return e.map(a=>({e:a,recent:n.has(a.char)?0:1})).sort((a,s)=>a.recent-s.recent||a.e.reading.length-s.e.reading.length).map(a=>a.e).slice(0,i)}const U=`
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
`,P="data-naga-style";function V(c=document){if(c.head.querySelector(`style[${P}]`))return;const t=c.createElement("style");t.setAttribute(P,""),t.textContent=U,c.head.appendChild(t)}const Z="nagarjuna-naga-recents",R="よみを入力（例: あ / とき）",Q="読み",tt="読みを入力",et="最近",nt="近",_={hentaigana:!0,siddham:!0,itaiji:!0},$=new Set(x.map(c=>c.id)),it=48,at=40,st=40,ot=44,rt=3,ct=2,lt=10,F=8,dt=at+st+ot*rt+ct+lt,ht=96;function E(c){return c==="recent"?et:x.find(t=>t.id===c)?.label??c}function pt(c){return c==="recent"?nt:x.find(t=>t.id===c)?.short??E(c).charAt(0)}let ut=0;function v(c){return typeof HTMLInputElement<"u"&&(c instanceof HTMLInputElement||c instanceof HTMLTextAreaElement)}function gt(c){if(!c||typeof c!="object")return!1;const t=c;return typeof t.char=="string"&&typeof t.reading=="string"&&typeof t.description=="string"&&typeof t.category=="string"&&$.has(t.category)}class ft{options;uid;fontLoader;fields=new Map;dictionary=null;recents;target=null;activeTab;candidates=[];selectedIndex=0;composing=!1;openState=!1;openSeq=0;docked=!1;trigger=null;popup=null;tabsEl=null;searchEl=null;listEl=null;globalCleanup=null;constructor(t={}){const n=(t.categories??x.map(i=>i.id)).filter(i=>$.has(i));this.options={categories:n.length?n:x.map(i=>i.id),triggerLabel:t.triggerLabel??"梵",shortcut:t.shortcut??!0,recentStorageKey:t.recentStorageKey===void 0?Z:t.recentStorageKey,recentMax:Math.max(0,t.recentMax??14),maxCandidates:Math.max(1,t.maxCandidates??60),dockBreakpoint:t.dockBreakpoint??560,loadFonts:t.loadFonts??!0},this.uid=`naga-${++ut}`,this.fontLoader=this.options.loadFonts?new I:null,this.recents=this.loadRecents(),this.activeTab=this.options.categories[0]}get isOpen(){return this.openState}attach(t){const i=(typeof t=="string"?Array.from(document.querySelectorAll(t)):t instanceof Element?[t]:Array.from(t)).filter(v).filter(e=>!this.fields.has(e));i.length!==0&&(this.ensureDom(),this.fontLoader&&this.fontLoader.loadFonts(_).catch(()=>{}),i.forEach(e=>this.bindField(e)))}detach(t){const n=t===void 0?Array.from(this.fields.keys()):typeof t=="string"?Array.from(document.querySelectorAll(t)):t instanceof Element?[t]:Array.from(t);for(const i of n){if(!v(i))continue;const e=this.fields.get(i);e&&(e.cleanup(),e.addedClass&&i.classList.remove("naga-enabled"),e.appliedFontFamily!==null&&i.style.fontFamily===e.appliedFontFamily&&(i.style.fontFamily=""),this.fields.delete(i),this.target===i&&(this.close(),this.target=null,this.trigger&&(this.trigger.hidden=!0)))}this.fields.size===0&&this.teardownDom()}destroy(){this.detach(),this.teardownDom()}async toggle(t){if(this.openState&&this.target===t){this.close({refocus:!0});return}await this.open(t)}async open(t){if(!this.fields.has(t))return;this.target=t;const n=++this.openSeq;if(!this.dictionary){this.searchEl&&(this.searchEl.placeholder="辞書を読み込み中…");const i=await W();this.dictionary=i,this.searchEl&&(this.searchEl.placeholder=R)}n!==this.openSeq||!this.popup||!this.searchEl||!this.fields.has(t)||(this.openState=!0,this.popup.hidden=!1,this.trigger?.setAttribute("aria-expanded","true"),this.searchEl.value="",this.selectedIndex=0,this.recents.length?this.activeTab="recent":this.activeTab==="recent"&&(this.activeTab=this.options.categories[0]),this.renderTabs(),this.refresh(),this.positionPopup(),this.searchEl.focus())}close({refocus:t=!1}={}){this.openSeq++,this.openState=!1,this.composing=!1,this.popup&&(this.popup.hidden=!0),this.trigger?.setAttribute("aria-expanded","false"),t&&this.target&&this.target.focus()}ensureDom(){if(this.popup)return;V(document);const t=`${this.uid}-popup`,n=`${this.uid}-list`,i=document.createElement("button");i.type="button",i.className="naga-trigger",i.id=`${this.uid}-trigger`,i.textContent=this.options.triggerLabel,i.title="特殊文字を入力 (Ctrl+J / ⌘J)",i.setAttribute("aria-label","特殊文字を入力"),i.setAttribute("aria-haspopup","dialog"),i.setAttribute("aria-controls",t),i.setAttribute("aria-expanded","false"),i.hidden=!0,i.addEventListener("mousedown",p=>{p.preventDefault(),this.target&&this.toggle(this.target)}),i.addEventListener("click",p=>{p.detail===0&&this.target&&this.toggle(this.target)});const e=document.createElement("div");e.className="naga-popup",e.id=t,e.setAttribute("role","dialog"),e.setAttribute("aria-label","特殊文字入力"),e.hidden=!0;const a=document.createElement("div");a.className="naga-titlebar";const s=document.createElement("div");s.className="naga-tabs",s.setAttribute("role","tablist");const r=document.createElement("button");r.type="button",r.className="naga-close",r.title="閉じる (Esc)",r.setAttribute("aria-label","閉じる"),r.textContent="×",r.addEventListener("mousedown",p=>p.preventDefault()),r.addEventListener("click",()=>this.close({refocus:!0})),a.append(s,r);const o=document.createElement("input");o.type="text",o.className="naga-search",o.placeholder=R,o.autocomplete="off",o.setAttribute("autocapitalize","off"),o.spellcheck=!1,o.setAttribute("role","combobox"),o.setAttribute("aria-expanded","true"),o.setAttribute("aria-controls",n),o.setAttribute("aria-label",tt);const h=document.createElement("div");h.className="naga-search-row";const l=document.createElement("span");l.className="naga-search-label",l.textContent=Q,l.setAttribute("aria-hidden","true"),h.append(l,o);const d=document.createElement("div");d.className="naga-list",d.id=n,d.setAttribute("role","listbox");const g=document.createElement("div");g.className="naga-hint",g.textContent="↑↓:選択 Enter:確定（連続入力可） 1-9:直接選択 Esc:閉じる",e.append(a,h,d,g);const f=["recent",...this.options.categories];for(const p of f){const u=document.createElement("button");u.type="button",u.className="naga-tab",u.id=`${this.uid}-tab-${p}`,u.dataset.category=p,u.textContent=E(p),u.title=E(p),u.setAttribute("aria-label",E(p)),u.setAttribute("role","tab"),u.setAttribute("aria-controls",n),u.addEventListener("mousedown",D=>D.preventDefault()),u.addEventListener("click",()=>{this.activeTab=p,this.renderTabs(),this.refresh(),this.searchEl?.focus()}),s.appendChild(u)}o.addEventListener("compositionstart",()=>{this.composing=!0}),o.addEventListener("compositionend",()=>{this.composing=!1,this.refresh()}),o.addEventListener("input",()=>{this.composing||this.refresh()}),o.addEventListener("keydown",p=>this.onSearchKeydown(p)),d.addEventListener("mousedown",p=>p.preventDefault()),d.addEventListener("click",p=>{const u=p.target?.closest?.(".naga-item");u&&this.commit(this.candidates[Number(u.dataset.index)])}),document.body.append(i,e),this.trigger=i,this.popup=e,this.tabsEl=s,this.searchEl=o,this.listEl=d;const m=p=>{if(!this.openState||!this.popup)return;const u=p.target;u&&(this.popup.contains(u)||u===this.trigger||u===this.target)||this.close({refocus:!0})},y=()=>{this.openState&&this.positionPopup(),this.target&&this.trigger&&!this.trigger.hidden&&this.positionTrigger(this.target)},L=()=>{this.openState&&this.popup&&!this.popup.classList.contains("naga-is-docked")&&this.positionPopup()},S=window.visualViewport;document.addEventListener("mousedown",m),window.addEventListener("resize",y),window.addEventListener("scroll",L,!0),S?.addEventListener("resize",y),this.globalCleanup=()=>{document.removeEventListener("mousedown",m),window.removeEventListener("resize",y),window.removeEventListener("scroll",L,!0),S?.removeEventListener("resize",y)}}teardownDom(){this.close(),this.globalCleanup?.(),this.globalCleanup=null,this.trigger?.remove(),this.popup?.remove(),this.trigger=null,this.popup=null,this.tabsEl=null,this.searchEl=null,this.listEl=null,this.target=null,this.docked=!1}bindField(t){let n=null;if(!t.style.fontFamily){const o=this.fontLoader?this.fontLoader.getFontFamilyString(_):[b.hentaigana,b.siddham,b.itaiji,"serif"].join(", ");let h="";try{h=getComputedStyle(t).fontFamily}catch{h=""}t.style.fontFamily=h?`${h}, ${o}`:o,n=t.style.fontFamily}const i=!t.classList.contains("naga-enabled");t.classList.add("naga-enabled");const e=()=>this.showTrigger(t),a=()=>{if(this.openState)return;const o=document.activeElement;o!==this.trigger&&!(v(o)&&this.fields.has(o))&&this.trigger&&(this.trigger.hidden=!0)},s=o=>{if(this.options.shortcut&&(o.ctrlKey||o.metaKey)&&!o.altKey&&o.key.toLowerCase()==="j"){o.preventDefault(),this.toggle(t);return}o.key==="Escape"&&this.openState&&this.target===t&&this.close()},r=t;r.addEventListener("focus",e),r.addEventListener("blur",a),r.addEventListener("keydown",s),this.fields.set(t,{appliedFontFamily:n,addedClass:i,cleanup:()=>{r.removeEventListener("focus",e),r.removeEventListener("blur",a),r.removeEventListener("keydown",s)}}),document.activeElement===t&&this.showTrigger(t)}showTrigger(t){this.target=t,this.trigger&&(this.positionTrigger(t),this.trigger.hidden=!1)}positionTrigger(t){if(!this.trigger)return;const n=t.getBoundingClientRect(),i=26;this.trigger.style.top=`${window.scrollY+n.top-i-4}px`,this.trigger.style.left=`${window.scrollX+n.right-i}px`}currentEntries(){return this.activeTab==="recent"?this.recents:this.dictionary?.get(this.activeTab)??[]}refresh(){if(!this.searchEl)return;const t=this.searchEl.value.trim(),n=new Set(this.recents.map(i=>i.char));this.candidates=J(this.currentEntries(),t,n,this.options.maxCandidates),this.selectedIndex=0,this.renderList()}renderTabs(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const n=t.dataset.category===this.activeTab;t.classList.toggle("naga-is-active",n),t.setAttribute("aria-selected",String(n))}),this.applyTabLabels()}applyTabLabels(){this.tabsEl?.querySelectorAll(".naga-tab").forEach(t=>{const n=t.dataset.category;if(!n)return;const i=this.docked&&n!==this.activeTab;t.textContent=i?pt(n):E(n)})}setDocked(t){this.docked!==t&&(this.docked=t,this.applyTabLabels())}renderList(){const t=this.listEl;if(t){if(t.replaceChildren(),!this.candidates.length){const n=document.createElement("div");n.className="naga-empty",n.textContent="候補なし",t.appendChild(n),this.searchEl?.removeAttribute("aria-activedescendant");return}this.candidates.forEach((n,i)=>{const e=i===this.selectedIndex,a=document.createElement("div");a.className=e?"naga-item naga-is-selected":"naga-item",a.id=`${this.uid}-option-${i}`,a.setAttribute("role","option"),a.setAttribute("aria-selected",String(e)),a.dataset.index=String(i),a.dataset.char=n.char;const s=document.createElement("span");s.className="naga-num",s.textContent=i<9?String(i+1):"";const r=document.createElement("span");r.className="naga-char",r.textContent=n.char;const o=document.createElement("span");o.className="naga-meta";const h=document.createElement("span");h.className="naga-reading",h.textContent=n.reading;const l=document.createElement("span");l.className="naga-desc",l.textContent=n.description,o.append(h,l),a.append(s,r,o),t.appendChild(a),e&&(this.searchEl?.setAttribute("aria-activedescendant",a.id),typeof a.scrollIntoView=="function"&&a.scrollIntoView({block:"nearest"}))})}}onSearchKeydown(t){const n=this.candidates.length,i=this.composing||t.isComposing||t.keyCode===229;if(t.key==="ArrowDown"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex+1)%Math.max(n,1),this.renderList()}else if(t.key==="ArrowUp"){if(i)return;t.preventDefault(),this.selectedIndex=(this.selectedIndex-1+Math.max(n,1))%Math.max(n,1),this.renderList()}else if(t.key==="Enter"||t.key==="Tab"){if(i)return;t.preventDefault();const e=this.candidates[this.selectedIndex];e&&this.commit(e)}else if(t.key==="Escape"){if(i)return;t.preventDefault(),this.close({refocus:!0})}else if(/^[1-9]$/.test(t.key)&&!i){const e=this.candidates[Number(t.key)-1];e&&(t.preventDefault(),this.commit(e))}}commit(t){const n=this.target;if(!(!n||!t)){if(this.pushRecent(t),typeof n.setRangeText=="function"){const i=n.selectionStart??n.value.length,e=n.selectionEnd??n.value.length;n.setRangeText(t.char,i,e,"end")}else n.value+=t.char;n.dispatchEvent(new Event("input",{bubbles:!0})),this.searchEl&&(this.searchEl.value=""),this.selectedIndex=0,this.refresh(),this.positionPopup(),this.searchEl?.focus()}}positionPopup(){const t=this.target,n=this.popup;if(!t||!n)return;const i=t.getBoundingClientRect(),e=window.visualViewport,a=e?e.width:window.innerWidth,s=n.style;if(a<this.options.dockBreakpoint){n.classList.add("naga-is-docked"),this.setDocked(!0),s.position="fixed",s.left="8px",s.right="8px",s.width="auto",s.top="auto";const f=e?Math.max(0,window.innerHeight-(e.height+e.offsetTop))+F:F;s.bottom=`${f}px`;const m=e?e.height:window.innerHeight,y=Math.max(ht,Math.min(dt,m-it));s.maxHeight=`${y}px`,s.setProperty("--naga-dock-max",`${y}px`),s.setProperty("--naga-dock-avail",`${m}px`);return}n.classList.remove("naga-is-docked"),this.setDocked(!1),s.maxHeight&&(s.maxHeight=""),s.removeProperty("--naga-dock-max"),s.removeProperty("--naga-dock-avail"),s.position="absolute",s.width=`${Math.min(360,a-16)}px`;let r=null;try{r=this.measureCaret(t)}catch{r=null}const o=n.offsetHeight||320,h=n.offsetWidth||360,l=e?e.height+e.offsetTop:window.innerHeight;let d,g;r?(d=r.y+r.lineHeight+2,g=r.x):(d=window.scrollY+i.bottom+4,g=window.scrollX+i.left),d-window.scrollY+o>l&&(d=r?r.y-o-2:window.scrollY+i.top-o-4),g-window.scrollX+h>a&&(g=window.scrollX+a-h-8),g<window.scrollX+4&&(g=window.scrollX+4),s.top=`${d}px`,s.left=`${g}px`,s.bottom="auto",s.right="auto"}measureCaret(t){const n=t.getBoundingClientRect(),i=getComputedStyle(t),e=["box-sizing","padding-top","padding-right","padding-bottom","padding-left","border-top-width","border-right-width","border-bottom-width","border-left-width","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-indent","word-wrap","overflow-wrap","tab-size","text-transform"],a=document.createElement("div"),s=a.style;for(const m of e)s.setProperty(m,i.getPropertyValue(m));s.position="absolute",s.top="-9999px",s.left="-9999px",s.visibility="hidden",s.whiteSpace=t instanceof HTMLTextAreaElement?"pre-wrap":"pre",s.width=`${n.width}px`;const r=t.selectionStart??t.value.length;a.textContent=t.value.slice(0,r);const o=document.createElement("span");o.textContent="​",a.appendChild(o),document.body.appendChild(a);const h=o.getBoundingClientRect(),l=a.getBoundingClientRect();a.remove();const d=parseFloat(i.lineHeight)||(parseFloat(i.fontSize)||16)*1.2,g=h.left-l.left-(t.scrollLeft||0),f=h.top-l.top-(t.scrollTop||0);return{x:window.scrollX+n.left+g,y:window.scrollY+n.top+f,lineHeight:d}}loadRecents(){const t=this.options.recentStorageKey;if(!t)return[];try{const n=JSON.parse(localStorage.getItem(t)||"[]");return Array.isArray(n)?n.filter(gt).slice(0,this.options.recentMax):[]}catch{return[]}}pushRecent(t){const n={char:t.char,reading:t.reading,description:t.description,category:t.category};this.recents=[n,...this.recents.filter(e=>e.char!==n.char)].slice(0,this.options.recentMax);const i=this.options.recentStorageKey;if(i)try{localStorage.setItem(i,JSON.stringify(this.recents))}catch{}}}export{I as F,ft as N,q as w};
