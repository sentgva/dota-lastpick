import { useMemo, useState } from 'react';
import type { Bracket, Hero } from '../types';
import { heroImg } from '../api/opendota';
import { pickCount } from '../lib/score';
import { haptic } from '../telegram';

interface Props {
  heroes: Hero[];
  /** Герои, уже занятые в драфте — их нельзя выбрать повторно. */
  disabledIds: Set<number>;
  bracket: Bracket | 'all';
  title: string;
  onPick(hero: Hero): void;
  onClose(): void;
}

export function HeroPicker({ heroes, disabledIds, bracket, title, onPick, onClose }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? heroes.filter(
          (h) =>
            h.localized_name.toLowerCase().includes(q) ||
            h.name.replace('npc_dota_hero_', '').includes(q),
        )
      : heroes;
    // Без запроса удобнее видеть популярных героев первыми.
    return q ? list : [...list].sort((a, b) => pickCount(b, bracket) - pickCount(a, bracket));
  }, [heroes, query, bracket]);

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <strong>{title}</strong>
          <button className="btn-ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <input
          className="search"
          autoFocus
          placeholder="Поиск героя…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="hero-grid">
          {filtered.map((hero) => {
            const disabled = disabledIds.has(hero.id);
            return (
              <button
                key={hero.id}
                className={`hero-cell${disabled ? ' is-disabled' : ''}`}
                disabled={disabled}
                onClick={() => {
                  haptic('select');
                  onPick(hero);
                }}
              >
                <img src={heroImg(hero)} alt={hero.localized_name} loading="lazy" />
                <span>{hero.localized_name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="muted">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  );
}
