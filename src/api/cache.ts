/**
 * Кэш поверх localStorage с TTL. Нужен, чтобы уложиться в лимит OpenDota
 * (60 запросов/мин, 2000/сутки без ключа) — матчапы одного героя меняются
 * медленно, так что держим их полсуток.
 */

const PREFIX = 'dlp:';

interface Entry<T> {
  t: number; // timestamp записи
  v: T;
}

export function readCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.t > ttlMs) return null;
    return entry.v;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value } satisfies Entry<T>));
  } catch {
    // Переполнение квоты — чистим свои ключи и молча продолжаем без кэша.
    clearCache();
  }
}

export function clearCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* приватный режим — кэша просто нет */
  }
}
