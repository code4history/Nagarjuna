#!/usr/bin/env node
import fs from 'node:fs';

const EXPECTED_ALLOW_BUILDS = Object.freeze({ esbuild: true, fsevents: false });
const FORBIDDEN_KEYS = new Set(['dangerouslyAllowAllBuilds', 'onlyBuiltDependencies']);

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify({ ...payload, exit_code: exitCode })}\n`);
  process.exitCode = exitCode;
}

function decodeUtf8(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new Error('入力はUTF-8でなければなりません');
  }
}

function readFileUtf8(filePath) {
  try {
    return decodeUtf8(fs.readFileSync(filePath));
  } catch (error) {
    if (error instanceof Error && error.message.includes('UTF-8')) throw error;
    throw new Error(`入力ファイルを読めません: ${filePath}`);
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function scalarValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^"(?:[^"\\]|\\.)*"$/.test(raw)) return JSON.parse(raw);
  if (/^'(?:[^']|'')*'$/.test(raw)) return raw.slice(1, -1).replace(/''/g, "'");
  return raw;
}

function parseAllowBuildsYaml(text) {
  const observed = {};
  const unexpected = [];
  const forbidden = [];
  let sawAllowBuilds = false;
  let inAllowBuilds = false;

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.includes('\t')) throw new Error(`YAMLのタブ字下げ: ${index + 1}`);
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const indent = line.match(/^ */u)?.[0].length ?? 0;
    const content = line.slice(indent);
    if (indent !== 0 && indent !== 2) {
      throw new Error(`YAMLの字下げが不正です: ${index + 1}`);
    }

    if (indent === 0) {
      const match = /^([A-Za-z0-9_-]+):(.*)$/u.exec(content);
      if (!match) throw new Error(`YAMLキーが不正です: ${index + 1}`);
      const [, key, rest] = match;
      if (key === 'allowBuilds') {
        if (sawAllowBuilds || rest.trim() !== '') {
          throw new Error(`allowBuildsの定義が不正です: ${index + 1}`);
        }
        sawAllowBuilds = true;
        inAllowBuilds = true;
      } else {
        inAllowBuilds = false;
        if (FORBIDDEN_KEYS.has(key)) forbidden.push(key);
        else unexpected.push(key);
      }
      continue;
    }

    if (!inAllowBuilds) throw new Error(`allowBuilds外の子キーです: ${index + 1}`);
    const match = /^([A-Za-z0-9_-]+):(?:[ ]*)(.*)$/u.exec(content);
    if (!match) throw new Error(`allowBuildsの子キーが不正です: ${index + 1}`);
    const [, key, rawValue] = match;
    if (Object.hasOwn(observed, key)) {
      throw new Error(`重複キーです: ${key}`);
    }
    observed[key] = scalarValue(rawValue);
  }

  const expectedKeys = Object.keys(EXPECTED_ALLOW_BUILDS);
  const observedKeys = Object.keys(observed);
  const unexpectedKeys = uniqueSorted([
    ...unexpected,
    ...observedKeys.filter((key) => !Object.hasOwn(EXPECTED_ALLOW_BUILDS, key)),
  ]);
  const missingKeys = uniqueSorted(expectedKeys.filter((key) => !Object.hasOwn(observed, key)));
  const valueMismatches = expectedKeys
    .filter((key) => Object.hasOwn(observed, key)
      && (typeof observed[key] !== 'boolean' || observed[key] !== EXPECTED_ALLOW_BUILDS[key]))
    .map((key) => ({
      key,
      expected: EXPECTED_ALLOW_BUILDS[key],
      observed: observed[key],
    }));

  if (!sawAllowBuilds) {
    for (const key of expectedKeys) {
      if (!missingKeys.includes(key)) missingKeys.push(key);
    }
    missingKeys.sort((a, b) => a.localeCompare(b));
  }

  const exitCode = unexpectedKeys.length || missingKeys.length || valueMismatches.length || forbidden.length ? 1 : 0;
  return {
    mode: 'allowBuilds',
    observed,
    expected: EXPECTED_ALLOW_BUILDS,
    unexpected_keys: unexpectedKeys,
    missing_keys: missingKeys,
    value_mismatches: valueMismatches,
    forbidden_keys: uniqueSorted(forbidden),
    exit_code: exitCode,
  };
}

function parsePackageSet(text) {
  const observed = [];
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const name = rawLine.trim();
    if (name === '') continue;
    if (/\s/u.test(name)) throw new Error(`package名に空白があります: ${index + 1}`);
    observed.push(name);
  }
  return uniqueSorted(observed);
}

function parseExpected(csv) {
  if (csv === '') return [];
  const names = csv.split(',');
  if (names.some((name) => name === '' || /\s/u.test(name))) {
    throw new Error('expectedに不正なpackage名があります');
  }
  return uniqueSorted(names);
}

function runAllowBuilds(filePath) {
  return parseAllowBuildsYaml(readFileUtf8(filePath));
}

function runExpected(csv) {
  let input;
  try {
    input = decodeUtf8(fs.readFileSync(0));
  } catch (error) {
    if (error instanceof Error && error.message.includes('UTF-8')) throw error;
    throw new Error('標準入力を読めません');
  }
  const expected = parseExpected(csv);
  const observed = parsePackageSet(input);
  const unexpected = observed.filter((name) => !expected.includes(name));
  const missing = expected.filter((name) => !observed.includes(name));
  const exitCode = unexpected.length || missing.length ? 1 : 0;
  return { observed, expected, unexpected, missing, exit_code: exitCode };
}

try {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--allow-builds-file' && args[1] !== '') {
    const result = runAllowBuilds(args[1]);
    emit(result, result.exit_code);
  } else if (args.length === 2 && args[0] === '--expected') {
    const result = runExpected(args[1]);
    emit(result, result.exit_code);
  } else {
    throw new Error('使い方: --allow-builds-file <path> または --expected <csv>');
  }
} catch (error) {
  emit({ error: error instanceof Error ? error.message : String(error) }, 2);
}

