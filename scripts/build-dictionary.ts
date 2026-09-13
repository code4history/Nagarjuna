import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { IMEType } from '../src/lib/ime/internal-types';
import type { NagaCategoryId } from '../src/lib/ime/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`isPackageBuild_Dic: ${process.env.BUILD_MODE}`);

const DAKUTEN = '\u3099';
const HANDAKUTEN = '\u309A';

const DAKUTEN_CANDIDATES = ['か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'は', 'ひ', 'ふ', 'へ', 'ほ'];
const HANDAKUTEN_CANDIDATES = ['は', 'ひ', 'ふ', 'へ', 'ほ'];

interface RawEntry {
  reading: string;
  character: string;
  type: string;
  description: string;
  isBuddhaName: boolean;
  category?: NagaCategoryId;
}

interface DictionaryFileConfig {
  filename: string;
  type: IMEType;
  isBuddhaName: boolean;
  // NagaIME のタブ（legacy の type とは別に持つ。kumimoji と buddha を分けるため）
  category: NagaCategoryId;
}

const DICTIONARY_FILES: DictionaryFileConfig[] = [
  {
    filename: 'hentai_kana_IME.txt',
    type: 'hentaigana',
    isBuddhaName: false,
    category: 'hentaigana'
  },
  {
    filename: 'kanji_itaiji_IME.txt',
    type: 'itaiji',
    isBuddhaName: false,
    category: 'itaiji'
  },
  {
    filename: 'kumimoji_IME.txt',
    type: 'itaiji',
    isBuddhaName: false,
    category: 'kumimoji'
  },
  {
    filename: 'siddham_phonetic_IME.txt',
    type: 'siddham',
    isBuddhaName: false,
    category: 'siddham'
  },
  {
    filename: 'siddham_buddha_IME.txt',
    type: 'siddham',
    isBuddhaName: true,
    category: 'buddha'
  }
];

function parseDictionaryFile(filePath: string): RawEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [reading, character, type, description] = line.split('\t');
      return { 
        reading, 
        character, 
        type, 
        description,
        isBuddhaName: false  // デフォルト値を設定
      };
    });
}

function addDakutenVariations(entry: RawEntry): RawEntry[] {
  const variations: RawEntry[] = [entry];
  
  if (DAKUTEN_CANDIDATES.includes(entry.reading)) {
    variations.push({
      ...entry,
      reading: getDakutenReading(entry.reading),
      character: entry.character + DAKUTEN,
      description: withMark(entry.description, '濁点')
    });
  }
  
  if (HANDAKUTEN_CANDIDATES.includes(entry.reading)) {
    variations.push({
      ...entry,
      reading: getHandakutenReading(entry.reading),
      character: entry.character + HANDAKUTEN,
      description: withMark(entry.description, '半濁点')
    });
  }
  
  return variations;
}

// NagaIME の説明文検索・表示用。濁点・半濁点付きの派生であることを説明文に足す
function withMark(description: string | undefined, mark: string): string {
  return description ? `${description}（${mark}付き）` : `${mark}付き`;
}

function getDakutenReading(reading: string): string {
  const dakutenMap: { [key: string]: string } = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
    'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ'
  };
  return dakutenMap[reading] || reading;
}

function getHandakutenReading(reading: string): string {
  const handakutenMap: { [key: string]: string } = {
    'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ'
  };
  return handakutenMap[reading] || reading;
}

function generateTypeScriptCode(entries: RawEntry[]): string {
  const processedEntries = entries.map(entry => ({
    reading: entry.reading,
    char: entry.character,
    type: entry.type,
    isBuddhaName: entry.isBuddhaName,
    // 以下は NagaIME 用の追加 field（legacy の IMECore は読まない）
    description: (entry.description ?? '').trim(),
    category: entry.category
  }));
  
  return `// このファイルは自動生成されています。直接編集しないでください。
import { NagaDictionaryEntry } from '../lib/ime/internal-types';

export const dictionary: NagaDictionaryEntry[] = ${JSON.stringify(processedEntries, null, 2)};
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
  
  fileEntries.forEach(entry => {
    const baseEntry = {
      ...entry,
      type: config.type,
      isBuddhaName: config.isBuddhaName,
      category: config.category
    };

    if (config.type === 'hentaigana') {
      // 変体仮名の場合は濁点・半濁点処理を追加
      entries.push(...addDakutenVariations(baseEntry));
    } else {
      entries.push(baseEntry);
    }
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