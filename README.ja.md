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
- モバイル対応IME機能（`NagaIME`: 必要なときだけ開く特殊文字ピッカー。1.1.0 で追加）

## インストール

```bash
pnpm add nagarjuna
```

## 使用方法

### 動作デモ

- NagaIME: https://code4history.dev/Nagarjuna/naga.html
- 従来の `IMEManager`（非推奨）: https://code4history.dev/Nagarjuna/

### 表示用途のみ（フォントローダー）

特殊文字の表示のみが必要な場合:

```javascript
import { FontLoader } from 'nagarjuna';

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

### IME機能を使用（NagaIME）

入力機能が必要な場合は、input / textarea に `NagaIME` を取り付けます:

```javascript
import { NagaIME } from 'nagarjuna/ime';

const ime = new NagaIME();

// 取り付け（CSS セレクタ・要素・要素の列のいずれか）
ime.attach('.naga-target');

// 挿入は標準の bubbles な input イベントで受け取る
document.querySelector('.naga-target').addEventListener('input', (event) => {
  console.log(event.target.value);
});

// 1 要素だけ取り外す／すべて取り外して DOM を片付ける
ime.detach(document.querySelector('.naga-target'));
ime.destroy();
```

- 欄にフォーカスしても小さな起動ボタンが出るだけで、通常の入力には介入しません。
- 起動ボタンまたは **Ctrl+J / Cmd+J** で開きます。読み（ひらがな）または説明文（例: 異体字タブで `時`）で検索し、↑↓ / Enter / Tab / クリック / 1〜9 で確定、Esc で閉じます。
- 文字は `setRangeText()` でキャレット位置へ挿入し、bubbles な `input` イベントを発火します。確定後も開いたままなので連続入力できます。
- タブ: 最近・変体仮名・悉曇・仏名・異体字・組文字。最近使った文字は `localStorage` に保存します。
- 辞書は package に同梱されており、ネットワークから取得しません。書体は `FontLoader` で読み込みます。
- 狭い画面（560px 未満）ではポップアップを画面下部へドッキングします。
- オプション（すべて省略可）: `categories`・`triggerLabel`・`shortcut`・`recentStorageKey`（`null` で保存しない）・`recentMax`・`maxCandidates`・`dockBreakpoint`・`loadFonts`。

注意: `nagarjuna/ime` を import すると、`NagaIME` だけを使う場合でも legacy の `<ime-ui>` custom element が登録されます。同一の input / textarea に `IMEManager` と `NagaIME` を同時に attach する使い方はサポートしません。

### 従来の IME（IMEManager）— 非推奨

`IMEManager`、`IIMEManager`、`IMEOptions`、`IMEAttachOptions`、`onChange`、`updateOptions`、および legacy custom element `<ime-ui>` は **1.1.0 で非推奨**になりました。1.1.0 では動作を変えずに維持し、**2.0.0 でも維持**し、**3.0.0 で削除予定**です。`IMEManager` または `<ime-ui>` を使用すると、同一プロセスで 1 回だけ `console.warn` に非推奨警告（`[nagarjuna] DEPRECATED: …`）を出力します。1.1.0 にこの警告の抑止オプションはありません。新規実装では `NagaIME` と `input` イベントを使用してください。

```javascript
import { IMEManager } from 'nagarjuna/ime';

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
