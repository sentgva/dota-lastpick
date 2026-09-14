import type { Hero, ItemConstant, ItemPopularity, Matchup } from '../types';
import { readCache, writeCache } from './cache';

const BASE = 'https://api.opendota.com/api';
export const CDN = 'https://cdn.cloudflare.steamstatic.com';

const HOUR = 3600_000;
const TTL = {
  heroes: 24 * HOUR,
  matchups: 12 * HOUR,
  items: 12 * HOUR,
  constants: 7 * 24 * HOUR,
};

/**
 * OpenDota отдаёт Access-Control-Allow-Origin: *, поэтому ходим из браузера
 * напрямую. Ключ API опционален: с ним лимиты выше.
 */
const API_KEY = import.meta.env.VITE_OPENDOTA_KEY as string | undefined;

/** Одновременные запросы к одному и тому же URL схлопываются в один. */
const inflight = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get<T>(path: string, cacheKey: string, ttl: number): Promise<T> {
  const cached = readCache<T>(cacheKey, ttl);
  if (cached !== null) return cached;

  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<T>;

  const url = new URL(BASE + path);
  if (API_KEY) url.searchParams.set('api_key', API_KEY);

  const p = (async () => {
    // 5xx у OpenDota (в том числе 522 от Cloudflare) бывают короткими — пробуем ещё раз.
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(600 * 2 ** (attempt - 1));
      let res: Response;
      try {
        res = await fetch(url.toString());
      } catch {
        lastError = new Error('Нет связи с OpenDota — проверьте интернет');
        continue;
      }
      if (res.ok) {
        const data = (await res.json()) as T;
        writeCache(cacheKey, data);
        return data;
      }
      if (res.status === 429) {
        throw new Error('OpenDota: превышен лимит запросов, попробуйте через минуту');
      }
      lastError = new Error(
        res.status >= 500
          ? `OpenDota временно недоступен (${res.status})`
          : `OpenDota вернул ${res.status}`,
      );
      if (res.status < 500) break;
    }
    throw lastError ?? new Error('OpenDota недоступен');
  })().finally(() => inflight.delete(cacheKey));

  inflight.set(cacheKey, p);
  return p;
}

export function fetchHeroes(): Promise<Hero[]> {
  return get<Hero[]>('/heroStats', 'heroStats', TTL.heroes);
}

export function fetchMatchups(heroId: number): Promise<Matchup[]> {
  return get<Matchup[]>(`/heroes/${heroId}/matchups`, `matchups:${heroId}`, TTL.matchups);
}

export function fetchItemPopularity(heroId: number): Promise<ItemPopularity> {
  return get<ItemPopularity>(`/heroes/${heroId}/itemPopularity`, `items:${heroId}`, TTL.items);
}

/** /api/constants/items — словарь item_name -> описание, нужен для иконок и названий. */
export function fetchItemConstants(): Promise<Record<string, ItemConstant>> {
  return get<Record<string, ItemConstant>>('/constants/items', 'const:items', TTL.constants);
}

/** Обратный индекс: item id -> ключ в constants/items (itemPopularity отдаёт id). */
export function buildItemIndex(items: Record<string, ItemConstant>): Map<number, { key: string; item: ItemConstant }> {
  const idx = new Map<number, { key: string; item: ItemConstant }>();
  for (const [key, item] of Object.entries(items)) {
    if (typeof item?.id === 'number') idx.set(item.id, { key, item });
  }
  return idx;
}

export function heroImg(hero: Hero): string {
  return CDN + hero.img;
}

export function itemImg(item: ItemConstant): string {
  return item.img.startsWith('http') ? item.img : CDN + item.img;
}
