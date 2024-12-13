import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

describe('Dictionary Loader', () => {
  it.skip('should be able to read dictionary files', () => {
    const dataPath = path.join(rootDir, 'data');
    const files = ['hentaigana.txt', 'siddham.txt', 'itaiji.txt', 'kumimoji.txt'];
    
    files.forEach(file => {
      const filePath = path.join(dataPath, file);
      expect(() => fs.readFileSync(filePath, 'utf-8')).not.toThrow();
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBeTruthy();
    });
  });
});