#!/usr/bin/env node
/**
 * ci/verify-artifact-smoke.mjs — Cycle 2 m1-t5（設計 §6.3）
 *
 * CI が同一 job 内で upload → download した package artifact（`pnpm pack` の .tgz）を展開し、
 * **配布物そのもの**に対して smoke を実行する。
 * outer rule-0014「『手元でビルドして動いた』は CI 成果物の検証にならない」の実装である。
 *
 *   node ci/verify-artifact-smoke.mjs --artifact-dir=<dir> --report=<path>
 *
 * 依存は Node 標準機能のみ（node:fs / node:path / node:child_process）。
 * 新規 devDependency を追加しない（設計 §9.5 項1）。
 *
 * 検査（3 repo 共通の骨格）:
 *   S1 --artifact-dir 直下に .tgz がちょうど1件
 *   S2 package/package.json が読め、name / version が repo の package.json と一致する
 *   S3 package/README.md と package/README.ja.md がともに存在する
 *   S4 exports / main / module / types が指すファイルがすべて tarball 内に実在する
 *   S5 repo 固有 smoke（本ファイルで差し替わる唯一の部分）
 *   S5d 配布物に Pages 専用資産（icons / fonts / index.html）・テスト由来 .d.ts・dist/src の入れ子が無い
 *   S6 結果を --report のパスへ書き出す
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ---------------------------------------------------------------------------
// repo 固有の定義（3 repo でここだけが異なる）
// ---------------------------------------------------------------------------

const REPO = "Nagarjuna";

/**
 * S5 の driver。staging ディレクトリ（`node_modules/<pkg>` に展開済み package を置いた場所）
 * で `node` に実行させ、`[label, ok, detail]` の JSON 配列を stdout へ出させる。
 * package 名で解決させることで、exports map そのものを検査対象にする。
 */
