import { useMemo, useState } from 'react';
import type { Bracket, Hero } from '../types';
import { heroImg } from '../api/opendota';
import { baseWinrate, pickCount } from '../lib/score';
import { HeroBuild } from './HeroBuild';

interface Props {
  heroes: Hero[];
  bracket: Bracket | 'all';
  /** Вражеский драфт из вкладки «Драфт» — можно наложить на любой билд. */
  enemies: Hero[];
}

export function BuildsTab({ heroes, bracket, enemies }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Hero | null>(null);
  const [useDraft, setUseDraft] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? heroes.filter((h) => h.localized_name.toLowerCase().includes(q))
      : [...heroes].sort((a, b) => pickCount(b, bracket) - pickCount(a, bracket));
    return list;
  }, [heroes, query, bracket]);

  if (selected) {
    return (
      <div className="tab">
        <button className="btn-ghost" onClick={() => setSelected(null)}>
          ← Все герои
        </button>
        <div className="hero-header">
          <img src={heroImg(selected)} alt={selected.localized_name} />
          <div>
            <h2>{selected.localized_name}</h2>
            <p className="muted small">
              {selected.roles.join(' · ')} · винрейт {baseWinrate(selected, bracket).toFixed(1)}%
            </p>
          </div>
        </div>

        {enemies.length > 0 && (
          <label className="toggle">
            <input type="checkbox" checked={useDraft} onChange={(e) => setUseDraft(e.target.checked)} />
            Учитывать драфт соперника ({enemies.map((e) => e.localized_name).join(', ')})
          </label>
        )}

        <HeroBuild hero={selected} enemies={useDraft ? enemies : []} />
      </div>
    );
  }

  return (
    <div className="tab">
      <input
        className="search"
        placeholder="Поиск героя…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="hero-grid">
        {filtered.map((hero) => (
          <button key={hero.id} className="hero-cell" onClick={() => setSelected(hero)}>
            <img src={heroImg(hero)} alt={hero.localized_name} loading="lazy" />
            <span>{hero.localized_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
