import type { ItemConstant } from '../types';

/**
 * Отделяет «целые» предметы от компонентов.
 *
 * Критерий: предмет собирается из чего-то (`components` не пуст) и сам не помечен
 * как component/consumable. Это отсекает и палочки с циркletами, и дорогие
 * компоненты вроде Ultimate Orb (2800) или Broadsword (1000) — по цене их
 * отличить нельзя.
 */
const EXCEPTIONS = new Set([
  // Valve помечает Blink Dagger как component, хотя это законченный предмет.
  'blink',
]);

export function isWholeItem(key: string, item: ItemConstant | undefined): boolean {
  if (!item || key.startsWith('recipe_')) return false;
  if (EXCEPTIONS.has(key)) return true;
  if (item.qual === 'component' || item.qual?.startsWith('consumable')) return false;
  return Boolean(item.components?.length);
}
