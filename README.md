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
pnpm add @c4h/nagarjuna
```

### Migrating from the unscoped package name

Up to version 1.1.0 this package was published under the unscoped name nagarjuna. From the 2026-11 release it is published as `@c4h/nagarjuna`. The API is unchanged; only the package name differs.

```bash
pnpm remove nagarjuna
pnpm add @c4h/nagarjuna
```

Then change the module specifiers in your imports: nagarjuna becomes `@c4h/nagarjuna`, and nagarjuna/ime becomes `@c4h/nagarjuna/ime`.

## Usage

### Live demo

- NagaIME (the new IME UI, `<naga-ime>`): https://code4history.dev/Nagarjuna/
- Legacy IME demo (`IMEManager` / `<ime-ui>`, deprecated in 1.2.0): https://code4history.dev/Nagarjuna/legacy.html

### Display only (font loader)

When you only need to display the special characters:

```javascript
import { FontLoader } from '@c4h/nagarjuna';

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

### Using NagaIME (<naga-ime>)

NagaIME is the IME UI for entering Hentai-kana, Siddham, Buddha names, variant forms and combined characters. It listens on the fields you attach it to and does not get in the way of ordinary input: a small 梵 button appears at the top right of the field, and `Ctrl+J` (`⌘J` on macOS) opens the popup from the keyboard.

**1. From JavaScript**

```javascript
import { NagaIME } from '@c4h/nagarjuna/ime';

const ime = new NagaIME({ categories: ['hentaigana', 'itaiji'] });
ime.attach('#memo');
```

**2. Declaratively**

```javascript
import '@c4h/nagarjuna/ime'; // registers <naga-ime> (and the deprecated <ime-ui>)
```

```html
<input id="memo" />
<naga-ime for="memo"></naga-ime>
```

**3. Fields inside a shadow root**

`attach()` with a string selector resolves it with `document.querySelectorAll`, so it cannot see fields inside a shadow root. Pass the Element instead, or put a `<naga-ime for>` element inside the same shadow root (the `for` lookup uses that root).

```javascript
const host = document.querySelector('my-card');
const field = host.shadowRoot.querySelector('input');
ime.attach(field);
```

**4. API**

Attributes map to properties one to one (`<attribute>` → `<property>`); the defaults below apply when neither is set.

| Attribute | Property | Type | Default |
|---|---|---|---|
| `for` | `htmlFor` | space-separated ids | `''` |
| `categories` | `categories` | `NagaCategoryId[]` (space-separated in the attribute) | all categories |
| `trigger-label` | `triggerLabel` | `string` | `'梵'` |
| `shortcut` | `shortcut` | `boolean` | `true` |
| `recent-storage-key` | `recentStorageKey` | `string \| null` | `'nagarjuna-naga-recents'` |
| `recent-max` | `recentMax` | integer ≥ 0 | `14` |
| `max-candidates` | `maxCandidates` | integer ≥ 1 | `60` |
| `dock-breakpoint` | `dockBreakpoint` | number (CSS px) | `560` |
| `load-fonts` | `loadFonts` | `boolean` | `true` |

| Method | What it does |
|---|---|
| `new NagaIME(options?)` | Creates the element. When it is not connected, `attach()` appends it to `document.body`. |
| `attach(target)` | Attaches to a selector string, an Element, or a list of them. Elements other than `input` / `textarea` are ignored. |
| `detach(target?)` | Detaches from the given target (all targets when omitted). |
| `destroy()` | Detaches everything, releases the DOM and the listeners, and removes the element. |
| `open(field)` | Opens the popup for a field that is attached. |
| `close({ refocus })` | Closes the popup (`refocus: true` returns focus to the field). |
| `isOpen` | Whether the popup is open (read-only). |

| Event | `detail` |
|---|---|
| `nagaOpen` | `{ field }` |
| `nagaClose` | `{ field }` |
| `nagaCommit` | `{ field, candidate }` — fired after the candidate was inserted and the field's `input` event was dispatched |

The events are `CustomEvent`s with `bubbles: true`. To follow what the user typed, listen to the field's own `input` event (or to `nagaCommit` when you only need the picked candidate).

The public types are `NagaIMEOptions`, `NagaCandidate`, `NagaCategoryId` and `NagaIMEEventMap`; `NagaIME` and those types are exported from `@c4h/nagarjuna/ime`.

**5. Notes**

- If an ancestor of the field has `transform`, `filter` or `contain`, the popup (positioned with `position: fixed`) is offset by that ancestor's containing block.
- `new NagaIME()` appends the element to `document.body` when it is not connected yet.
- If two copies of the package are loaded, `<naga-ime>` belongs to the copy that registered first; `new NagaIME()` throws a `TypeError` in that state (check it with `customElements.get('naga-ime') === NagaIME`).
- Assigning `htmlFor` does not change the `for` attribute (unlike `<label>`).
- Recently used characters are kept in `localStorage` under `nagarjuna-naga-recents`; `recent-max="0"` turns the "recent" tab off and stops reading and writing it.

### Legacy IME (IMEManager / <ime-ui>) — deprecated

`IMEManager`, `IIMEManager`, `IMEOptions`, `IMEAttachOptions` and `<ime-ui>` are deprecated in 1.2.0, kept in 2.0.0 and will be removed in 3.0.0. Use `NagaIME` (`<naga-ime>`) for new code. A single `console.warn` is printed on the first `IMEManager.getInstance()` and when an `<ime-ui>` element is connected.

```javascript
import { IMEManager } from '@c4h/nagarjuna/ime';

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

### Migrating from IMEManager

| `IMEManager` / `<ime-ui>` | `NagaIME` (`<naga-ime>`) |
|---|---|
| `enabledTypes.hentaigana` / `.siddham` / `.itaiji` | the same ids in `categories` (`['hentaigana', 'siddham', 'itaiji']`) |
| `enabledTypes.buddha_name` | the category id `buddha` |
| `onChange(value)` | the field's `input` event, or the `nagaCommit` event |
| `updateOptions({ enabledTypes })` | assign `categories` |
| `position: 'bottom' \| 'cursor'` | none — NagaIME places the popup by itself |

The two IMEs do not behave the same way: NagaIME does not sit permanently in the page (it is opened explicitly with the 梵 button or `Ctrl+J`), and it supports entering several candidates in a row.

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
