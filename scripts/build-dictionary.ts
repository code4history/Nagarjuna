import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { IMEType } from '../src/lib/ime/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawEntry {
  reading: string;
  character: string;
  type: string;
  description: string;
}

interface DictionaryFileConfig {
  filename: string;
  type: IMEType;
  requirements?: IMEType[];
}

const DICTIONARY_FILES: DictionaryFileConfig[] = [
  {
    filename: 'hentai_kana_IME.txt',
    type: 'hentaigana'
  },
  {
    filename: 'kanji_itaiji_IME.txt',
    type: 'itaiji'
  },
  {
    filename: 'kumimoji_IME.txt',
    type: 'itaiji'
  },
  {
    filename: 'siddham_phonetic_IME.txt',
    type: 'siddham'
  },
  {
    filename: 'siddham_buddha_IME.txt',
    type: 'siddham',
    requirements: ['buddha_name']
  }
];

function parseDictionaryFile(filePath: string): RawEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [reading, character, type, description] = line.split('\t');
      return { reading, character, type, description };
    });
}

function shouldIncludeEntry(config: DictionaryFileConfig, entry: RawEntry): boolean {
  // requirementsがない場合は常に含める
  if (!config.requirements) return true;

  // requirementsがある場合は、エントリーの種類に応じて判断
  // ここでは単純化のため、常にtrueを返していますが、
  // 必要に応じて追加のロジックを実装できます
  return true;
}

function generateTypeScriptCode(entries: RawEntry[]): string {
  const processedEntries = entries.map(entry => ({
    reading: entry.reading,
    char: entry.character,
    type: entry.type
  }));

  return `// このファイルは自動生成されています。直接編集しないでください。
import { IMEEntry } from '../lib/ime/types';

export const dictionary: IMEEntry[] = ${JSON.stringify(processedEntries, null, 2)};
`;
}

// ファイルパスの設定
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const outputDir = path.join(rootDir, 'src', 'data');

// メイン処理
const entries: RawEntry[] = [];

for (const config of DICTIONARY_FILES) {
  const filePath = path.join(dataDir, config.filename);
  const fileEntries = parseDictionaryFile(filePath);
  
  // 要件に合致するエントリーのみを追加
  fileEntries
    .filter(entry => shouldIncludeEntry(config, entry))
    .forEach(entry => {
      entries.push({
        ...entry,
        type: config.type
      });
    });
}

// 出力ディレクトリが存在しない場合は作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ファイルの出力
const code = generateTypeScriptCode(entries);
fs.writeFileSync(path.join(outputDir, 'dictionary.ts'), code);
console.log('Dictionary file has been generated successfully.');