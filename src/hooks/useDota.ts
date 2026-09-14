import { useEffect, useMemo, useState } from 'react';
import type { Hero, ItemConstant, ItemPopularity, Matchup } from '../types';
import {
  buildItemIndex,
  fetchHeroes,
  fetchItemConstants,
  fetchItemPopularity,
  fetchMatchups,
} from '../api/opendota';
import { loadStats, type StatsSnapshot } from '../api/stats';

export interface Async<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useHeroes(): Async<Hero[]> {
  const [state, setState] = useState<Async<Hero[]>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    fetchHeroes()
      .then((heroes) => {
        if (!alive) return;
        const sorted = [...heroes].sort((a, b) => a.localized_name.localeCompare(b.localized_name));
        setState({ data: sorted, loading: false, error: null });
      })
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** Матчапы для каждого выбранного врага. Подгружаются по мере добавления героев. */
export function useMatchups(enemyIds: number[]): Async<Map<number, Matchup[]>> {
  const [store, setStore] = useState<Map<number, Matchup[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = enemyIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',').map(Number) : [];
    const missing = ids.filter((id) => !store.has(id));
    if (missing.length === 0) return;

    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all(missing.map((id) => fetchMatchups(id).then((m) => [id, m] as const)))
      .then((pairs) => {
        if (!alive) return;
        setStore((prev) => {
          const next = new Map(prev);
          for (const [id, m] of pairs) next.set(id, m);
          return next;
        });
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
    // store намеренно не в зависимостях: он меняется этим же эффектом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const data = useMemo(() => {
    const ids = key ? key.split(',').map(Number) : [];
    const map = new Map<number, Matchup[]>();
    for (const id of ids) {
      const m = store.get(id);
      if (m) map.set(id, m);
    }
    return map;
  }, [key, store]);

  return { data, loading, error };
}

/** Константы предметов + индекс по id. Грузятся один раз на сессию. */
export function useItemConstants(): Async<{
  byKey: Record<string, ItemConstant>;
  byId: Map<number, { key: string; item: ItemConstant }>;
}> {
  const [state, setState] = useState<Async<{
    byKey: Record<string, ItemConstant>;
    byId: Map<number, { key: string; item: ItemConstant }>;
  }>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    fetchItemConstants()
      .then((byKey) => {
        if (!alive) return;
        setState({ data: { byKey, byId: buildItemIndex(byKey) }, loading: false, error: null });
      })
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function useItemPopularity(heroId: number | null): Async<ItemPopularity> {
  const [state, setState] = useState<Async<ItemPopularity>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (heroId === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let alive = true;
    setState({ data: null, loading: true, error: null });
    fetchItemPopularity(heroId)
      .then((d) => alive && setState({ data: d, loading: false, error: null }))
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => {
      alive = false;
    };
  }, [heroId]);

  return state;
}

/**
 * Свой снапшот статистики. Его может не быть (репозиторий без собранных данных) —
 * тогда приложение работает на матчапах OpenDota, просто менее точно.
 */
export function useStats(): StatsSnapshot | null {
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  useEffect(() => {
    let alive = true;
    loadStats().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}
