import { IMECore } from './core';
import { FontLoader } from '../fonts/loader';
import { IMEUIProps, IMEUIState } from './ui-types';

export class IMEUIElement extends HTMLElement {
  private props: IMEUIProps = {
    target: document.createElement('input'), // デフォルト値として空のinput要素を設定
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
    this.state = {
      input: '',
      candidates: [],
      cursorPosition: null
    };
  
    // IMEの初期化時に全ての文字体系を有効化
    this.ime = new IMECore({
      enabledTypes: {
        hentaigana: true,
        siddham: true,
        itaiji: true,
        buddha_name: true
      }
    });
  
    // フォントの読み込みを先に行う
    this.fontLoader = new FontLoader();
    this.loadAndApplyFonts();  // 新しいメソッド

    // 辞書データの読み込み
    import('../../data/dictionary').then(({ dictionary }) => {
      console.log('Loaded dictionary:', dictionary);
      this.ime.setDictionary(dictionary);
    }).catch(error => {
      console.error('Failed to load dictionary:', error);
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

  // フォントの読み込みと適用を行うメソッド
  private async loadAndApplyFonts() {
    try {
      await this.fontLoader.loadFonts({
        hentaigana: true,
        siddham: true,
        itaiji: true
      });
  
      // フォントファミリーを設定
      const fontFamily = this.fontLoader.getFontFamilyString({
        hentaigana: true,
        siddham: true,
        itaiji: true
      });
  
      // 候補リストに適用
      if (this.candidateList) {
        this.candidateList.style.fontFamily = fontFamily;
      }
    } catch (error) {
      console.error('Failed to load fonts:', error);
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

      .ime-candidates {
        max-height: 200px;
        overflow-y: auto;
        padding: 8px;
        font-family: ${fontFamily};
        border: 1px solid #eee;
        background: #fff;
      }
  
      .ime-candidate {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: ${fontFamily};
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
    this.shadowRoot?.querySelector('.ime-close')?.addEventListener(
      'click',
      this.handleClose.bind(this)
    );
  }

  // 入力ハンドラ
  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.state.input = input.value;
    console.log('Input value:', input.value); // 入力値の確認
    this.updateCandidates();
  }

  // 候補の更新
  private async updateCandidates() {
    const candidates = this.ime.search(this.state.input);
    console.log('Search results:', candidates); // 検索結果の確認
    this.state.candidates = candidates;
    this.renderCandidates();
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
  private updatePosition() {
    if (!this.props.target || !this.container) return;

    const targetRect = this.props.target.getBoundingClientRect();
    const { position = 'bottom' } = this.props;

    if (position === 'bottom') {
      this.container.style.top = `${targetRect.bottom + window.scrollY}px`;
      this.container.style.left = `${targetRect.left + window.scrollX}px`;
    } else {
      // カーソル位置に表示する場合の処理
      if (this.state.cursorPosition) {
        this.container.style.top = `${this.state.cursorPosition.y}px`;
        this.container.style.left = `${this.state.cursorPosition.x}px`;
      }
    }
  }
}

// カスタム要素の登録
customElements.define('ime-ui', IMEUIElement);