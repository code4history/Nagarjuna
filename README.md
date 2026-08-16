# Nagarjuna

**[Read this document in Japanese / 日本語で読む](README.ja.md)**

Nagarjuna (龍樹) — a tool for Bijakshara (種子), Hentai-kana (変体仮名), Itai-ji (異体字) and Kumi-moji (組み文字).  
The project name comes from [Nagarjuna (龍樹)](https://en.wikipedia.org/wiki/Nagarjuna), a 2nd-century Indian Buddhist monk.

## Purpose

Recent Unicode extensions have made available the character sets needed for surveying stone Buddhist monuments and for digitising old maps and historical documents: Siddham script ([Siddham](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u11580.html)), used for the seed syllables carved on stone Buddhas; Hentai-kana ([Supplement](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u1b000.html), [Extended-A](http://www.asahi-net.or.jp/~ax2s-kmtn/ref/unicode/u1b100.html)); kanji variant forms; and combined characters.

However, entering and displaying data in those extended Unicode ranges is still far from easy: fonts are often missing, and IMEs usually cannot type the characters at all.

This repository is a JavaScript library that makes those characters easier to handle by supporting both their **display** and their **input**.

## Features

- Hentai-kana (using the NINJAL Hentai-kana font)
- Siddham script (using Noto Sans Siddham)
- Kanji variant forms (using Noto Sans JP)
- Automatic font loading
- Mobile-friendly IME

## Installation

```bash
pnpm add nagarjuna
```

## Usage

### Live demo

https://code4history.dev/Nagarjuna/

### Display only (font loader)

When you only need to display the special characters:

```javascript
import { FontLoader } from 'nagarjuna';

const fontLoader = new FontLoader();

// Load only the fonts you need
await fontLoader.loadFonts({
  hentaigana: true,  // use Hentai-kana
  siddham: true,     // use Siddham script
  itaiji: true       // use kanji variant forms
});

// Apply the font family
const element = document.getElementById('target');
element.style.fontFamily = fontLoader.getFontFamilyString({
  hentaigana: true,
  siddham: true,
  itaiji: true
});
```

### Using the IME

When you also need input:

```javascript
import { IMEManager } from 'nagarjuna/ime';

// Initialise the IME manager
const manager = IMEManager.getInstance();

// Attach the IME to an input field
const input = document.querySelector('input');
manager.attach(input, {
  options: {
    enabledTypes: {
      hentaigana: true,  // enable Hentai-kana conversion
      siddham: true,     // enable Siddham conversion
      itaiji: true,      // enable variant-form conversion
      buddha_name: true  // enable Buddha-name conversion (a subset of Siddham)
    }
  }
});

// Update IME options at runtime
manager.updateOptions({
  enabledTypes: {
    hentaigana: true,
    siddham: false,
    itaiji: true,
    buddha_name: false
  }
});
```

## License

Copyright (c) 2024 Code for History  
MIT License

## Fonts

This library uses the following fonts:

* NINJAL Hentai-kana font (Copyright 2022 National Institute for Japanese Language and Linguistics) — Apache License 2.0
* Noto Sans Siddham — SIL Open Font License 1.1
* Noto Sans JP — SIL Open Font License 1.1

## Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm run dev

# Build
pnpm run build

# Test
pnpm test
```

## Acknowledgements

We thank the National Institute for Japanese Language and Linguistics for providing the NINJAL Hentai-kana font.
