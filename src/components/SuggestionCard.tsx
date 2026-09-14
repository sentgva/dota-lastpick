import { useState } from 'react';
import type { CounterBreakdown, Hero, Suggestion } from '../types';
import { heroImg } from '../api/opendota';
import { marginOfError, sampleQuality } from '../lib/score';
import { positionLabelsOf } from '../data/positions';
import { HeroBuild } from './HeroBuild';

interface Props {
  suggestion: Suggestion;
  rank: number;
  enemies: Hero[];
}

const QUALITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};

export function SuggestionCard({ suggestion, rank, enemies }: Props) {
  const [open, setOpen] = useState(false);
  const { hero, score, counterScore, synergyScore, metaScore, counterSample, counters, synergies, roleNote } =
    suggestion;

  const quality = sampleQuality(counterSample);

  return (
    <div className="card">
      <button className="card-head" onClick={() => setOpen((v) => !v)}>
        <span className="rank">{rank}</span>
        <img src={heroImg(hero)} alt={hero.localized_name} />
        <span className="card-title">
          <strong>{hero.localized_name}</strong>
          <span>{positionLabelsOf(hero.name)}</span>
        </span>
        <span className={`score ${score >= 0 ? 'pos' : 'neg'}`}>{fmt(score)}</span>
      </button>

      <div className="bars">
        <Bar label="Counter" value={counterScore} quality={quality} />
        <Bar label="Synergy" value={synergyScore} />
        <Bar label="Meta" value={metaScore} />
      </div>

      {open && (
        <div className="card-body">
          {roleNote && <p className="note">{roleNote}</p>}

          {counters.length > 0 && (
            <>
              <h4>Matchups</h4>
              <p className={`sample-note sample-${quality}`}>
                Sample: {counterSample.toLocaleString('en')} games · {QUALITY_LABEL[quality]}
                {quality === 'low' && ' — these numbers are barely distinguishable from noise'}
              </p>
              <ul className="breakdown breakdown-wide">
                {counters.map((c) => (
                  <CounterRow key={c.enemy.id} counter={c} />
                ))}
              </ul>
            </>
          )}

          {synergies.length > 0 && (
            <>
              <h4>Synergy With Allies</h4>
              <ul className="breakdown">
                {synergies.map((s) => (
                  <li key={s.ally.id} className="combo-row">
                    <img src={heroImg(s.ally)} alt="" width={44} height={25} style={{ borderRadius: 4 }} />
                    <span>
                      <strong>{s.ally.localized_name}</strong>
                      <p>{s.reason}</p>
                    </span>
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

/** Строка разбора: винрейт против врага, его погрешность и итоговое преимущество. */
function CounterRow({ counter }: { counter: CounterBreakdown }) {
  const moe = marginOfError(counter.games);
  const weak = sampleQuality(counter.games) === 'low';
  return (
    <li className={weak ? 'is-weak' : undefined}>
      <span className="cr-name">{counter.enemy.localized_name}</span>
      <span className="cr-wr">
        {counter.winrate.toFixed(1)}%
        <span className="cr-moe"> ±{moe.toFixed(1)}</span>
      </span>
      <span className="cr-games">{counter.games} games</span>
      <span className={`cr-adv ${counter.advantage >= 0 ? 'pos' : 'neg'}`}>{fmt(counter.advantage)}</span>
    </li>
  );
}

function Bar({
  label,
  value,
  quality,
}: {
  label: string;
  value: number;
  quality?: 'low' | 'medium' | 'high';
}) {
  // Полоса растёт от центра: вправо — плюс, влево — минус. Шкала ±8.
  const half = Math.min(Math.abs(value) / 8, 1) * 50;
  return (
    <div className="bar">
      <span className="bar-label">
        {label}
        {quality === 'low' && (
          <span className="warn-dot" title="Sample too small to be reliable">
            !
          </span>
        )}
      </span>
      <div className="bar-track">
        <div className="bar-zero" />
        <div
          className={`bar-fill ${value >= 0 ? 'pos' : 'neg'}`}
          style={{ width: `${half}%`, left: value >= 0 ? '50%' : `${50 - half}%` }}
        />
      </div>
      <span className={`bar-value ${value >= 0 ? 'pos' : 'neg'}`}>{fmt(value)}</span>
    </div>
  );
}

/** Минус пишем настоящим знаком, а не дефисом — так колонка чисел читается ровнее. */
function fmt(n: number): string {
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2);
}
