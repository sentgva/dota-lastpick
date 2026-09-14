import { useState } from 'react';
import type { Hero, Suggestion } from '../types';
import { heroImg } from '../api/opendota';
import { HeroBuild } from './HeroBuild';

interface Props {
  suggestion: Suggestion;
  rank: number;
  enemies: Hero[];
}

export function SuggestionCard({ suggestion, rank, enemies }: Props) {
  const [open, setOpen] = useState(false);
  const { hero, score, counterScore, synergyScore, metaScore, counters, synergies, roleNote } = suggestion;

  return (
    <div className="card">
      <button className="card-head" onClick={() => setOpen((v) => !v)}>
        <span className="rank">{rank}</span>
        <img src={heroImg(hero)} alt={hero.localized_name} />
        <span className="card-title">
          <strong>{hero.localized_name}</strong>
          <span className="muted small">{hero.roles.slice(0, 3).join(' · ')}</span>
        </span>
        <span className={`score ${score >= 0 ? 'pos' : 'neg'}`}>{fmt(score)}</span>
      </button>

      <div className="bars">
        <Bar label="Контрпик" value={counterScore} />
        <Bar label="Синергия" value={synergyScore} />
        <Bar label="Мета" value={metaScore} />
      </div>

      {open && (
        <div className="card-body">
          {roleNote && <p className="note">{roleNote}</p>}

          {counters.length > 0 && (
            <>
              <h4>Против кого работает</h4>
              <ul className="breakdown">
                {counters.map((c) => (
                  <li key={c.enemy.id}>
                    <span>{c.enemy.localized_name}</span>
                    <span className={c.advantage >= 0 ? 'pos' : 'neg'}>
                      {c.winrate.toFixed(1)}% · {fmt(c.advantage)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {synergies.length > 0 && (
            <>
              <h4>Комбо с союзниками</h4>
              <ul className="breakdown">
                {synergies.map((s) => (
                  <li key={s.ally.id}>
                    <span>{s.ally.localized_name}</span>
                    <span className="muted small">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <HeroBuild hero={hero} enemies={enemies} />
        </div>
      )}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  // Шкала подобрана под типичный разброс: ±8 покрывает почти все значения.
  const width = Math.min(100, Math.abs(value) * 12.5);
  return (
    <div className="bar">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div
          className={`bar-fill ${value >= 0 ? 'pos' : 'neg'}`}
          style={{ width: `${width}%`, marginLeft: value >= 0 ? '50%' : `${50 - width}%` }}
        />
      </div>
      <span className={`bar-value ${value >= 0 ? 'pos' : 'neg'}`}>{fmt(value)}</span>
    </div>
  );
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2);
}
