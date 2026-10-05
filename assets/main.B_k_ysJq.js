import{_ as u,F as p}from"./preload-helper.DXID1e7E.js";class l extends Error{constructor(t){super(t),this.name="IMEError"}}class m{dictionary=[];options;constructor(t={enabledTypes:{}}){this.options=t}setDictionary(t){this.dictionary=t}updateOptions(t){this.options=t}search(t){if(!t)return[];if(!/^[ぁ-んー]*$/.test(t))throw new l("Reading must be hiragana");const i=this.dictionary.filter(e=>!this.options.enabledTypes[e.type]||e.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:e.reading.startsWith(t)).map(e=>({char:e.char,reading:e.reading,type:e.type})),a=new Map;return i.forEach(e=>{const n=e.char,s=a.get(n);(!s||s.reading.length>e.reading.length)&&a.set(n,{...e,fullReading:s?.fullReading||e.reading})}),Array.from(a.values())}searchExact(t){if(!t)return[];if(!/^[ぁ-んー]*$/.test(t))throw new l("Reading must be hiragana");const i=this.dictionary.filter(e=>!this.options.enabledTypes[e.type]||e.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:e.reading===t).map(e=>({char:e.char,reading:e.reading,type:e.type})),a=new Map;return i.forEach(e=>{const n=e.char,s=a.get(n);(!s||s.reading.length>e.reading.length)&&a.set(n,{...e,fullReading:s?.fullReading||e.reading})}),Array.from(a.values())}}class f extends HTMLElement{props={target:document.createElement("input"),options:{enabledTypes:{}}};state={input:"",candidates:[],cursorPosition:null};ime;fontLoader;container;input;candidateList;constructor(){super(),this.attachShadow({mode:"open"}),this.ime=new m({enabledTypes:{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}}),u(async()=>{const{dictionary:t}=await import("./dictionary.7xenPiF3.js");return{dictionary:t}},[],import.meta.url).then(({dictionary:t})=>{console.log("Loaded dictionary:",t),this.ime.setDictionary(t)}).catch(t=>{console.error("Failed to load dictionary:",t)}),this.fontLoader=new p,this.fontLoader.loadFonts({hentaigana:!0,siddham:!0,itaiji:!0}).catch(t=>{console.error("Failed to load fonts:",t)})}connectedCallback(){this.render(),this.setupStyles(),this.setupEventListeners()}render(){const t=`
      <div class="ime-container">
        <div class="ime-input-area">
          <input type="text" class="ime-input" placeholder="ひらがなで入力">
          <button type="button" class="ime-close">×</button>
        </div>
        <div class="ime-candidates"></div>
     </div>
    `;this.shadowRoot&&(this.shadowRoot.innerHTML=t,this.setupElements())}setupStyles(){const t=document.createElement("style"),i=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});t.textContent=`
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
        font-family: ${i};
      }
  
      .ime-candidate {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: ${i};
      }
  
      .ime-candidate:hover {
        background: #f5f5f5;
      }
  
      .ime-candidate-char {
        font-family: ${i};
        margin-right: 8px;
      }
  
      .ime-candidate-reading {
        color: #666;
        font-size: 0.9em;
      }
    `,this.shadowRoot?.appendChild(t)}setupElements(){this.shadowRoot&&(this.container=this.shadowRoot.querySelector(".ime-container"),this.input=this.shadowRoot.querySelector(".ime-input"),this.candidateList=this.shadowRoot.querySelector(".ime-candidates"))}setupEventListeners(){this.input?.addEventListener("input",this.handleInput.bind(this)),this.props.target?.addEventListener("select",this.updatePosition.bind(this)),this.props.target?.addEventListener("click",this.updatePosition.bind(this)),this.shadowRoot?.querySelector(".ime-close")?.addEventListener("click",this.handleClose.bind(this))}handleInput(t){const i=t.target,a=i.value,e=a.replace(/[^ぁ-んー]/g,"");e!==this.state.input&&(this.state.input=e,a!==e&&(i.value=e),this.updateCandidates())}async updateCandidates(){try{const t=this.ime.search(this.state.input);this.state.candidates=t,this.renderCandidates()}catch(t){console.warn("Search failed:",t)}}renderCandidates(){this.candidateList&&(this.candidateList.innerHTML=this.state.candidates.map(t=>`
        <div class="ime-candidate" data-char="${t.char}">
          <span class="ime-candidate-char">${t.char}</span>
          <span class="ime-candidate-reading">(${t.reading})</span>
        </div>
      `).join(""),this.candidateList.querySelectorAll(".ime-candidate").forEach(t=>{t.addEventListener("click",i=>{const e=i.currentTarget.dataset.char;e&&this.handleCandidateSelect(e)})}))}handleCandidateSelect(t){if(this.props.target){const i=this.props.target,a=i.selectionStart||0,e=i.selectionEnd||0,n=i.value,s=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});i.style.fontFamily=s,i.value=n.slice(0,a)+t+n.slice(e),i.selectionStart=i.selectionEnd=a+t.length,this.input.value="",this.state.input="",this.state.candidates=[],this.renderCandidates(),this.props.onChange?.(i.value)}}handleClose(){this.props.onClose?.()}updatePosition(){if(!this.props.target||!this.container)return;const t=this.props.target,i=t.getBoundingClientRect(),a=window.scrollX,e=window.scrollY,n=window.getComputedStyle(t),s=parseInt(n.lineHeight||"0")||parseInt(n.fontSize||"16")*1.2,c=s*2;this.container.style.position="absolute",this.container.style.top=`${i.top+e+c}px`,this.container.style.left=`${i.left+a}px`;const r=this.container.getBoundingClientRect();r.right>window.innerWidth&&(this.container.style.left=`${window.innerWidth-r.width-10+a}px`),r.bottom>window.innerHeight&&(this.container.style.top=`${i.top+e-r.height-s*2}px`)}updateOptions(t){this.props&&(this.props.options=t,this.ime.updateOptions(t))}}window.customElements.get("ime-ui")||window.customElements.define("ime-ui",f);class o{static instance;activeElement=null;eventCleanup;constructor(){}static getInstance(){return o.instance||(o.instance=new o),o.instance}static resetInstance(){o.instance&&o.instance.detach(),o.instance=new o}attach(t,i={}){this.detach();const e=new p().getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});t.style.fontFamily=e;const n=document.createElement("ime-ui");Object.assign(n,{props:{target:t,options:{enabledTypes:i.options?.enabledTypes||{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}},position:i.position||"bottom",onClose:()=>this.detach(),onChange:i.onChange}}),document.body.appendChild(n),this.activeElement=n,n.updatePosition();const s=c=>{const h=c.relatedTarget;(!h||!n.contains(h))&&this.detach()};t.addEventListener("blur",s),t.addEventListener("click",()=>n.updatePosition()),t.addEventListener("select",()=>n.updatePosition()),t.addEventListener("keyup",()=>n.updatePosition()),window.addEventListener("resize",()=>n.updatePosition()),this.eventCleanup=()=>{t.removeEventListener("blur",s),t.removeEventListener("click",()=>n.updatePosition()),t.removeEventListener("select",()=>n.updatePosition()),t.removeEventListener("keyup",()=>n.updatePosition()),window.removeEventListener("resize",()=>n.updatePosition())}}detach(){this.eventCleanup&&(this.eventCleanup(),this.eventCleanup=void 0),this.activeElement&&(this.activeElement.remove(),this.activeElement=null)}updateOptions(t){this.activeElement&&this.activeElement.updateOptions({enabledTypes:{hentaigana:!1,siddham:!1,itaiji:!1,buddha_name:!1,...t.enabledTypes}})}}document.getElementById("version").textContent="1.1.0";document.addEventListener("DOMContentLoaded",()=>{o.resetInstance();const d=o.getInstance();["hentaigana","siddham","itaiji","buddha_name"].forEach(t=>{document.getElementById(t)?.addEventListener("change",()=>{const i={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};d.updateOptions(i)})}),document.querySelectorAll(".ime-enabled").forEach(t=>{(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement)&&t.addEventListener("focus",()=>{const i={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};d.attach(t,{options:i})})})});
