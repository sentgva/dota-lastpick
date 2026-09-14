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

/** Роли OpenDota в порядке полезности для драфта. */
const ROLES = ['Carry', 'Support', 'Initiator', 'Disabler', 'Nuker', 'Durable', 'Escape', 'Pusher', 'Jungler'];

export function BuildsTab({ heroes, bracket, enemies }: Props) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Hero | null>(null);
  const [useDraft, setUseDraft] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = heroes;
    if (q) list = list.filter((h) => h.localized_name.toLowerCase().includes(q));
    // Герой обычно попадает в несколько ролей, поэтому это фильтр, а не разбиение.
    if (role) list = list.filter((h) => h.roles.includes(role));
    return [...list].sort((a, b) => pickCount(b, bracket) - pickCount(a, bracket));
  }, [heroes, query, role, bracket]);

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
            <p>{selected.roles.join(' · ')}</p>
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
      <input
        className="search"
        placeholder="Поиск героя"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="role-chips">
        <button className={`chip${role === null ? ' is-on' : ''}`} onClick={() => setRole(null)}>
          Все
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            className={`chip${role === r ? ' is-on' : ''}`}
            onClick={() => setRole(role === r ? null : r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="picker-hint" style={{ padding: '0 0 8px' }}>
        {role ? `${role} · ${filtered.length}` : `по популярности · ${filtered.length} героев`}
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
