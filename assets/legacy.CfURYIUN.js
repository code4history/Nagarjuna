import{_ as f,F as u}from"./naga-ime.Cm6r6YS9.js";class l extends Error{constructor(e){super(e),this.name="IMEError"}}class g{dictionary=[];options;constructor(e={enabledTypes:{}}){this.options=e}setDictionary(e){this.dictionary=e}updateOptions(e){this.options=e}search(e){if(!e)return[];if(!/^[ぁ-んー]*$/.test(e))throw new l("Reading must be hiragana");const i=this.dictionary.filter(t=>!this.options.enabledTypes[t.type]||t.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:t.reading.startsWith(e)).map(t=>({char:t.char,reading:t.reading,type:t.type})),a=new Map;return i.forEach(t=>{const n=t.char,s=a.get(n);(!s||s.reading.length>t.reading.length)&&a.set(n,{...t,fullReading:s?.fullReading||t.reading})}),Array.from(a.values())}searchExact(e){if(!e)return[];if(!/^[ぁ-んー]*$/.test(e))throw new l("Reading must be hiragana");const i=this.dictionary.filter(t=>!this.options.enabledTypes[t.type]||t.isBuddhaName&&!this.options.enabledTypes.buddha_name?!1:t.reading===e).map(t=>({char:t.char,reading:t.reading,type:t.type})),a=new Map;return i.forEach(t=>{const n=t.char,s=a.get(n);(!s||s.reading.length>t.reading.length)&&a.set(n,{...t,fullReading:s?.fullReading||t.reading})}),Array.from(a.values())}}const y="[@c4h/nagarjuna] DEPRECATED: IMEManager and <ime-ui> are deprecated since 1.2.0 and will be removed in 3.0.0. Use NagaIME (<naga-ime>) instead.";let p=!1;function m(){p||(p=!0,console.warn(y))}class E extends HTMLElement{props={target:document.createElement("input"),options:{enabledTypes:{}}};state={input:"",candidates:[],cursorPosition:null};ime;fontLoader;container;input;candidateList;constructor(){super(),this.attachShadow({mode:"open"}),this.ime=new g({enabledTypes:{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}}),f(async()=>{const{dictionary:e}=await import("./dictionary.7xenPiF3.js");return{dictionary:e}},[],import.meta.url).then(({dictionary:e})=>{console.log("Loaded dictionary:",e),this.ime.setDictionary(e)}).catch(e=>{console.error("Failed to load dictionary:",e)}),this.fontLoader=new u,this.fontLoader.loadFonts({hentaigana:!0,siddham:!0,itaiji:!0}).catch(e=>{console.error("Failed to load fonts:",e)})}connectedCallback(){m(),this.render(),this.setupStyles(),this.setupEventListeners()}render(){const e=`
      <div class="ime-container">
        <div class="ime-input-area">
          <input type="text" class="ime-input" placeholder="ひらがなで入力">
          <button type="button" class="ime-close">×</button>
        </div>
        <div class="ime-candidates"></div>
     </div>
    `;this.shadowRoot&&(this.shadowRoot.innerHTML=e,this.setupElements())}setupStyles(){const e=document.createElement("style"),i=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});e.textContent=`
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
    `,this.shadowRoot?.appendChild(e)}setupElements(){this.shadowRoot&&(this.container=this.shadowRoot.querySelector(".ime-container"),this.input=this.shadowRoot.querySelector(".ime-input"),this.candidateList=this.shadowRoot.querySelector(".ime-candidates"))}setupEventListeners(){this.input?.addEventListener("input",this.handleInput.bind(this)),this.props.target?.addEventListener("select",this.updatePosition.bind(this)),this.props.target?.addEventListener("click",this.updatePosition.bind(this)),this.shadowRoot?.querySelector(".ime-close")?.addEventListener("click",this.handleClose.bind(this))}handleInput(e){const i=e.target,a=i.value,t=a.replace(/[^ぁ-んー]/g,"");t!==this.state.input&&(this.state.input=t,a!==t&&(i.value=t),this.updateCandidates())}async updateCandidates(){try{const e=this.ime.search(this.state.input);this.state.candidates=e,this.renderCandidates()}catch(e){console.warn("Search failed:",e)}}renderCandidates(){this.candidateList&&(this.candidateList.innerHTML=this.state.candidates.map(e=>`
        <div class="ime-candidate" data-char="${e.char}">
          <span class="ime-candidate-char">${e.char}</span>
          <span class="ime-candidate-reading">(${e.reading})</span>
        </div>
      `).join(""),this.candidateList.querySelectorAll(".ime-candidate").forEach(e=>{e.addEventListener("click",i=>{const t=i.currentTarget.dataset.char;t&&this.handleCandidateSelect(t)})}))}handleCandidateSelect(e){if(this.props.target){const i=this.props.target,a=i.selectionStart||0,t=i.selectionEnd||0,n=i.value,s=this.fontLoader.getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});i.style.fontFamily=s,i.value=n.slice(0,a)+e+n.slice(t),i.selectionStart=i.selectionEnd=a+e.length,this.input.value="",this.state.input="",this.state.candidates=[],this.renderCandidates(),this.props.onChange?.(i.value)}}handleClose(){this.props.onClose?.()}updatePosition(){if(!this.props.target||!this.container)return;const e=this.props.target,i=e.getBoundingClientRect(),a=window.scrollX,t=window.scrollY,n=window.getComputedStyle(e),s=parseInt(n.lineHeight||"0")||parseInt(n.fontSize||"16")*1.2,c=s*2;this.container.style.position="absolute",this.container.style.top=`${i.top+t+c}px`,this.container.style.left=`${i.left+a}px`;const r=this.container.getBoundingClientRect();r.right>window.innerWidth&&(this.container.style.left=`${window.innerWidth-r.width-10+a}px`),r.bottom>window.innerHeight&&(this.container.style.top=`${i.top+t-r.height-s*2}px`)}updateOptions(e){this.props&&(this.props.options=e,this.ime.updateOptions(e))}}window.customElements.get("ime-ui")||window.customElements.define("ime-ui",E);class o{static instance;activeElement=null;eventCleanup;constructor(){}static getInstance(){return m(),o.instance||(o.instance=new o),o.instance}static resetInstance(){o.instance&&o.instance.detach(),o.instance=new o}attach(e,i={}){this.detach();const t=new u().getFontFamilyString({hentaigana:!0,siddham:!0,itaiji:!0});e.style.fontFamily=t;const n=document.createElement("ime-ui");Object.assign(n,{props:{target:e,options:{enabledTypes:i.options?.enabledTypes||{hentaigana:!0,siddham:!0,itaiji:!0,buddha_name:!1}},position:i.position||"bottom",onClose:()=>this.detach(),onChange:i.onChange}}),document.body.appendChild(n),this.activeElement=n,n.updatePosition();const s=c=>{const h=c.relatedTarget;(!h||!n.contains(h))&&this.detach()};e.addEventListener("blur",s),e.addEventListener("click",()=>n.updatePosition()),e.addEventListener("select",()=>n.updatePosition()),e.addEventListener("keyup",()=>n.updatePosition()),window.addEventListener("resize",()=>n.updatePosition()),this.eventCleanup=()=>{e.removeEventListener("blur",s),e.removeEventListener("click",()=>n.updatePosition()),e.removeEventListener("select",()=>n.updatePosition()),e.removeEventListener("keyup",()=>n.updatePosition()),window.removeEventListener("resize",()=>n.updatePosition())}}detach(){this.eventCleanup&&(this.eventCleanup(),this.eventCleanup=void 0),this.activeElement&&(this.activeElement.remove(),this.activeElement=null)}updateOptions(e){this.activeElement&&this.activeElement.updateOptions({enabledTypes:{hentaigana:!1,siddham:!1,itaiji:!1,buddha_name:!1,...e.enabledTypes}})}}document.getElementById("version").textContent="1.1.0";document.addEventListener("DOMContentLoaded",()=>{o.resetInstance();const d=o.getInstance();["hentaigana","siddham","itaiji","buddha_name"].forEach(e=>{document.getElementById(e)?.addEventListener("change",()=>{const i={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};d.updateOptions(i)})}),document.querySelectorAll(".ime-enabled").forEach(e=>{(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)&&e.addEventListener("focus",()=>{const i={enabledTypes:{hentaigana:document.getElementById("hentaigana")?.checked??!1,siddham:document.getElementById("siddham")?.checked??!1,itaiji:document.getElementById("itaiji")?.checked??!1,buddha_name:document.getElementById("buddha_name")?.checked??!1}};d.attach(e,{options:i})})})});
