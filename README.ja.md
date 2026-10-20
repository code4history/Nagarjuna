# Nagarjuna

**[英語版はこちら / Read this document in English](README.md)**

龍樹(Nagarjuna) - Tool for Bijakshara (種子), Hentai-kana (変体仮名), Itai-ji (異体字), Kumi-moji (組み文字)  
プロジェクト名は2世紀のインド仏教の僧、[龍樹(Nagarjuna)](https://hi.wikipedia.org/wiki/%E0%A4%A8%E0%A4%BE%E0%A4%97%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%9C%E0%A5%81%E0%A4%A8_(%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%BE%E0%A4%9A%E0%A5%80%E0%A4%A8_%E0%A4%A6%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%B6%E0%A4%A8%E0%A4%BF%E0%A4%95))より名付けています。

## 目的

最近のUnicodeの拡張で、石仏などの種子にも用いられる梵字（ [悉曇文字](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u11580.html) ）、変体仮名（ [補助](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u1b000.html), [拡張A](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u1b100.html) ）、漢字異体字、組み文字など、石仏調査や古地図古文書データ化などにも役立つ文字セットが揃ってきています。  
が、それらの拡張Unicodeでデータを整備したり、整備したデータを表示したりするのは、フォントが整備されていなかったり、IMEで入力できなかったりと、簡単にデータ整備できる環境はまだ揃っているとは言い難いです。  
このリポジトリは、それらの文字の表示および入力をサポートすることで、取り扱いを簡単にするためのJavaScriptライブラリです。

## 特徴

- 変体仮名（NINJAL変体仮名フォント使用）
- 悉曇文字（Noto Sans Siddham使用）
- 漢字異体字（Noto Sans JP使用）
- フォントの自動読み込み
- モバイル対応IME機能

## インストール

```bash
pnpm add @c4h/nagarjuna
```

### スコープなしの旧名からの移行

1.1.0 までは、スコープなしの nagarjuna という名前で公開していました。2026-11 のリリースから `@c4h/nagarjuna` の名前で公開します。API は同じで、変わるのはパッケージ名だけです。

```bash
pnpm remove nagarjuna
pnpm add @c4h/nagarjuna
```

import の指定子を書き換えてください: nagarjuna は `@c4h/nagarjuna` に、nagarjuna/ime は `@c4h/nagarjuna/ime` になります。

## 使用方法

### 動作デモ

- NagaIME（新しい IME UI・`<naga-ime>`）のデモ: https://code4history.dev/Nagarjuna/
- 旧 IME（`IMEManager` / `<ime-ui>`・1.2.0 で非推奨）のデモ: https://code4history.dev/Nagarjuna/legacy.html

### 表示用途のみ（フォントローダー）

特殊文字の表示のみが必要な場合:

```javascript
import { FontLoader } from '@c4h/nagarjuna';

const fontLoader = new FontLoader();

// 必要なフォントのみを読み込み
await fontLoader.loadFonts({
  hentaigana: true,  // 変体仮名を使用
  siddham: true,     // 悉曇文字を使用
  itaiji: true       // 異体字を使用
});

// フォントファミリーの設定
const element = document.getElementById('target');
element.style.fontFamily = fontLoader.getFontFamilyString({
  hentaigana: true,
  siddham: true,
  itaiji: true
});
```

### NagaIME（<naga-ime>）を使う

NagaIME は、変体仮名・悉曇文字・仏名・異体字・組み文字を入力するための IME UI です。取り付けた欄でだけ働き、通常の入力は妨げません。欄の右上に小さな `梵` ボタンが出て、`Ctrl+J`（macOS は `⌘J`）でもキーボードから開けます。

**1. JavaScript から**

```javascript
import { NagaIME } from '@c4h/nagarjuna/ime';

const ime = new NagaIME({ categories: ['hentaigana', 'itaiji'] });
ime.attach('#memo');
```

**2. 宣言で書く**

```javascript
import '@c4h/nagarjuna/ime'; // <naga-ime>（と非推奨の <ime-ui>）を登録する
```

```html
<input id="memo" />
<naga-ime for="memo"></naga-ime>
```

**3. 影（shadow root）の中の欄**

文字列のセレクタを渡す `attach()` は `document.querySelectorAll` で引くので、影の中の欄は引けません。Element を渡すか、同じ影の中に `<naga-ime for>` を置いてください（`for` はその root で引きます）。

```javascript
const host = document.querySelector('my-card');
const field = host.shadowRoot.querySelector('input');
ime.attach(field);
```

**4. API**

属性はプロパティと 1 対 1 で対応します（`<属性>` → `<プロパティ>`）。どちらも指定が無いときは、次の既定値が効きます。

| 属性 | プロパティ | 型 | 既定値 |
|---|---|---|---|
| `for` | `htmlFor` | id を空白で並べたもの | `''` |
| `categories` | `categories` | `NagaCategoryId[]`（属性では空白区切り） | 全カテゴリ |
| `trigger-label` | `triggerLabel` | `string` | `'梵'` |
| `shortcut` | `shortcut` | `boolean` | `true` |
| `recent-storage-key` | `recentStorageKey` | `string \| null` | `'nagarjuna-naga-recents'` |
| `recent-max` | `recentMax` | 0 以上の整数 | `14` |
| `max-candidates` | `maxCandidates` | 1 以上の整数 | `60` |
| `dock-breakpoint` | `dockBreakpoint` | 数値（CSS px） | `560` |
| `load-fonts` | `loadFonts` | `boolean` | `true` |

| メソッド | すること |
|---|---|
| `new NagaIME(options?)` | 要素を作る。未接続なら `attach()` が `document.body` の末尾へ入れる |
| `attach(target)` | セレクタ文字列・Element・その列に取り付ける。input / textarea 以外は無視する |
| `detach(target?)` | 指定した相手から取り外す（省略時はすべて） |
| `destroy()` | すべて取り外し、DOM と listener を片付けて要素を消す |
| `open(field)` | 取り付け済みの欄のために popup を開く |
| `close({ refocus })` | popup を閉じる（`refocus: true` で欄へ focus を戻す） |
| `isOpen` | popup が開いているか（読み取り専用） |

| イベント | `detail` |
|---|---|
| `nagaOpen` | `{ field }` |
| `nagaClose` | `{ field }` |
| `nagaCommit` | `{ field, candidate }` — 候補を欄へ入れ、欄の `input` を出した後に出る |

イベントは `bubbles: true` の `CustomEvent` です。利用者の入力を追うには欄の `input` を、選ばれた候補だけが要るなら `nagaCommit` を購読してください。

公開の型は `NagaIMEOptions`・`NagaCandidate`・`NagaCategoryId`・`NagaIMEEventMap` です。`NagaIME` とこれらの型は `@c4h/nagarjuna/ime` から export します。

**5. 注意**

- 欄の祖先に `transform`・`filter`・`contain` があると、`position: fixed` で置く popup が、その祖先の containing block の分だけずれます。
- `new NagaIME()` で作った要素は、未接続のとき `document.body` の末尾へ入ります。
- パッケージの複製が 2 つ読み込まれると、`<naga-ime>` は先に登録した版のものになります。その状態で `new NagaIME()` は `TypeError` になります（`customElements.get('naga-ime') === NagaIME` で確かめられます）。
- `htmlFor` への代入は `for` 属性を変えません（`<label>` とは違います）。
- 最近使った文字は localStorage のキー `nagarjuna-naga-recents` に保存します。`recent-max="0"` にすると「最近」タブを外し、読み書きもしません。

### 旧 IME（IMEManager／<ime-ui>）— 非推奨

`IMEManager`・`IIMEManager`・`IMEOptions`・`IMEAttachOptions`・`<ime-ui>` は 1.2.0 で非推奨です。2.0.0 では維持し、3.0.0 で削除予定です。新しく書くコードでは `NagaIME`（`<naga-ime>`）を使用してください。`IMEManager.getInstance()` の初回と `<ime-ui>` の接続時に `console.warn` で 1 回だけ警告します。

```javascript
import { IMEManager } from '@c4h/nagarjuna/ime';

// IMEマネージャーの初期化
const manager = IMEManager.getInstance();

// 入力フィールドへのIME機能の追加
const input = document.querySelector('input');
manager.attach(input, {
  options: {
    enabledTypes: {
      hentaigana: true,  // 変体仮名変換を有効化
      siddham: true,     // 悉曇文字変換を有効化
      itaiji: true,      // 異体字変換を有効化
      buddha_name: true  // 仏名変換を有効化（悉曇文字の一部）
    }
  }
});

// IMEオプションの動的更新
manager.updateOptions({
  enabledTypes: {
    hentaigana: true,
    siddham: false,
    itaiji: true,
    buddha_name: false
  }
});
```

### IMEManager からの移行

| `IMEManager` / `<ime-ui>` | `NagaIME`（`<naga-ime>`） |
|---|---|
| `enabledTypes.hentaigana` / `.siddham` / `.itaiji` | 同じ id を `categories` に並べる（`['hentaigana', 'siddham', 'itaiji']`） |
| `enabledTypes.buddha_name` | カテゴリ id `buddha` |
| `onChange(value)` | 欄の `input` イベント、または `nagaCommit` イベント |
| `updateOptions({ enabledTypes })` | `categories` への代入 |
| `position: 'bottom' \| 'cursor'` | 対応なし（NagaIME が自分で置く） |

両者は同じ振る舞いではありません。NagaIME はページに常駐せず（`梵` ボタンや `Ctrl+J` で明示に開く）、続けて何件でも確定できます。

## ライセンス

Copyright (c) 2024 Code for History  
MIT License

## フォントについて

本ライブラリは以下のフォントを使用しています：

* NINJAL変体仮名フォント (Copyright 2022 National Institute for Japanese Language and Linguistics) - Apache License 2.0
* Noto Sans Siddham - SIL Open Font License 1.1
* Noto Sans JP - SIL Open Font License 1.1

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm run dev

# ビルド
pnpm run build

# テスト
pnpm test
```

## 謝辞
NINJAL変体仮名フォントを提供いただいた国立国語研究所に感謝いたします。
