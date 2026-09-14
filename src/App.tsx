import { useState } from 'react';
import type { Bracket, Hero, Weights } from './types';
import { useHeroes } from './hooks/useDota';
import { DEFAULT_WEIGHTS } from './lib/score';
import { DraftTab } from './components/DraftTab';
import { BuildsTab } from './components/BuildsTab';
import { clearCache } from './api/cache';

type Tab = 'draft' | 'builds';

export function App() {
  const heroes = useHeroes();
  const [tab, setTab] = useState<Tab>('draft');
  const [bracket, setBracket] = useState<Bracket | 'all'>('all');
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  // Драфт живёт здесь, чтобы вкладка «Билды» могла его переиспользовать.
  const [enemies, setEnemies] = useState<(Hero | null)[]>(Array(5).fill(null));
  const [allies, setAllies] = useState<(Hero | null)[]>(Array(4).fill(null));

  const setSlot = (side: 'enemy' | 'ally', index: number, hero: Hero | null) => {
    const update = (prev: (Hero | null)[]) => {
      const next = [...prev];
      next[index] = hero;
      return next;
    };
    if (side === 'enemy') setEnemies(update);
    else setAllies(update);
  };

  const reset = () => {
    setEnemies(Array(5).fill(null));
    setAllies(Array(4).fill(null));
  };

  if (heroes.loading) return <div className="center muted">Загрузка героев…</div>;
  if (heroes.error || !heroes.data) {
    return (
      <div className="center">
        <p className="error">{heroes.error ?? 'Не удалось загрузить данные'}</p>
        <button
          className="btn-ghost"
          onClick={() => {
            clearCache();
            location.reload();
          }}
        >
          Сбросить кэш и повторить
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="tabs">
        <button className={tab === 'draft' ? 'active' : ''} onClick={() => setTab('draft')}>
          Драфт
        </button>
        <button className={tab === 'builds' ? 'active' : ''} onClick={() => setTab('builds')}>
          Билды
        </button>
      </nav>

      {tab === 'draft' ? (
        <DraftTab
          heroes={heroes.data}
          enemies={enemies}
          allies={allies}
          setSlot={setSlot}
          reset={reset}
          bracket={bracket}
          setBracket={setBracket}
          weights={weights}
          setWeights={setWeights}
        />
      ) : (
        <BuildsTab
          heroes={heroes.data}
          bracket={bracket}
          enemies={enemies.filter((h): h is Hero => h !== null)}
        />
      )}
    </div>
  );
}
