import { NagaIME } from './ime';

// NagaIME の人間検証用 demo（naga.html）。legacy の src/demo.ts とは独立している。
const version = document.getElementById('version');
if (version) version.textContent = import.meta.env.APP_VERSION;

const ime = new NagaIME();
// .naga-target が付いた欄にだけ取り付ける
ime.attach('.naga-target');
