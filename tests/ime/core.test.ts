import { describe, it, expect, beforeEach } from 'vitest';
import { IMECore } from '@/lib/ime/core';
import { IMEEntry, IMEError } from '@/lib/ime/types';

describe('IMECore', () => {
  let ime: IMECore;
  const testDictionary: IMEEntry[] = [
    { reading: 'あ', char: '𛀂', type: 'hentaigana' },
    { reading: 'あ', char: '𛀃', type: 'hentaigana' },
    { reading: 'あ', char: '𑖀', type: 'siddham' },
    { reading: 'とき', char: '旹', type: 'itaiji' }
  ];

  beforeEach(() => {
    ime = new IMECore({
      enabledTypes: {
        hentaigana: true,
        siddham: true,
        itaiji: true
      }
    });
    ime.setDictionary(testDictionary);
  });

  it('should find candidates with prefix matching', () => {
    const results = ime.search('あ');
    expect(results).toHaveLength(3);
    expect(results.map(r => r.char)).toContain('𛀂');
    expect(results.map(r => r.char)).toContain('𛀃');
    expect(results.map(r => r.char)).toContain('𑖀');
  });

  it('should find exact matches', () => {
    const results = ime.searchExact('とき');
    expect(results).toHaveLength(1);
    expect(results[0].char).toBe('旹');
  });

  it('should filter by enabled types', () => {
    ime.updateOptions({
      enabledTypes: {
        hentaigana: true,
        siddham: false,
        itaiji: false
      }
    });

    const results = ime.search('あ');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.type === 'hentaigana')).toBe(true);
  });

  it('should validate hiragana input', () => {
    expect(() => ime.search('abc')).toThrow(IMEError);
    expect(() => ime.search('漢字')).toThrow(IMEError);
  });

  it('should return empty array for empty input', () => {
    expect(ime.search('')).toHaveLength(0);
    expect(ime.searchExact('')).toHaveLength(0);
  });
});