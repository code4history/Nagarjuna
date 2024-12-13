import { IMECore } from './core';
import { FontLoader } from '../fonts/loader';
import { IMEUIProps, IMEUIState } from './ui-types';
  
export class IMEUIElement extends HTMLElement {
  private props: IMEUIProps = {
    target: document.createElement('input'),
    options: {
      enabledTypes: {}
    }
  };
  private state: IMEUIState = {
    input: '',
    candidates: [],
    cursorPosition: null
  };
  private ime: IMECore;
  private fontLoader: FontLoader;
  
  // シャドウDOM内のUI要素への参照
  private container!: HTMLDivElement;
  private input!: HTMLInputElement;
  private candidateList!: HTMLDivElement;
  
  constructor() {
    super();
    
    this.attachShadow({ mode: 'open' });
  
    // IMEとフォントローダーの初期化
    this.ime = new IMECore({
      enabledTypes: {
        hentaigana: true,
        siddham: true,
        itaiji: true,
        buddha_name: false
      }
    });
  
    // 辞書データの読み込み
    import('../../data/dictionary').then(({ dictionary }) => {
      console.log('Loaded dictionary:', dictionary);
      this.ime.setDictionary(dictionary);
    }).catch(error => {
      console.error('Failed to load dictionary:', error);
    });
  
    this.fontLoader = new FontLoader();
    this.fontLoader.loadFonts({
      hentaigana: true,
      siddham: true,
      itaiji: true
    }).catch(error => {
      console.error('Failed to load fonts:', error);
    });
  }
  
  // Web Componentsのライフサイクルメソッド
  connectedCallback() {
    this.render();
    this.setupStyles();
    this.setupEventListeners();
  }
  
  // UIの描画
  private render() {
    const template = `
      <div class="ime-container">
        <div class="ime-input-area">
          <input type="text" class="ime-input" placeholder="ひらがなで入力">
          <button type="button" class="ime-close">×</button>
        </div>
        <div class="ime-candidates"></div>
     </div>
    `;
  
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
      this.setupElements();
    }
  }
  
  // スタイルの設定
  private setupStyles() {
    const style = document.createElement('style');
    const fontFamily = this.fontLoader.getFontFamilyString({
      hentaigana: true,
      siddham: true,
      itaiji: true
    });
  
    style.textContent = `
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
        font-family: ${fontFamily};
      }
  
      .ime-candidate {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: ${fontFamily};
      }
  
      .ime-candidate:hover {
        background: #f5f5f5;
      }
  
      .ime-candidate-char {
        font-family: ${fontFamily};
        margin-right: 8px;
      }
  
      .ime-candidate-reading {
        color: #666;
        font-size: 0.9em;
      }
    `;
  
    this.shadowRoot?.appendChild(style);
  }
  
  // 要素の参照を保持
  private setupElements() {
    if (!this.shadowRoot) return;
  
    this.container = this.shadowRoot.querySelector('.ime-container')!;
    this.input = this.shadowRoot.querySelector('.ime-input')!;
    this.candidateList = this.shadowRoot.querySelector('.ime-candidates')!;
  }
  
  // イベントリスナーの設定
  private setupEventListeners() {
    this.input?.addEventListener('input', this.handleInput.bind(this));
    this.props.target?.addEventListener('select', this.updatePosition.bind(this));
    this.props.target?.addEventListener('click', this.updatePosition.bind(this));
    this.shadowRoot?.querySelector('.ime-close')?.addEventListener(
      'click',
      this.handleClose.bind(this)
    );
  }
  
  // 入力ハンドラ
  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // ひらがなのみを抽出
    const hiraganaOnly = value.replace(/[^ぁ-んー]/g, '');
      
    // 前回の有効な入力と同じ場合は更新しない
    if (hiraganaOnly === this.state.input) return;
      
    // ひらがなのみの値を保持
    this.state.input = hiraganaOnly;
      
    // 入力フィールドの値をひらがなのみに更新
    if (value !== hiraganaOnly) {
      input.value = hiraganaOnly;
    }
      
    this.updateCandidates();
  }
  
  // 候補の更新
  private async updateCandidates() {
    try {
      const candidates = this.ime.search(this.state.input);
      this.state.candidates = candidates;
      this.renderCandidates();
    } catch (error) {
      console.warn('Search failed:', error);
      // エラーが発生しても UI は更新しない
    }
  }
  
  // 候補リストの描画
  private renderCandidates() {
    if (!this.candidateList) return;
  
    this.candidateList.innerHTML = this.state.candidates
      .map(candidate => `
        <div class="ime-candidate" data-char="${candidate.char}">
          <span class="ime-candidate-char">${candidate.char}</span>
          <span class="ime-candidate-reading">(${candidate.reading})</span>
        </div>
      `)
      .join('');
  
    // 候補クリックのイベントハンドラを設定
    this.candidateList.querySelectorAll('.ime-candidate').forEach(element => {
      element.addEventListener('click', (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const char = target.dataset.char;
        if (char) {
          this.handleCandidateSelect(char);
        }
      });
    });
  }
  
  // 候補選択時の処理
  private handleCandidateSelect(char: string) {
    if (this.props.target) {
      const target = this.props.target;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const value = target.value;
        
      // フォントファミリーを設定
      const fontFamily = this.fontLoader.getFontFamilyString({
        hentaigana: true,
        siddham: true,
        itaiji: true
      });
      target.style.fontFamily = fontFamily;
        
      target.value = value.slice(0, start) + char + value.slice(end);
      target.selectionStart = target.selectionEnd = start + char.length;
  
      // 入力欄をクリア
      this.input.value = '';
      this.state.input = '';
      this.state.candidates = [];
      this.renderCandidates();
  
      // コールバックを呼び出し
      this.props.onChange?.(target.value);
    }
  }
  
  // 閉じるボタンのハンドラ
  private handleClose() {
    this.props.onClose?.();
  }
  
  // 位置の更新
  public updatePosition() {
    if (!this.props.target || !this.container) return;
  
    const target = this.props.target;
    const targetRect = target.getBoundingClientRect();
    
    // スクロール位置を考慮
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
  
    // コンピュートされたスタイルから行の高さを取得
    const computedStyle = window.getComputedStyle(target);
    const lineHeight = parseInt(computedStyle.lineHeight || '0') || 
                      parseInt(computedStyle.fontSize || '16') * 1.2;
  
    // 2行分のオフセットに変更
    const topOffset = lineHeight * 2;
  
    this.container.style.position = 'absolute';
    this.container.style.top = `${targetRect.top + scrollY + topOffset}px`;
    this.container.style.left = `${targetRect.left + scrollX}px`;
  
    // 画面からはみ出さないように調整
    const containerRect = this.container.getBoundingClientRect();
    if (containerRect.right > window.innerWidth) {
      this.container.style.left = `${window.innerWidth - containerRect.width - 10 + scrollX}px`;
    }
    if (containerRect.bottom > window.innerHeight) {
      // 上に表示する場合も2行分のオフセットを考慮
      this.container.style.top = `${targetRect.top + scrollY - containerRect.height - lineHeight * 2}px`;
    }
  }
  
  public updateOptions(options: IMEUIProps['options']) {
    if (this.props) {
      this.props.options = options;
      this.ime.updateOptions(options);
    }
  }
}
  
// カスタム要素の登録
if (!window.customElements.get('ime-ui')) {
  window.customElements.define('ime-ui', IMEUIElement as unknown as CustomElementConstructor);
}