const SMOKE_DRIVER_SOURCE = `
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const require = createRequire(import.meta.url);
const results = [];
const push = (label, ok, detail) => results.push([label, Boolean(ok), String(detail)]);
const pkgDir = path.join(process.cwd(), "node_modules", "nagarjuna");

// (a) ESM import と CJS require の双方が解決できる
let esm = null;
try {
  esm = await import("nagarjuna");
  push("S5a ESM import('nagarjuna') が解決する", true, Object.keys(esm).sort().join(","));
} catch (error) {
  push("S5a ESM import('nagarjuna') が解決する", false, error.message);
}
try {
  const cjs = require("nagarjuna");
  push("S5a CJS require('nagarjuna') が解決する", true, Object.keys(cjs).sort().join(","));
} catch (error) {
  push("S5a CJS require('nagarjuna') が解決する", false, error.message);
}
// 解決先が staging（＝配布された tarball の中身）であることを要求する。
// repo の作業ツリーへ解決されていたら S5 は成立していない（Node の self-reference 経路）。
try {
  const resolved = require.resolve("nagarjuna");
  push("S5a 解決先が staging の配布物である", resolved.startsWith(process.cwd() + path.sep), resolved);
} catch (error) {
  push("S5a 解決先が staging の配布物である", false, error.message);
}

// (b) FontLoader が export されている
push(
  "S5b FontLoader が export される",
  Boolean(esm && esm.FontLoader),
  esm ? Object.keys(esm).sort().join(",") : "ESM import に失敗",
);

// (c) ./ime subpath — 解決＋静的照合（設計 v1.2 §6.6。実 import はしない）。
// ./ime は読み込み時に window.customElements.define('ime-ui', …) を実行する
// ブラウザ専用モジュールであり、Node で読むと必ず落ちる。設計 §6.3 の実測により
// Node で読む正当な用途は 0 件である ∴ 上位契約と m1-t5 §6.3 の字句どおり
// 「解決できること」＋「配布物が IMEManager を export すること」を検査する。

// S5c-1: types / import / require の指し先が実在する（現行の判定をそのまま残す）
let imeEntry = {};
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
  imeEntry = manifest.exports?.["./ime"] ?? {};
  const missing = ["types", "import", "require"].filter(
    (condition) => !imeEntry[condition] || !fs.existsSync(path.join(pkgDir, imeEntry[condition])),
  );
  push("S5c ./ime の types / import / require が実在する", missing.length === 0, JSON.stringify(imeEntry));
} catch (error) {
  push("S5c ./ime の types / import / require が実在する", false, error.message);
}

// S5c-2: ESM 条件が .js へ、CJS 条件が .cjs へ解決し、いずれも staging 内であること。
// 解決先が条件ごとに別のファイルへ着地する ∴ exports map の条件分岐そのものを検証している。
try {
  const esmResolved = url.fileURLToPath(import.meta.resolve("nagarjuna/ime"));
  const cjsResolved = require.resolve("nagarjuna/ime");
  const prefix = process.cwd() + path.sep;
  const inStaging = esmResolved.startsWith(prefix) && cjsResolved.startsWith(prefix);
  const distJs = path.join("dist", "nagarjuna-ime.js");
  const distCjs = path.join("dist", "nagarjuna-ime.cjs");
  const shapeOk = esmResolved.endsWith(distJs) && cjsResolved.endsWith(distCjs);
  push(
    "S5c ./ime が ESM 条件で .js・CJS 条件で .cjs へ解決する（staging 内）",
    inStaging && shapeOk,
    esmResolved + " | " + cjsResolved,
  );
} catch (error) {
  push("S5c ./ime が ESM 条件で .js・CJS 条件で .cjs へ解決する（staging 内）", false, error.message);
}

// S5c-3: 配布物が IMEManager を export することを静的に照合する（Chokei の S5c と同手法）。
// 正規表現リテラルを使わない — 本 driver はテンプレートリテラルであり、バックスラッシュが
// テンプレートリテラルのエスケープとして先に消費されて別の文字になる（設計 §6.6.1 の罠）。
try {
  const dtsText = fs.readFileSync(path.join(pkgDir, "dist", "ime.d.ts"), "utf8");
  const esmText = fs.readFileSync(path.join(pkgDir, "dist", "nagarjuna-ime.js"), "utf8");
  const cjsText = fs.readFileSync(path.join(pkgDir, "dist", "nagarjuna-ime.cjs"), "utf8");
  const dtsOk = dtsText.includes("IMEManager");
  // 末尾の export 節だけを見る（export { o as IMEManager }; のような別名再 export に耐える）
  let esmOk = false;
  const spaced = esmText.lastIndexOf("export {");
  const tight = esmText.lastIndexOf("export{");
  const start = spaced > tight ? spaced : tight;
  if (start >= 0) {
    const end = esmText.indexOf("}", start);
    if (end > start) esmOk = esmText.slice(start, end).includes("IMEManager");
  }
  const cjsOk = cjsText.includes("exports.IMEManager=") || cjsText.includes("exports.IMEManager =");
  push(
    "S5c 配布物が IMEManager を export する（.d.ts / ESM / CJS の静的照合）",
    dtsOk && esmOk && cjsOk,
    "dts=" + dtsOk + " esm=" + esmOk + " cjs=" + cjsOk,
  );
} catch (error) {
  push("S5c 配布物が IMEManager を export する（.d.ts / ESM / CJS の静的照合）", false, error.message);
}

// (d) 恒久ガード: 配布物に Pages 専用資産 / テスト由来 .d.ts / dist/src の入れ子が無いこと。
// 否定形の検査は「対象が空でも通る」空虚化の経路を持つ ∴ detail に dist エントリ総数を必ず出す。
try {
  const distDir = path.join(pkgDir, "dist");
  const entries = [];
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) walk(full);
      else entries.push(path.relative(pkgDir, full).split(path.sep).join("/"));
    }
  };
  walk(distDir);
  const bannedPrefixes = ["dist/icons/", "dist/fonts/", "dist/src/", "dist/tests/"];
  const intruders = entries
    .filter((e) => e === "dist/index.html" || bannedPrefixes.some((p) => e.startsWith(p)))
    .sort();
  push(
    "S5d 配布物に Pages 専用資産 / テスト由来 .d.ts / dist/src の入れ子が無い",
    intruders.length === 0,
    intruders.length === 0
      ? "dist エントリ " + entries.length + " 件・混入 0 件"
      : intruders.length + " 件混入: " + intruders.slice(0, 5).join(",") + " …",
  );
} catch (error) {
  push("S5d 配布物に Pages 専用資産 / テスト由来 .d.ts / dist/src の入れ子が無い", false, error.message);
}

process.stdout.write(JSON.stringify(results));
`;

// ---------------------------------------------------------------------------
// 以下は3 repo で同一の骨格
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const parsed = {};
  for (const item of argv.slice(2)) {
    const match = /^--([^=]+)=(.*)$/.exec(item);
    if (match) parsed[match[1]] = match[2];
  }
  return parsed;
}

/** exports の入れ子から、配布物内の相対パスを指す葉をすべて集める。 */
function collectExportTargets(node, sink) {
  if (typeof node === "string") {
    if (node.startsWith("./")) sink.add(node);
    return sink;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collectExportTargets(value, sink);
  }
  return sink;
}

