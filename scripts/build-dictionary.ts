import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawEntry {
  reading: string;
  character: string;
  type: string;
  description: string;
}

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

function generateTypeScriptCode(
  hentaigana: RawEntry[],
  siddham: RawEntry[],
  itaiji: RawEntry[],
  kumimoji: RawEntry[]
): string {
  const entries = [
    ...hentaigana.map(e => ({ ...e, imeType: 'hentaigana' })),
    ...siddham.map(e => ({ ...e, imeType: 'siddham' })),
    ...itaiji.map(e => ({ ...e, imeType: 'itaiji' })),
    ...kumimoji.map(e => ({ ...e, imeType: 'itaiji' }))
  ];

  return `// このファイルは自動生成されています。直接編集しないでください。
import { IMEEntry } from '../lib/ime/types';

export const dictionary: IMEEntry[] = ${JSON.stringify(entries.map(e => ({
    reading: e.reading,
    char: e.character,
    type: e.imeType
  })), null, 2)};
`;
}

// ファイルパスの設定
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const outputDir = path.join(rootDir, 'src', 'data');

// データファイルの読み込み
const hentaigana = parseDictionaryFile(path.join(dataDir, 'hentaigana.txt'));
const siddham = parseDictionaryFile(path.join(dataDir, 'siddham.txt'));
const itaiji = parseDictionaryFile(path.join(dataDir, 'itaiji.txt'));
const kumimoji = parseDictionaryFile(path.join(dataDir, 'kumimoji.txt'));

// TypeScriptコードの生成
const code = generateTypeScriptCode(hentaigana, siddham, itaiji, kumimoji);

// 出力ディレクトリが存在しない場合は作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ファイルの出力
fs.writeFileSync(path.join(outputDir, 'dictionary.ts'), code);
console.log('Dictionary file has been generated successfully.');