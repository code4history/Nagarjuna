# Nagarjuna
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
npm install nagarjuna
```

## 使用方法

### 動作デモ

https://code4history.dev/Nagarjuna/

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

### IME機能を使用

入力機能が必要な場合:

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
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テスト
npm test
```

## 謝辞
NINJAL変体仮名フォントを提供いただいた国立国語研究所に感謝いたします。


