(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function n(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(t){if(t.ep)return;t.ep=!0;const i=n(t);fetch(t.href,i)}})();class E extends Error{constructor(e,n,a){super(a??`Failed to load font for ${e}${n?` from ${n}`:""}`),this.system=e,this.url=n,this.name="FontLoadError"}system;url}const x=""+new URL("ninjal_hentaigana.ZV3gqHt3.woff2",import.meta.url).href,C=""+new URL("ninjal_hentaigana.DM189ZoV.woff",import.meta.url).href,P={hentaigana:`
    @font-face {
      font-family: 'NINJAL Hentaigana';
      src: url('${x}') format('woff2'),
           url('${C}') format('woff');
      font-display: swap;
    }
  `},y={hentaigana:"NINJAL Hentaigana",siddham:"Noto Sans Siddham",itaiji:"Noto Sans JP"},v={hentaigana:{type:"local",style:P.hentaigana,family:y.hentaigana},siddham:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Siddham&display=swap",family:y.siddham},itaiji:{type:"remote",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",family:y.itaiji}};class L{loadedFonts=new Set;loadingPromises=new Map;styleElement=null;constructor(){this.styleElement=document.createElement("style"),document.head.appendChild(this.styleElement)}async loadFonts(e){const n=Object.entries(e).filter(([a,t])=>t).map(([a])=>a);try{await Promise.all(n.map(a=>this.loadFont(a)))}catch(a){if(a instanceof E)throw a;const t=new Error("Failed to load fonts");throw a instanceof Error&&(t.cause=a),t}}async loadFont(e){if(this.loadedFonts.has(e))return;const n=this.loadingPromises.get(e);if(n)return n;const a=v[e];let t;if(a.type==="local")t=new Promise(i=>{this.styleElement&&(this.styleElement.textContent=(this.styleElement.textContent??"")+a.style),i()});else{const i=document.createElement("link");i.rel="stylesheet",i.href=a.url,t=new Promise((s,o)=>{i.addEventListener("load",()=>{s()}),i.addEventListener("error",()=>{o(new E(e,a.url))}),document.head.appendChild(i)})}this.loadingPromises.set(e,t);try{await t,this.loadedFonts.add(e),this.loadingPromises.delete(e)}catch(i){throw this.loadingPromises.delete(e),i}}getFontFamilyString(e){const n=Object.entries(e).filter(([a,t])=>t).map(([a])=>v[a].family);return n.length>0?n.concat(["serif"]).join(", "):"serif"}isFontLoaded(e){return this.loadedFonts.has(e)}}const S="modulepreload",F=function(r,e){return new URL(r,e).href},w={},T=function(e,n,a){let t=Promise.resolve();if(n&&n.length>0){let f=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};const s=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),l=o?.nonce||o?.getAttribute("nonce");t=f(n.map(d=>{if(d=F(d,a),d in w)return;w[d]=!0;const u=d.endsWith(".css"),p=u?'[rel="stylesheet"]':"";if(a)for(let m=s.length-1;m>=0;m--){const g=s[m];if(g.href===d&&(!u||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${p}`))return;const h=document.createElement("link");if(h.rel=u?"stylesheet":S,u||(h.as="script"),h.crossOrigin="",h.href=d,l&&h.setAttribute("nonce",l),document.head.appendChild(h),u)return new Promise((m,g)=>{h.addEventListener("load",m),h.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(s){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s}return t.then(s=>{for(const o of s||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})};class b extends Error{constructor(e){super(e),this.name="IMEError"}}class j{dictionary=[];options;constructor(e={enabledTypes:{}}){this.options=e}setDictionary(e){this.dictionary=e}updateOptions(e){this.options=e}search(e){if(!e)return[];if(!/^[ぁ-んー]*$/.test(e))throw new b("Reading must be hiragana");const n=this.dictionary.filter(t=>!this.options.enabledTypes[t.type]||t.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:t.reading.startsWith(e)).map(t=>({char:t.char,reading:t.reading,type:t.type})),a=new Map;return n.forEach(t=>{const i=t.char,s=a.get(i);(!s||s.reading.length>t.reading.length)&&a.set(i,{...t,fullReading:s?.fullReading||t.reading})}),Array.from(a.values())}searchExact(e){if(!e)return[];if(!/^[ぁ-んー]*$/.test(e))throw new b("Reading must be hiragana");const n=this.dictionary.filter(t=>!this.options.enabledTypes[t.type]||t.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:t.reading===e).map(t=>({char:t.char,reading:t.reading,type:t.type})),a=new Map;return n.forEach(t=>{const i=t.char,s=a.get(i);(!s||s.reading.length>t.reading.length)&&a.set(i,{...t,fullReading:s?.fullReading||t.reading})}),Array.from(a.values())}}class k extends HTMLElement{props={target:document.createElement("input"),options:{enabledTypes:{}}};state={input:"",candidates:[],cursorPosition:null};ime;fontLoader;container;input;candidateList;constructor(){super(),this.attachShadow({mode:"open"}),this.ime=new j({enabledTypes:{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}}),T(async()=>{const{dictionary:e}=await import("./dictionary.Dzu1QF-1.js");return{dictionary:e}},[],import.meta.url).then(({dictionary:e})=>{console.log("Loaded dictionary:",e),this.ime.setDictionary(e)}).catch(e=>{console.error("Failed to load dictionary:",e)}),this.fontLoader=new L,this.fontLoader.loadFonts({hentaigana:!0,siddham:!0,itaiji:!0}).catch(e=>{console.error("Failed to load fonts:",e)})}connectedCallback(){this.render(),this.setupStyles(),this.setupEventListeners()}render(){const e=`
      <div class="ime-container">
        <div class="ime-input-area">
          <input type="text" class="ime-input" placeholder="ひらがなで入力">
          <button type="button" class="ime-close">×</button>
        </div>
        <div class="ime-candidates"></div>
     </div>
    `;this.shadowRoot&&(this.shadowRoot.innerHTML=e,this.setupElements())}setupStyles(){const e=document.createElement("style"),n=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});e.textContent=`
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
    `,this.shadowRoot?.appendChild(e)}setupElements(){this.shadowRoot&&(this.container=this.shadowRoot.querySelector(".ime-container"),this.input=this.shadowRoot.querySelector(".ime-input"),this.candidateList=this.shadowRoot.querySelector(".ime-candidates"))}setupEventListeners(){this.input?.addEventListener("input",this.handleInput.bind(this)),this.props.target?.addEventListener("select",this.updatePosition.bind(this)),this.props.target?.addEventListener("click",this.updatePosition.bind(this)),this.shadowRoot?.querySelector(".ime-close")?.addEventListener("click",this.handleClose.bind(this))}handleInput(e){const n=e.target,a=n.value,t=a.replace(/[^ぁ-んー]/g,"");t!==this.state.input&&(this.state.input=t,a!==t&&(n.value=t),this.updateCandidates())}async updateCandidates(){try{const e=this.ime.search(this.state.input);this.state.candidates=e,this.renderCandidates()}catch(e){console.warn("Search failed:",e)}}renderCandidates(){this.candidateList&&(this.candidateList.innerHTML=this.state.candidates.map(e=>`
        <div class="ime-candidate" data-char="${e.char}">
          <span class="ime-candidate-char">${e.char}</span>
          <span class="ime-candidate-reading">(${e.reading})</span>
        </div>
      `).join(""),this.candidateList.querySelectorAll(".ime-candidate").forEach(e=>{e.addEventListener("click",n=>{const t=n.currentTarget.dataset.char;t&&this.handleCandidateSelect(t)})}))}handleCandidateSelect(e){if(this.props.target){const n=this.props.target,a=n.selectionStart||0,t=n.selectionEnd||0,i=n.value,s=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});n.style.fontFamily=s,n.value=i.slice(0,a)+e+i.slice(t),n.selectionStart=n.selectionEnd=a+e.length,this.input.value="",this.state.input="",this.state.candidates=[],this.renderCandidates(),this.props.onChange?.(n.value)}}handleClose(){this.props.onClose?.()}updatePosition(){if(!this.props.target||!this.container)return;const e=this.props.target,n=e.getBoundingClientRect(),a=window.scrollX,t=window.scrollY,i=window.getComputedStyle(e),s=parseInt(i.lineHeight||"0")||parseInt(i.fontSize||"16")*1.2,o=s*2;this.container.style.position="absolute",this.container.style.top=`${n.top+t+o}px`,this.container.style.left=`${n.left+a}px`;const l=this.container.getBoundingClientRect();l.right>window.innerWidth&&(this.container.style.left=`${window.innerWidth-l.width-10+a}px`),l.bottom>window.innerHeight&&(this.container.style.top=`${n.top+t-l.height-s*2}px`)}updateOptions(e){this.props&&(this.props.options=e,this.ime.updateOptions(e))}}window.customElements.get("ime-ui")||window.customElements.define("ime-ui",k);class c{static instance;activeElement=null;eventCleanup;constructor(){}static getInstance(){return c.instance||(c.instance=new c),c.instance}static resetInstance(){c.instance&&c.instance.detach(),c.instance=new c}attach(e,n={}){this.detach();const t=new L().getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});e.style.fontFamily=t;const i=document.createElement("ime-ui");Object.assign(i,{props:{target:e,options:{enabledTypes:n.options?.enabledTypes||{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}},position:n.position||"bottom",onClose:()=>this.detach(),onChange:n.onChange}}),document.body.appendChild(i),this.activeElement=i,i.updatePosition();const s=o=>{const f=o.relatedTarget;(!f||!i.contains(f))&&this.detach()};e.addEventListener("blur",s),e.addEventListener("click",()=>i.updatePosition()),e.addEventListener("select",()=>i.updatePosition()),e.addEventListener("keyup",()=>i.updatePosition()),window.addEventListener("resize",()=>i.updatePosition()),this.eventCleanup=()=>{e.removeEventListener("blur",s),e.removeEventListener("click",()=>i.updatePosition()),e.removeEventListener("select",()=>i.updatePosition()),e.removeEventListener("keyup",()=>i.updatePosition()),window.removeEventListener("resize",()=>i.updatePosition())}}detach(){this.eventCleanup&&(this.eventCleanup(),this.eventCleanup=void 0),this.activeElement&&(this.activeElement.remove(),this.activeElement=null)}updateOptions(e){this.activeElement&&this.activeElement.updateOptions({enabledTypes:{hentaigana:!1,siddham:!1,itaiji:!1,buddha_name:!1,...e.enabledTypes}})}}document.getElementById("version").textContent="0.1.3";document.addEventListener("DOMContentLoaded",()=>{c.resetInstance();const r=c.getInstance();["hentaigana","siddham","itaiji","buddha_name"].forEach(e=>{document.getElementById(e)?.addEventListener("change",()=>{const n={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};r.updateOptions(n)})}),document.querySelectorAll(".ime-enabled").forEach(e=>{(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.addEventListener("focus",()=>{const n={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};r.attach(e,{options:n})})})});
