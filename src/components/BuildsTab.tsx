import { useMemo, useState } from 'react';
import type { Bracket, Hero } from '../types';
import { heroImg } from '../api/opendota';
import { baseWinrate, pickCount } from '../lib/score';
import { HeroBuild } from './HeroBuild';
import { POSITION_LABEL, playsPosition, positionsOf, type Position } from '../data/positions';
import { shortName } from '../data/synergy';

interface Props {
  heroes: Hero[];
  bracket: Bracket | 'all';
  /** Вражеский драфт из вкладки «Драфт» — можно наложить на любой билд. */
  enemies: Hero[];
}

const POSITIONS: Position[] = [1, 2, 3, 4, 5];

export function BuildsTab({ heroes, bracket, enemies }: Props) {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [selected, setSelected] = useState<Hero | null>(null);
  const [useDraft, setUseDraft] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = heroes;
    if (q) list = list.filter((h) => h.localized_name.toLowerCase().includes(q));
    // Герой обычно играет на нескольких позициях, поэтому это фильтр, а не разбиение.
    if (position) list = list.filter((h) => playsPosition(shortName(h.name), position));
    return [...list].sort((a, b) => pickCount(b, bracket) - pickCount(a, bracket));
  }, [heroes, query, position, bracket]);

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
            <p>{positionLabels(selected.name) || selected.roles.join(' · ')}</p>
            <p>
              винрейт <b>{baseWinrate(selected, bracket).toFixed(1)}%</b>
            </p>
          </div>
        </div>

        {enemies.length > 0 && (
          <label className="toggle">
            <input type="checkbox" checked={useDraft} onChange={(e) => setUseDraft(e.target.checked)} />
            <span>
              Учитывать драфт соперника
              <br />
              <span className="muted small">{enemies.map((e) => e.localized_name).join(', ')}</span>
            </span>
          </label>
        )}

        <HeroBuild hero={selected} enemies={useDraft ? enemies : []} />
      </div>
    );
  }

  return (
    <div className="tab">
      <div className="search-bar">
        <input
          className="search"
          placeholder="Поиск героя"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips">
        <button className={`chip${position === null ? ' is-on' : ''}`} onClick={() => setPosition(null)}>
          Все
        </button>
        {POSITIONS.map((p) => (
          <button
            key={p}
            className={`chip${position === p ? ' is-on' : ''}`}
            onClick={() => setPosition(position === p ? null : p)}
          >
            {POSITION_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="list-hint">
        {position ? `${POSITION_LABEL[position]} · ${filtered.length}` : `по популярности · ${filtered.length} героев`}
      </div>

      <div className="hero-grid">
        {filtered.map((hero) => (
          <button key={hero.id} className="hero-cell" onClick={() => setSelected(hero)}>
            <img src={heroImg(hero)} alt={hero.localized_name} loading="lazy" />
            <span>{hero.localized_name}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="muted">Ничего не найдено</p>}
    </div>
  );
}

/** «Керри · Мид» вместо ролей OpenDota, если позиция героя известна. */
function positionLabels(heroName: string): string {
  return positionsOf(shortName(heroName))
    .map((p) => POSITION_LABEL[p])
    .join(' · ');
}
