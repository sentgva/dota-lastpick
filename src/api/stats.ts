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
  /** items[heroId][itemId] = [матчей с предметом, побед с ним] */
  items?: Record<string, Record<string, [number, number]>>;
}

export interface ItemStat {
  id: number;
  games: number;
  wins: number;
  /** Доля матчей героя, в которых предмет оказался в инвентаре, %. */
  pickRate: number;
  winrate: number;
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

/**
 * Финальные предметы героя по нашим данным, от самых частых.
 * Steam отдаёт инвентарь на конец матча, поэтому это именно ядро сборки,
 * а не порядок покупки.
 */
export function itemsOf(stats: StatsSnapshot | null, heroId: number): ItemStat[] {
  const row = stats?.items?.[heroId];
  if (!row) return [];
  const list = Object.entries(row).map(([id, [games, wins]]) => ({ id: Number(id), games, wins }));
  const heroGames = Math.max(...list.map((x) => x.games), 1);
  return list
    .map((x) => ({
      ...x,
      pickRate: (x.games / heroGames) * 100,
      winrate: x.games > 0 ? (x.wins / x.games) * 100 : 0,
    }))
    .sort((a, b) => b.games - a.games);
}
