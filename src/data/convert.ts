import { IMEEntry } from '../lib/ime/internal-types';
import { dictionary } from './dictionary';

export function getDictionary(): IMEEntry[] {
  return dictionary;
}