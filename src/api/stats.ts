/**
 * Собственный снапшот статистики (public/stats.json), который считает
 * scripts/collect.mjs по сырым публичным матчам из Steam Web API.
 *
 * Зачем он вообще: матчапы OpenDota строятся по распарсенным матчам — на пару
 * героев там 20–120 игр. Здесь счёт идёт на сотни и тысячи, и появляется
 * синергия пар, которой у OpenDota нет вообще.
 */

export interface StatsSnapshot {
  version: number;
  updated: string | null;
  matches: number;
  /** matchup[a][b] = [игр, побед a] */
  matchup: Record<string, Record<string, [number, number]>>;
  /** synergy[a][b] = [игр вместе, побед вместе] */
  synergy: Record<string, Record<string, [number, number]>>;
}

let cache: Promise<StatsSnapshot | null> | null = null;

/**
 * Снапшот необязателен: если его нет или он не загрузился, приложение
 * работает на данных OpenDota, просто с худшей точностью.
 */
export function loadStats(): Promise<StatsSnapshot | null> {
  if (cache) return cache;
  cache = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}stats.json`, { cache: 'default' });
      if (!res.ok) return null;
      const data = (await res.json()) as StatsSnapshot;
      return data?.matchup ? data : null;
    } catch {
      return null;
    }
  })();
  return cache;
}

/** Победы и игры героя a против героя b. */
export function matchupOf(
  stats: StatsSnapshot | null,
  a: number,
  b: number,
): { games: number; wins: number } | null {
  const cell = stats?.matchup?.[a]?.[b];
  return cell ? { games: cell[0], wins: cell[1] } : null;
}

/** Победы и игры героев a и b в одной команде. */
export function synergyOf(
  stats: StatsSnapshot | null,
  a: number,
  b: number,
): { games: number; wins: number } | null {
  const cell = stats?.synergy?.[a]?.[b];
  return cell ? { games: cell[0], wins: cell[1] } : null;
}