function main() {
  const args = parseArgs(process.argv);
  const artifactDir = path.resolve(args["artifact-dir"] ?? "ci-artifact-smoke");
  const reportPath = path.resolve(args.report ?? path.join("ci-evidence", "artifact-smoke.txt"));
  const checks = [];
  const record = (label, ok, detail) => checks.push({ label, ok: Boolean(ok), detail: String(detail ?? "") });

  // ---- S1: .tgz がちょうど1件 ----
  let tarball = null;
  if (!fs.existsSync(artifactDir)) {
    record("S1 --artifact-dir に .tgz がちょうど1件", false, artifactDir + " が存在しません");
  } else {
    const found = fs.readdirSync(artifactDir).filter((name) => name.endsWith(".tgz"));
    record("S1 --artifact-dir に .tgz がちょうど1件", found.length === 1, found.join(",") || "0 件");
    if (found.length === 1) tarball = path.join(artifactDir, found[0]);
  }

  // 展開先は実行ごとに一意な名前にする。既存ディレクトリを消して作り直さない
  // （破壊的操作を持ち込まない。残置しても後続の実行に干渉しない）。
  const runId = new Date().toISOString().replace(/[^0-9]/g, "") + "-" + process.pid;
  const extractRoot = path.join(artifactDir, ".smoke-extract-" + runId);
  const stageDir = path.join(artifactDir, ".smoke-stage-" + runId);
  let packageDir = null;
  let manifest = null;

  if (tarball) {
    fs.mkdirSync(extractRoot, { recursive: true });
    execFileSync("tar", ["-xzf", tarball, "-C", extractRoot], { stdio: "inherit" });
    packageDir = path.join(extractRoot, "package");
  }

  // ---- S2: package.json の name / version が repo と一致する ----
  if (packageDir && fs.existsSync(path.join(packageDir, "package.json"))) {
    manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
    const local = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    const same = manifest.name === local.name && manifest.version === local.version;
    record("S2 name / version が repo の package.json と一致する", same, manifest.name + "@" + manifest.version);
  } else {
    record("S2 name / version が repo の package.json と一致する", false, "package/package.json を読めません");
  }

  // ---- S3: README.md と README.ja.md が同梱される ----
  if (packageDir) {
    const absent = ["README.md", "README.ja.md"].filter((name) => !fs.existsSync(path.join(packageDir, name)));
    record("S3 README.md と README.ja.md がともに同梱される", absent.length === 0, absent.join(",") || "ok");
  } else {
    record("S3 README.md と README.ja.md がともに同梱される", false, "展開できていません");
  }

  // ---- S4: exports / main / module / types の指す先が実在する ----
  if (packageDir && manifest) {
    const targets = collectExportTargets(manifest.exports ?? {}, new Set());
    for (const key of ["main", "module", "types"]) {
      if (typeof manifest[key] === "string") targets.add(manifest[key]);
    }
    const absent = [...targets].filter((target) => !fs.existsSync(path.join(packageDir, target)));
    record(
      "S4 exports / main / module / types の指す先が tarball 内に実在する",
      absent.length === 0,
      absent.join(",") || [...targets].sort().join(","),
    );
  } else {
    record("S4 exports / main / module / types の指す先が tarball 内に実在する", false, "展開できていません");
  }

  // ---- S5: repo 固有 smoke（配布された tarball の中身だけを対象にする） ----
  if (packageDir && manifest) {
    try {
      const stagedPackage = path.join(stageDir, "node_modules", manifest.name);
      fs.mkdirSync(path.dirname(stagedPackage), { recursive: true });
      fs.cpSync(packageDir, stagedPackage, { recursive: true });
      // staging 直下に別名の package.json を置く。これが無いと Node の self-reference
      // （package.json の name で自分自身を解決する機能）が働き、staging ではなく
      // **repo の作業ツリー**が解決されてしまう（実測で検出した。設計 §6.3
      // 「S5 は配布された tarball の中身だけで実行する」を破る経路である）。
      fs.writeFileSync(
        path.join(stageDir, "package.json"),
        JSON.stringify({ name: "cycle2-artifact-smoke-stage", version: "0.0.0", private: true }, null, 2) + "\n",
      );
      const driverPath = path.join(stageDir, "smoke-driver.mjs");
      fs.writeFileSync(driverPath, SMOKE_DRIVER_SOURCE);
      const stdout = execFileSync(process.execPath, [driverPath], { cwd: stageDir, encoding: "utf8" });
      for (const [label, ok, detail] of JSON.parse(stdout)) record(label, ok, detail);
    } catch (error) {
      record("S5 " + REPO + " 固有 smoke", false, error.message);
    }
  } else {
    record("S5 " + REPO + " 固有 smoke", false, "展開できていません");
  }

  // ---- S6: レポート出力 ----
  const failed = checks.filter((check) => !check.ok);
  const lines = [
    "# Cycle 2 artifact smoke report",
    "repo: " + REPO,
    "package: " + (manifest ? manifest.name + "@" + manifest.version : "(unknown)"),
    "node: " + process.version,
    "platform: " + process.platform + "/" + process.arch,
    "artifact-dir: " + artifactDir,
    "tarball: " + (tarball ? path.basename(tarball) : "(none)"),
    "timestamp: " + new Date().toISOString(),
    "",
    ...checks.map((check) => (check.ok ? "PASS " : "FAIL ") + check.label + " — " + check.detail),
    "",
    "result: " + (failed.length === 0 ? "PASS" : "FAIL (" + failed.length + "/" + checks.length + ")"),
  ];
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n") + "\n");
  process.stdout.write(lines.join("\n") + "\n");

  if (failed.length > 0) process.exitCode = 1;
}

main();
