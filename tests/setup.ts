import { JSDOM } from 'jsdom';

// vitest の jsdom 環境が document を用意しているときは差し替えない。
// 差し替えると customElements（環境側 window）と document が別 JSDOM に分かれ、
// document.createElement('ime-ui') が昇格しない。
if (typeof globalThis.document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
}
