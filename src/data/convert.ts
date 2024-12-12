import { IMEEntry } from '../lib/ime/types';
import { dictionary } from './dictionary';

export function getDictionary(): IMEEntry[] {
  return dictionary;
}