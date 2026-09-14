import { useMemo, useState } from 'react';
import type { Bracket, Hero, Weights } from '../types';
import { useMatchups, useStats } from '../hooks/useDota';
import { buildSuggestions, DEFAULT_WEIGHTS } from '../lib/score';
import { HeroPicker } from './HeroPicker';
import { HeroSlot, LastPickSlot } from './HeroSlot';
import { SuggestionCard } from './SuggestionCard';
import { POSITION_LABEL, type Position } from '../data/positions';
import { Select } from './Select';

const ENEMY_SLOTS = 5;
const ALLY_SLOTS = 4;
const POSITIONS: Position[] = [1, 2, 3, 4, 5];
const BRACKETS = [
  { value: 'all', label: 'All Ranks' },
  { value: '1', label: 'Herald' },
  { value: '2', label: 'Guardian' },
  { value: '3', label: 'Crusader' },
  { value: '4', label: 'Archon' },
  { value: '5', label: 'Legend' },
  { value: '6', label: 'Ancient' },
  { value: '7', label: 'Divine' },
  { value: '8', label: 'Immortal' },
];

interface Props {
  heroes: Hero[];
  enemies: (Hero | null)[];
  allies: (Hero | null)[];
  setSlot(side: 'enemy' | 'ally', index: number, hero: Hero | null): void;
  reset(): void;
  bracket: Bracket | 'all';
  setBracket(b: Bracket | 'all'): void;
  weights: Weights;
  setWeights(w: Weights): void;
}

export function DraftTab({
  heroes,
  enemies,
  allies,
  setSlot,
  reset,
  bracket,
  setBracket,
  weights,
  setWeights,
}: Props) {
  const [picking, setPicking] = useState<{ side: 'enemy' | 'ally'; index: number } | null>(null);
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [showTuning, setShowTuning] = useState(false);

  const pickedEnemies = enemies.filter((h): h is Hero => h !== null);
  const pickedAllies = allies.filter((h): h is Hero => h !== null);

  const enemyIds = pickedEnemies.map((h) => h.id);
  const matchups = useMatchups(enemyIds);
  const stats = useStats();

  const suggestions = useMemo(() => {
    if (pickedEnemies.length === 0 && pickedAllies.length === 0) return [];
    return buildSuggestions({
      heroes,
      enemies: pickedEnemies,
      allies: pickedAllies,
      matchups: matchups.data ?? new Map(),
      stats,
      bracket,
      weights,
      positionFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    heroes,
    enemyIds.join(','),
    pickedAllies.map((h) => h.id).join(','),
    matchups.data,
    stats,
    bracket,
    weights,
    positionFilter,
  ]);

  const takenIds = new Set([...pickedEnemies, ...pickedAllies].map((h) => h.id));
  const topPick = suggestions[0]?.hero ?? null;

  return (
    <div className="tab">
      <section className="draft-side">
        <h3 className="section-head">
          Enemy Draft
          <span className="section-count">{pickedEnemies.length} / {ENEMY_SLOTS}</span>
        </h3>
        <div className="slots">
          {Array.from({ length: ENEMY_SLOTS }, (_, i) => (
            <HeroSlot
              key={i}
              variant="enemy"
              hero={enemies[i] ?? null}
              onClick={() => setPicking({ side: 'enemy', index: i })}
              onClear={() => setSlot('enemy', i, null)}
            />
          ))}
        </div>
      </section>

      <section className="draft-side">
        <h3 className="section-head">
          Your Team
          <span className="section-count">{pickedAllies.length} / {ALLY_SLOTS}</span>
        </h3>
        <div className="slots">
          {Array.from({ length: ALLY_SLOTS }, (_, i) => (
            <HeroSlot
              key={i}
              variant="ally"
              hero={allies[i] ?? null}
              onClick={() => setPicking({ side: 'ally', index: i })}
              onClear={() => setSlot('ally', i, null)}
            />
          ))}
          <LastPickSlot suggested={topPick} />
        </div>
      </section>

      <div className="controls">
        <Select
          value={String(bracket)}
          options={BRACKETS}
          onChange={(v) => setBracket(v === 'all' ? 'all' : (Number(v) as Bracket))}
          ariaLabel="Rank"
        />

        <button
          className={`control-icon${showTuning ? ' is-on' : ''}`}
          onClick={() => setShowTuning((v) => !v)}
          aria-label="Score weights"
        >
          ⚙
        </button>
      </div>

      <div className="chips">
        <button
          className={`chip${positionFilter === null ? ' is-on' : ''}`}
          onClick={() => setPositionFilter(null)}
        >
          All
        </button>
        {POSITIONS.map((p) => (
          <button
            key={p}
            className={`chip${positionFilter === p ? ' is-on' : ''}`}
            onClick={() => setPositionFilter(positionFilter === p ? null : p)}
          >
            {POSITION_LABEL[p]}
          </button>
        ))}
      </div>

      {showTuning && (
        <div className="tuning">
          <h4 className="section-head">
            Score Weights
            <span className="section-count">0 — 2, step 0.1</span>
          </h4>
          <WeightSlider
            label="Counter"
            value={weights.counter}
            onChange={(v) => setWeights({ ...weights, counter: v })}
          />
          <WeightSlider
            label="Synergy"
            value={weights.synergy}
            onChange={(v) => setWeights({ ...weights, synergy: v })}
          />
          <WeightSlider label="Meta" value={weights.meta} onChange={(v) => setWeights({ ...weights, meta: v })} />
          <div className="tuning-foot">
            <button className="btn-ghost btn-accent" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
              Defaults
            </button>
            {/* «Сброс» держим здесь, вдали от часто нажимаемых слотов */}
            <button className="btn-ghost" onClick={reset}>
              Clear Draft
            </button>
          </div>
        </div>
      )}

      {matchups.loading && suggestions.length > 0 && (
        <div className="refreshing">
          Loading matchups… <span>showing previous data</span>
        </div>
      )}
      {matchups.error && <p className="error small">{matchups.error}</p>}

      <section className="results">
        <h3 className="section-head">
          Best Picks
          {suggestions.length > 0 && <span className="section-count">{suggestions.length} heroes</span>}
        </h3>
        {suggestions.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Pick at least one enemy hero.</p>
            <p className="empty-sub">Suggestions appear right after the first one.</p>
          </div>
        ) : (
          suggestions
            .slice(0, 15)
            .map((s, i) => (
              <SuggestionCard key={s.hero.id} suggestion={s} rank={i + 1} enemies={pickedEnemies} />
            ))
        )}
      </section>

      {picking && (
        <HeroPicker
          heroes={heroes}
          disabledIds={takenIds}
          bracket={bracket}
          title={picking.side === 'enemy' ? 'Select Enemy Hero' : 'Select Ally'}
          onPick={(hero) => {
            setSlot(picking.side, picking.index, hero);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(v: number): void;
}) {
  return (
    <label className="slider">
      <span className="slider-head">
        {label}
        <b className="slider-value">{value.toFixed(1)}</b>
      </span>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
