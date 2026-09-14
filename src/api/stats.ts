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
  /** Что собирали ПРОТИВ героя те, кто выиграл: vsItems[heroId] */
  vsItems?: Record<string, { games: number; items: Record<string, number> }>;
}

/** Ниже этих порогов сравнивать частоты бессмысленно — слишком мало данных. */
const MIN_VS_GAMES = 200;
const MIN_VS_ITEM = 15;

export interface CounterItemStat {
  id: number;
  /** На сколько процентов предмет встречается чаще обычного против этих героев. */
  rate: number;
  /** Против кого из выбранных врагов предмет особенно частый. */
  against: string[];
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

/**
 * Топ предметов, которые собирали победители против этих героев.
 *
 * Сырая частота бесполезна: Blink и Power Treads берут против всех подряд.
 * Поэтому считаем, во сколько раз предмет встречается чаще обычного —
 * так против Riki всплывает Dust, а против PA — Monkey King Bar.
 */
export function counterItemsOf(
  stats: StatsSnapshot | null,
  enemies: { id: number; name: string }[],
  limit = 12,
): CounterItemStat[] {
  if (!stats?.vsItems || enemies.length === 0) return [];

  // Базовая частота предмета у победителей вообще, по всем героям.
  const baseCount = new Map<number, number>();
  let baseGames = 0;
  for (const entry of Object.values(stats.vsItems)) {
    baseGames += entry.games;
    for (const [id, count] of Object.entries(entry.items)) {
      baseCount.set(Number(id), (baseCount.get(Number(id)) ?? 0) + count);
    }
  }
  if (baseGames === 0) return [];

  const totals = new Map<number, { sum: number; against: { name: string; lift: number }[] }>();
  let covered = 0;

  for (const enemy of enemies) {
    const entry = stats.vsItems[enemy.id];
    if (!entry || entry.games < MIN_VS_GAMES) continue;
    covered += 1;
    for (const [id, count] of Object.entries(entry.items)) {
      const itemId = Number(id);
      const rate = (count / entry.games) * 100;
      const base = ((baseCount.get(itemId) ?? 0) / baseGames) * 100;
      if (base <= 0 || count < MIN_VS_ITEM) continue;
      const lift = rate / base;
      const acc = totals.get(itemId) ?? { sum: 0, against: [] };
      acc.sum += lift;
      acc.against.push({ name: enemy.name, lift });
      totals.set(itemId, acc);
    }
  }
  if (covered === 0) return [];

  return [...totals.entries()]
    .map(([id, acc]) => {
      const lift = acc.sum / covered;
      const notable = acc.against
        .filter((a) => a.lift > 1.3)
        .sort((a, b) => b.lift - a.lift)
        .slice(0, 2)
        .map((a) => a.name);
      return { id, rate: (lift - 1) * 100, against: notable };
    })
    // Берём только то, что заметно выше обычного — иначе это просто популярный предмет.
    .filter((c) => c.rate > 15)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit);
}
