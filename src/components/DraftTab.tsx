import { useMemo, useState } from 'react';
import type { Bracket, Hero, Weights } from '../types';
import { useMatchups } from '../hooks/useDota';
import { buildSuggestions } from '../lib/score';
import { HeroPicker } from './HeroPicker';
import { HeroSlot } from './HeroSlot';
import { SuggestionCard } from './SuggestionCard';

const ENEMY_SLOTS = 5;
const ALLY_SLOTS = 4;
const ROLES = ['Carry', 'Support', 'Initiator', 'Disabler', 'Nuker', 'Durable', 'Escape', 'Pusher'];

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
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [showTuning, setShowTuning] = useState(false);

  const pickedEnemies = enemies.filter((h): h is Hero => h !== null);
  const pickedAllies = allies.filter((h): h is Hero => h !== null);

  const enemyIds = pickedEnemies.map((h) => h.id);
  const matchups = useMatchups(enemyIds);

  const suggestions = useMemo(() => {
    if (pickedEnemies.length === 0 && pickedAllies.length === 0) return [];
    return buildSuggestions({
      heroes,
      enemies: pickedEnemies,
      allies: pickedAllies,
      matchups: matchups.data ?? new Map(),
      bracket,
      weights,
      roleFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes, enemyIds.join(','), pickedAllies.map((h) => h.id).join(','), matchups.data, bracket, weights, roleFilter]);

  const takenIds = new Set([...pickedEnemies, ...pickedAllies].map((h) => h.id));

  return (
    <div className="tab">
      <section className="draft-side">
        <h3>Драфт соперника</h3>
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
        <h3>Ваша команда (4 союзника)</h3>
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
        </div>
      </section>

      <div className="controls">
        <label>
          Ранг
          <select
            value={String(bracket)}
            onChange={(e) => setBracket(e.target.value === 'all' ? 'all' : (Number(e.target.value) as Bracket))}
          >
            <option value="all">Все ранги</option>
            <option value="1">Herald</option>
            <option value="2">Guardian</option>
            <option value="3">Crusader</option>
            <option value="4">Archon</option>
            <option value="5">Legend</option>
            <option value="6">Ancient</option>
            <option value="7">Divine</option>
            <option value="8">Immortal</option>
          </select>
        </label>

        <label>
          Роль
          <select value={roleFilter ?? ''} onChange={(e) => setRoleFilter(e.target.value || null)}>
            <option value="">Любая</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button className="btn-ghost" onClick={() => setShowTuning((v) => !v)}>
          Веса
        </button>
        <button className="btn-ghost" onClick={reset}>
          Сброс
        </button>
      </div>

      {showTuning && (
        <div className="tuning">
          <WeightSlider
            label="Контрпик"
            value={weights.counter}
            onChange={(v) => setWeights({ ...weights, counter: v })}
          />
          <WeightSlider
            label="Синергия"
            value={weights.synergy}
            onChange={(v) => setWeights({ ...weights, synergy: v })}
          />
          <WeightSlider label="Мета" value={weights.meta} onChange={(v) => setWeights({ ...weights, meta: v })} />
        </div>
      )}

      {matchups.loading && <p className="muted">Загрузка матчапов…</p>}
      {matchups.error && <p className="error">{matchups.error}</p>}

      <section className="results">
        <h3>Кого брать последним пиком</h3>
        {suggestions.length === 0 ? (
          <p className="muted">Выберите хотя бы одного вражеского героя.</p>
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
          title={picking.side === 'enemy' ? 'Выберите вражеского героя' : 'Выберите союзника'}
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
      <span>
        {label} <b>{value.toFixed(1)}</b>
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
