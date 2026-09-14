import { useMemo, useState } from 'react';
import type { Bracket, Hero } from '../types';
import { heroImg, heroRender } from '../api/opendota';
import { baseWinrate, pickCount } from '../lib/score';
import { HeroBuild } from './HeroBuild';
import { POSITION_LABEL, playsPosition, positionLabelsOf, type Position } from '../data/positions';
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
      <div className="tab hero-page">
        {/* Рендер в полный рост — крупный файл, поэтому грузится лениво
            и проявляется плавно: страница читается сразу. */}
        <img
          className="hero-bg"
          src={heroRender(selected)}
          alt=""
          loading="lazy"
          onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
        />
        <button className="btn-ghost" onClick={() => setSelected(null)}>
          ← All Heroes
        </button>
        <div className="hero-header">
          <img src={heroImg(selected)} alt={selected.localized_name} />
          <div>
            <h2>{selected.localized_name}</h2>
            <p>{positionLabelsOf(selected.name)}</p>
            <p>
              Win rate <b>{baseWinrate(selected, bracket).toFixed(1)}%</b>
            </p>
          </div>
        </div>

        {enemies.length > 0 && (
          <label className="toggle">
            <input type="checkbox" checked={useDraft} onChange={(e) => setUseDraft(e.target.checked)} />
            <span>
              Account for enemy draft
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
          placeholder="Search hero"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips">
        <button className={`chip${position === null ? ' is-on' : ''}`} onClick={() => setPosition(null)}>
          All
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
        {position ? `${POSITION_LABEL[position]} · ${filtered.length}` : `By Popularity · ${filtered.length} heroes`}
      </div>

      <div className="hero-grid">
        {filtered.map((hero) => (
          <button key={hero.id} className="hero-cell" onClick={() => setSelected(hero)}>
            <img src={heroImg(hero)} alt={hero.localized_name} loading="lazy" />
            <span>{hero.localized_name}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="muted">No heroes found</p>}
    </div>
  );
}
